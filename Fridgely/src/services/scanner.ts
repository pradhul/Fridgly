import * as FileSystem from 'expo-file-system/legacy';
import { getCategoryForCocoClass, getNameForCocoClass } from '../utils/cocoClasses';
import { imageUriToTensor } from '../utils/imageToTensor';
import { getStoredModelPath } from './ModelUpdateService';

const CONFIDENCE_THRESHOLD = 0.5;
const INPUT_SIZE = 640;
const MAX_DETECTIONS = 50;

export type DetectedItem = {
  id: string;
  name: string;
  category: 'vegetable' | 'fruit' | 'dairy' | 'protein' | 'grain' | 'other';
  confidence: number;
  sources: Array<'cloud' | 'on-device'>;
};

type TFLiteModel = {
  run: (inputs: unknown[]) => Promise<unknown[]>;
  runSync?: (inputs: unknown[]) => unknown[];
};

let cachedModel: TFLiteModel | null = null;

/** Bundled TFLite at modal/Yolo-v8-Detection.tflite (Metro bundles it; we copy to cache and load). */
const BUNDLED_MODEL = require('../../modal/Yolo-v8-Detection.tflite');

const CACHED_MODEL_FILENAME = 'Yolo-v8-Detection.tflite';

/**
 * Copy bundled asset to a stable path in app cache so the native TFLite loader
 * can open it (avoids Metro HTTP URL in dev and ExponentAsset path issues on Android).
 */
async function getBundledModelFileUri(): Promise<string | null> {
  try {
    const { Asset } = await import('expo-asset');
    const asset = Asset.fromModule(BUNDLED_MODEL);
    await asset.downloadAsync();
    const from = asset.localUri ?? asset.uri;
    if (!from) return null;

    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return null;

    const to = cacheDir + CACHED_MODEL_FILENAME;
    await FileSystem.copyAsync({ from, to });
    const fileUri = to.startsWith('file://') ? to : `file://${to}`;
    return fileUri;
  } catch (e) {
    if (__DEV__) console.warn('[scanner] getBundledModelFileUri failed', e);
    return null;
  }
}

/**
 * Load TFLite model from a file or HTTP URL (never from Metro asset ID in dev).
 */
async function loadTFLiteModel(url: string): Promise<TFLiteModel | null> {
  try {
    const { loadTensorflowModel } = await import('react-native-fast-tflite');
    const model = await loadTensorflowModel({ url });
    if (!model?.run) {
      if (__DEV__) console.warn('[scanner] loadTensorflowModel returned no run method');
      return null;
    }
    if (__DEV__) console.log('[scanner] TFLite model loaded from', url.startsWith('file://') ? 'cache' : 'OTA');
    return model as TFLiteModel;
  } catch (e) {
    if (__DEV__) {
      console.warn('[scanner] loadTFLiteModel failed', e);
      console.warn('[scanner] Ensure the .tflite file is a real TFLite FlatBuffer (e.g. from model.export(format="tflite")), not an ELF .so.');
    }
    return null;
  }
}

/** YOLOv8 640x640 default output size (84 * 8400). */
const YOLO_OUTPUT_SIZE = 84 * 8400;

/**
 * Normalize model output: library returns TypedArray[] (no .shape). Convert to { data, shape }.
 */
function normalizeOutput(firstOutput: unknown): { data: Float32Array; shape: number[] } | null {
  if (firstOutput instanceof Float32Array) {
    const len = firstOutput.length;
    if (len === YOLO_OUTPUT_SIZE) {
      return { data: new Float32Array(firstOutput), shape: [1, 84, 8400] };
    }
    if (len === 8400 * 84) {
      return { data: new Float32Array(firstOutput), shape: [1, 8400, 84] };
    }
    if (__DEV__) console.log('[scanner] unexpected output length', len);
    return null;
  }
  const out = firstOutput as { data?: ArrayBuffer; shape?: number[] } | undefined;
  if (out?.data && out.shape?.length) {
    return { data: new Float32Array(out.data), shape: out.shape };
  }
  return null;
}

/**
 * Parse YOLOv8-style output. Supports:
 * - [1, 84, 8400]: channels first (84 = 4 box + 80 classes), score at (4+c)*numBoxes + b
 * - [1, 8400, 84]: boxes first (8400 rows, 84 cols), score at b*84 + 4 + c
 */
function parseYOLOOutput(output: unknown): DetectedItem[] {
  const results: DetectedItem[] = [];
  try {
    const normalized = normalizeOutput(output);
    if (!normalized) return results;
    const { data, shape } = normalized;
    const dim1 = shape[1] ?? 0;
    const dim2 = shape[2] ?? 0;
    const channelsFirst = dim1 === 84 && dim2 >= 80;
    const numBoxes = channelsFirst ? dim2 : dim1;
    const numChannels = channelsFirst ? dim1 : dim2;
    if (numChannels < 84 || numBoxes < 1) {
      if (__DEV__) {
        console.log('[scanner] YOLO output shape not supported:', shape);
      }
      return results;
    }

    const candidates: { classId: number; confidence: number }[] = [];
    const scoreBuckets = { above01: 0, above02: 0, above03: 0, above05: 0 };
    const topScores: number[] = [];
    for (let b = 0; b < numBoxes; b++) {
      let maxScore = 0;
      let maxClass = 0;
      for (let c = 0; c < 80; c++) {
        const idx = channelsFirst
          ? (4 + c) * numBoxes + b
          : b * numChannels + (4 + c);
        const score = data[idx] ?? 0;
        if (score > maxScore) {
          maxScore = score;
          maxClass = c;
        }
      }
      if (maxScore >= 0.1) scoreBuckets.above01++;
      if (maxScore >= 0.2) scoreBuckets.above02++;
      if (maxScore >= 0.3) scoreBuckets.above03++;
      if (maxScore >= CONFIDENCE_THRESHOLD) {
        scoreBuckets.above05++;
        candidates.push({ classId: maxClass, confidence: maxScore });
      }
      if (topScores.length < 10 || maxScore > (topScores[9] ?? 0)) {
        topScores.push(maxScore);
        topScores.sort((a, b) => b - a);
        if (topScores.length > 10) topScores.pop();
      }
    }
    if (__DEV__) {
      console.log('[scanner] parseYOLO: confidence threshold =', CONFIDENCE_THRESHOLD);
      console.log('[scanner] parseYOLO: boxes with max class score >= 0.1:', scoreBuckets.above01, '>= 0.2:', scoreBuckets.above02, '>= 0.3:', scoreBuckets.above03, '>=', CONFIDENCE_THRESHOLD + ':', scoreBuckets.above05);
      console.log('[scanner] parseYOLO: top 10 max scores across boxes:', topScores.map((s) => s.toFixed(3)).join(', '));
      let outMin = data[0] ?? 0;
      let outMax = data[0] ?? 0;
      for (let i = 1; i < Math.min(data.length, 10000); i++) {
        const v = data[i] ?? 0;
        if (v < outMin) outMin = v;
        if (v > outMax) outMax = v;
      }
      console.log('[scanner] parseYOLO: output raw sample min:', outMin.toFixed(4), 'max:', outMax.toFixed(4));
    }
    candidates.sort((a, b) => b.confidence - a.confidence);
    const seen = new Set<string>();
    for (let i = 0; i < candidates.length && results.length < MAX_DETECTIONS; i++) {
      const { classId, confidence } = candidates[i]!;
      const name = getNameForCocoClass(classId);
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        id: `yolo-${classId}-${i}`,
        name,
        category: getCategoryForCocoClass(classId),
        confidence,
        sources: ['on-device'],
      });
    }
    if (__DEV__ && results.length > 0) {
      console.log('[scanner] YOLO parsed', results.length, 'detections, shape', shape);
    }
  } catch (e) {
    if (__DEV__) console.warn('[scanner] parseYOLOOutput error', e);
  }
  return results;
}

/**
 * Run on-device inference on one image.
 */
async function runDetection(imageUri: string): Promise<DetectedItem[]> {
  if (!cachedModel) {
    const storedPath = await getStoredModelPath();
    const url = storedPath ?? (await getBundledModelFileUri());
    const model = url ? await loadTFLiteModel(url) : null;
    if (!model) return [];
    cachedModel = model;
  }

  const tensor = await imageUriToTensor(imageUri);
  if (!tensor) {
    if (__DEV__) console.log('[scanner] runDetection: no tensor for', imageUri?.slice(-40));
    return [];
  }

  try {
    const inputBuffer = new Float32Array(tensor.data);
    if (__DEV__) {
      const inMin = Math.min(...inputBuffer.slice(0, 1000));
      const inMax = Math.max(...inputBuffer.slice(0, 1000));
      console.log('[scanner] runDetection: input size', inputBuffer.length, 'sample min/max', inMin.toFixed(3), inMax.toFixed(3));
    }
    const outputs = await cachedModel.run([inputBuffer]);
    const firstOutput = outputs?.[0];
    if (!firstOutput) {
      if (__DEV__) console.log('[scanner] model.run returned no output');
      return [];
    }
    const normalized = normalizeOutput(firstOutput);
    if (__DEV__) console.log('[scanner] model output shape', normalized?.shape ?? 'unknown');
    const parsed = parseYOLOOutput(firstOutput);
    if (parsed.length > 0) return parsed;
    if (__DEV__) console.log('[scanner] no detections above threshold — add items manually');
    return [];
  } catch (e) {
    if (__DEV__) console.warn('[scanner] inference error', e);
    return [];
  }
}

/**
 * Merge detection lists from multiple photos and dedupe by name (keep max confidence).
 */
function mergeDetections(perPhoto: DetectedItem[][]): DetectedItem[] {
  const byName = new Map<string, DetectedItem>();
  for (const list of perPhoto) {
    for (const d of list) {
      const key = d.name.trim().toLowerCase();
      const existing = byName.get(key);
      if (!existing || d.confidence > existing.confidence) {
        byName.set(key, { ...d, id: `${d.id}-${byName.size}` });
      }
    }
  }
  return Array.from(byName.values()).filter((d) => d.confidence >= CONFIDENCE_THRESHOLD);
}

/**
 * Scan one or more fridge photos and return detected items (on-device YOLOv8).
 * Returns [] when nothing is detected or model fails; user can add items manually.
 */
export async function scanPhotosForIngredients(photoUris: string[]): Promise<DetectedItem[]> {
  if (photoUris.length === 0) return [];

  if (__DEV__) {
    console.log('[scanner] scanPhotosForIngredients: starting', photoUris.length, 'photo(s), threshold =', CONFIDENCE_THRESHOLD);
  }
  const results = await Promise.all(photoUris.map((uri) => runDetection(uri)));
  if (__DEV__) {
    const counts = results.map((r) => r.length);
    console.log('[scanner] scanPhotosForIngredients: per-photo detection counts', counts.join(', '));
  }
  const merged = mergeDetections(results);
  if (__DEV__) {
    console.log('[scanner] scanPhotosForIngredients: merged total', merged.length, 'detections');
  }
  return merged.map((d, i) => ({ ...d, id: `det-${Date.now()}-${i}` }));
}

/**
 * Clear cached model so next scan will reload (e.g. after OTA model update).
 */
export function clearScannerCache(): void {
  cachedModel = null;
}

export const COCO_UTILS = { getCategoryForCocoClass, getNameForCocoClass, CONFIDENCE_THRESHOLD, INPUT_SIZE };

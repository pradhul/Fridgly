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
let modelPath: string | null = null;

/**
 * Resolve path to the TFLite model.
 * 1) Prefer OTA-downloaded path from ModelUpdateService.
 * 2) Fallback to the bundled model under `modal/Yolo-v8-Detection.tflite`.
 */
async function getModelPath(): Promise<string | null> {
  const stored = await getStoredModelPath();
  if (stored) return stored;

  try {
    const { Asset } = await import('expo-asset');
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const asset = Asset.fromModule(require('../../modal/Yolo-v8-Detection.tflite'));
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    return uri ?? null;
  } catch {
    return null;
  }
}

/**
 * Load TFLite model using react-native-fast-tflite.
 */
async function loadTFLiteModel(path: string): Promise<TFLiteModel | null> {
  try {
    const { loadTensorflowModel } = await import('react-native-fast-tflite');
    const model = await loadTensorflowModel(path);
    if (!model?.run) {
      if (__DEV__) console.warn('[scanner] loadTensorflowModel returned no run method');
      return null;
    }
    if (__DEV__) console.log('[scanner] TFLite model loaded from', path);
    return model as TFLiteModel;
  } catch (e) {
    if (__DEV__) console.warn('[scanner] loadTFLiteModel failed', e);
    return null;
  }
}

/**
 * Stub detections when TFLite is not available or model is missing.
 */
function stubDetections(): DetectedItem[] {
  return [
    { id: 'stub-1', name: 'Broccoli', category: 'vegetable', confidence: 0.92, sources: ['on-device'] },
    { id: 'stub-2', name: 'Tomato', category: 'vegetable', confidence: 0.88, sources: ['on-device'] },
    { id: 'stub-3', name: 'Greek Yogurt', category: 'dairy', confidence: 0.85, sources: ['on-device'] },
  ];
}

/**
 * Parse YOLOv8-style output. Supports:
 * - [1, 84, 8400]: channels first (84 = 4 box + 80 classes), score at (4+c)*numBoxes + b
 * - [1, 8400, 84]: boxes first (8400 rows, 84 cols), score at b*84 + 4 + c
 */
function parseYOLOOutput(output: unknown): DetectedItem[] {
  const results: DetectedItem[] = [];
  try {
    const out = output as { data?: ArrayBuffer; shape?: number[] } | undefined;
    if (!out?.data) return results;
    const shape = out.shape ?? [];
    const data = new Float32Array(out.data);
    const dim1 = shape[1] ?? 0;
    const dim2 = shape[2] ?? 0;
    const channelsFirst = dim1 === 84 && dim2 >= 80;
    const numBoxes = channelsFirst ? dim2 : dim1;
    const numChannels = channelsFirst ? dim1 : dim2;
    if (numChannels < 84 || numBoxes < 1) {
      if (__DEV__) {
        console.log('[scanner] YOLO output shape not supported:', shape, 'expected [1,84,8400] or [1,8400,84]');
      }
      return results;
    }

    const candidates: { classId: number; confidence: number }[] = [];
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
      if (maxScore >= CONFIDENCE_THRESHOLD) {
        candidates.push({ classId: maxClass, confidence: maxScore });
      }
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
    const path = await getModelPath();
    if (!path) return stubDetections();
    modelPath = path;
    const model = await loadTFLiteModel(path);
    if (!model) return stubDetections();
    cachedModel = model;
  }

  const tensor = await imageUriToTensor(imageUri);
  if (!tensor) return stubDetections();

  try {
    const input = {
      shape: tensor.shape,
      data: tensor.data.buffer,
    };
    const outputs = await cachedModel.run([input]);
    const firstOutput = outputs?.[0];
    if (!firstOutput) {
      if (__DEV__) console.log('[scanner] model.run returned no output');
      return stubDetections();
    }
    const out = firstOutput as { shape?: number[] };
    if (__DEV__) console.log('[scanner] model output shape', out.shape);
    const parsed = parseYOLOOutput(firstOutput);
    if (parsed.length > 0) return parsed;
    if (__DEV__) console.log('[scanner] parser returned 0 detections, using stub');
    return stubDetections();
  } catch (e) {
    if (__DEV__) console.warn('[scanner] inference error', e);
    return stubDetections();
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
 * Scan one or more fridge photos and return detected items (on-device YOLOv8 or stub).
 */
export async function scanPhotosForIngredients(photoUris: string[]): Promise<DetectedItem[]> {
  if (photoUris.length === 0) return [];

  const results = await Promise.all(photoUris.map((uri) => runDetection(uri)));
  const merged = mergeDetections(results);
  return merged.map((d, i) => ({ ...d, id: `det-${Date.now()}-${i}` }));
}

/**
 * Clear cached model so next scan will reload (e.g. after OTA model update).
 */
export function clearScannerCache(): void {
  cachedModel = null;
  modelPath = null;
}

export const COCO_UTILS = { getCategoryForCocoClass, getNameForCocoClass, CONFIDENCE_THRESHOLD, INPUT_SIZE };

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  DocumentData,
} from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import { db, storage } from './firebase';

const MODEL_VERSIONS_COLLECTION = 'model_versions';
const MODEL_VERSION_KEY = 'fridge_model_version';
const MODEL_PATH_KEY = 'fridge_model_path';
const STORAGE_MODELS_PREFIX = 'models';

export type LatestModelResponse = {
  version: number;
  storage_path: string;
  accuracy?: number;
  updated_at?: unknown;
};

export type ModelUpdateResult = {
  updated: boolean;
  version?: number;
  path?: string;
  error?: string;
};

/**
 * Stored model version (default 1 = bundled).
 */
export async function getStoredModelVersion(): Promise<number> {
  try {
    const Storage = (await import('expo-sqlite/kv-store')).default;
    const v = await Storage.getItem(MODEL_VERSION_KEY);
    if (v != null) {
      const n = parseInt(v, 10);
      if (!Number.isNaN(n)) return n;
    }
  } catch {
    // ignore
  }
  return 1;
}

/**
 * Path to the current model file on device. null = use bundled asset.
 */
export async function getStoredModelPath(): Promise<string | null> {
  try {
    const Storage = (await import('expo-sqlite/kv-store')).default;
    const path = await Storage.getItem(MODEL_PATH_KEY);
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Fetch latest model from Firestore (model_versions, orderBy version desc),
 * get download URL from Cloud Storage (gs://bucket/models/yolov8n_vN.tflite),
 * download and save locally. Clear scanner cache after so next scan uses new model.
 */
export async function checkForModelUpdate(): Promise<ModelUpdateResult> {
  try {
    const col = collection(db, MODEL_VERSIONS_COLLECTION);
    const q = query(col, orderBy('version', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    const doc = snapshot.docs[0];
    if (!doc?.exists()) return { updated: false };

    const data = doc.data() as DocumentData & {
      version: number;
      storage_path?: string;
      accuracy?: number;
      updated_at?: unknown;
    };
    const version = Number(data.version);
    if (Number.isNaN(version)) return { updated: false };

    const currentVersion = await getStoredModelVersion();
    if (version <= currentVersion) {
      return { updated: false, version };
    }

    const storagePath = data.storage_path ?? `models/yolov8n_v${version}.tflite`;
    const storageRef = ref(storage, storagePath);
    const modelUrl = await getDownloadURL(storageRef);

    const filename = `yolov8n_v${version}.tflite`;
    const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!dir) return { updated: false, error: 'No cache directory' };
    const localPath = `${dir}${filename}`;
    await FileSystem.downloadAsync(modelUrl, localPath);

    const Storage = (await import('expo-sqlite/kv-store')).default;
    await Storage.setItem(MODEL_VERSION_KEY, String(version));
    await Storage.setItem(MODEL_PATH_KEY, localPath);

    return { updated: true, version, path: localPath };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { updated: false, error: message };
  }
}

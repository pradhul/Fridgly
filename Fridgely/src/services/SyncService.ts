import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import {
  getUnsyncedFeedback,
  markAllFeedbackSynced,
  type FeedbackRow,
} from './DatabaseService';
import { FEEDBACK_SYNC_INTERVAL_MS } from '../utils/constants';

export type SyncResult = { success: boolean; count: number; error?: string };

const FEEDBACK_COLLECTION = 'feedback';
const DEFAULT_MODEL_VERSION = 1;

/**
 * Stable user id for this device (no auth). Replace with auth.uid() when you add Firebase Auth.
 */
function getUserId(): string {
  return 'local-user';
}

/**
 * Sync unsynced feedback to Firestore. Each row becomes one document in `feedback`.
 * Marks local rows as synced on success.
 */
export async function syncFeedbackToBackend(): Promise<SyncResult> {
  const feedback = await getUnsyncedFeedback();
  if (feedback.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const col = collection(db, FEEDBACK_COLLECTION);
    const userId = getUserId();

    for (const row of feedback) {
      await addDoc(col, {
        detected_as: row.detected_as,
        corrected_to: row.corrected_to,
        confidence: row.confidence,
        correct: row.correct === 1,
        timestamp: serverTimestamp(),
        user_id: userId,
        model_version: DEFAULT_MODEL_VERSION,
      });
    }

    await markAllFeedbackSynced();
    return { success: true, count: feedback.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, count: feedback.length, error: message };
  }
}

/**
 * Run sync on startup and every FEEDBACK_SYNC_INTERVAL_MS (e.g. 24h).
 */
export function scheduleFeedbackSync(onSync?: (result: SyncResult) => void): () => void {
  const run = async () => {
    const result = await syncFeedbackToBackend();
    onSync?.(result);
  };
  void run();
  const intervalId = setInterval(run, FEEDBACK_SYNC_INTERVAL_MS);
  return () => clearInterval(intervalId);
}

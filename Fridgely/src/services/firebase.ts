import { initializeApp, getApp, getApps } from 'firebase/app';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export type FirebaseConnectionResult = { ok: true } | { ok: false; error: string };

/**
 * Verify Firebase is configured and Firestore is reachable (for feedback/training data storage).
 */
export async function verifyFirebaseConnection(): Promise<FirebaseConnectionResult> {
  if (!firebaseConfig.projectId?.trim()) {
    return {
      ok: false,
      error: 'Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* in .env or app config.',
    };
  }
  try {
    const col = collection(db, 'feedback');
    await getDocs(query(col, limit(1)));
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}


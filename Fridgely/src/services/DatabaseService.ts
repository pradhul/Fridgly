import * as SQLite from 'expo-sqlite';
import type { InventoryItem } from '../data/mockInventory';

const DB_NAME = 'fridge.db';

export type FeedbackRow = {
  id: number;
  detected_as: string;
  corrected_to: string;
  confidence: number;
  correct: number; // 0 or 1
  synced: number; // 0 or 1
  timestamp: string;
};

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pantry (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      source TEXT,
      confidence REAL,
      detected_as TEXT,
      confirmed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      detected_as TEXT NOT NULL,
      corrected_to TEXT NOT NULL,
      confidence REAL NOT NULL,
      correct INTEGER NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

export async function initDatabase(): Promise<void> {
  await getDb();
}

export async function getPantry(): Promise<InventoryItem[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    emoji: string;
    source: string | null;
    confidence: number | null;
    detected_as: string | null;
    confirmed: number;
  }>('SELECT id, name, emoji, source, confidence, detected_as, confirmed FROM pantry ORDER BY created_at ASC');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    confirmed: r.confirmed === 1,
    source: (r.source as 'scan' | 'manual') ?? undefined,
    confidence: r.confidence ?? undefined,
    detectedAs: r.detected_as ?? undefined,
  }));
}

export async function savePantryItem(item: InventoryItem): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO pantry (id, name, emoji, source, confidence, detected_as, confirmed, created_at)
     VALUES ($id, $name, $emoji, $source, $confidence, $detected_as, $confirmed, COALESCE((SELECT created_at FROM pantry WHERE id = $id), datetime('now')))`,
    {
      $id: item.id,
      $name: item.name,
      $emoji: item.emoji,
      $source: item.source ?? null,
      $confidence: item.confidence ?? null,
      $detected_as: item.detectedAs ?? null,
      $confirmed: item.confirmed ? 1 : 0,
    }
  );
}

export async function savePantryItems(items: InventoryItem[]): Promise<void> {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    for (const item of items) {
      await database.runAsync(
        `INSERT OR REPLACE INTO pantry (id, name, emoji, source, confidence, detected_as, confirmed, created_at)
         VALUES ($id, $name, $emoji, $source, $confidence, $detected_as, $confirmed, COALESCE((SELECT created_at FROM pantry WHERE id = $id), datetime('now')))`,
        {
          $id: item.id,
          $name: item.name,
          $emoji: item.emoji,
          $source: item.source ?? null,
          $confidence: item.confidence ?? null,
          $detected_as: item.detectedAs ?? null,
          $confirmed: item.confirmed ? 1 : 0,
        }
      );
    }
  });
}

export async function deletePantryItem(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM pantry WHERE id = ?', id);
}

export async function saveFeedback(entry: {
  detected_as: string;
  corrected_to: string;
  confidence: number;
  correct: boolean;
}): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO feedback (detected_as, corrected_to, confidence, correct, synced) VALUES ($detected_as, $corrected_to, $confidence, $correct, 0)`,
    {
      $detected_as: entry.detected_as,
      $corrected_to: entry.corrected_to,
      $confidence: entry.confidence,
      $correct: entry.correct ? 1 : 0,
    }
  );
}

export async function getUnsyncedFeedback(): Promise<FeedbackRow[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<FeedbackRow>(
    'SELECT id, detected_as, corrected_to, confidence, correct, synced, timestamp FROM feedback WHERE synced = 0 ORDER BY id ASC'
  );
  return rows;
}

export async function markFeedbackSynced(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const database = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await database.runAsync(`UPDATE feedback SET synced = 1 WHERE id IN (${placeholders})`, ...ids);
}

export async function markAllFeedbackSynced(): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE feedback SET synced = 1 WHERE synced = 0');
}

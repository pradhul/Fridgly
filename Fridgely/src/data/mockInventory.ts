export type InventoryItem = {
  id: string;
  name: string;
  emoji: string;
  confirmed: boolean;
  source?: 'scan' | 'manual';
  confidence?: number; // 0–1
  /** Model's original label when item came from scan; used for feedback logging. */
  detectedAs?: string;
};

/** Start with empty; pantry loads from DB on app init. */
export const initialInventory: InventoryItem[] = [];


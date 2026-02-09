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

export const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Broccoli', emoji: '🥦', confirmed: true, source: 'manual' },
  { id: '2', name: 'Tomatoes', emoji: '🍅', confirmed: true, source: 'manual' },
  { id: '3', name: 'Lemon', emoji: '🍋', confirmed: true, source: 'manual' },
  { id: '4', name: 'Greek Yogurt', emoji: '🥛', confirmed: false, source: 'manual' },
];


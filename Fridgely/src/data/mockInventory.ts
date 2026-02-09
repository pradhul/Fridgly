export type InventoryItem = {
  id: string;
  name: string;
  emoji: string;
  confirmed: boolean;
};

export const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Broccoli', emoji: '🥦', confirmed: true },
  { id: '2', name: 'Tomatoes', emoji: '🍅', confirmed: true },
  { id: '3', name: 'Lemon', emoji: '🍋', confirmed: true },
  { id: '4', name: 'Greek Yogurt', emoji: '🥛', confirmed: false },
];


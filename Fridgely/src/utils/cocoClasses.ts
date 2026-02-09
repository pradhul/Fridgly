/**
 * COCO 80-class names in YOLO/Ultralytics order (0-indexed).
 * Used to map YOLOv8n output class IDs to display names and categories.
 */
export const COCO_CLASS_NAMES: string[] = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
  'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
  'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe',
  'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard',
  'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
  'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
  'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet',
  'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
  'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
  'hair drier', 'toothbrush',
];

export type InventoryCategory = 'vegetable' | 'fruit' | 'dairy' | 'protein' | 'grain' | 'other';

/** Map COCO class index to app category for emoji and filtering. */
const COCO_TO_CATEGORY: Record<number, InventoryCategory> = {
  // vegetable
  50: 'vegetable', // broccoli
  51: 'vegetable', // carrot
  58: 'vegetable', // potted plant
  // fruit
  46: 'fruit', // banana
  47: 'fruit', // apple
  49: 'fruit', // orange
  // dairy / drinks (bottle, cup, wine glass often used for drinks)
  39: 'dairy', // bottle
  40: 'dairy', // wine glass
  41: 'dairy', // cup
  // protein
  52: 'protein', // hot dog
  // grain / prepared (sandwich, pizza, donut, cake)
  48: 'grain', // sandwich
  53: 'grain', // pizza
  54: 'grain', // donut
  55: 'grain', // cake
  // other: bowl, fork, knife, spoon, refrigerator, etc.
  42: 'other', // fork
  43: 'other', // knife
  44: 'other', // spoon
  45: 'other', // bowl
  72: 'other', // refrigerator
  68: 'other', // microwave
  69: 'other', // oven
  70: 'other', // toaster
  71: 'other', // sink
};

export function getCategoryForCocoClass(classId: number): InventoryCategory {
  return COCO_TO_CATEGORY[classId] ?? 'other';
}

export function getNameForCocoClass(classId: number): string {
  if (classId >= 0 && classId < COCO_CLASS_NAMES.length) {
    const name = COCO_CLASS_NAMES[classId];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return 'Unknown';
}

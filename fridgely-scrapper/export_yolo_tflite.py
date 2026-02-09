#!/usr/bin/env python3
"""
Export YOLOv8 to TensorFlow Lite for the Fridgely fridge scanner.

TFLite export needs TensorFlow (PyTorch → SavedModel → TFLite). Run with venv active:

  source .venv/bin/activate   # or: source venv/bin/activate
  pip install ultralytics tensorflow
  python export_yolo_tflite.py

If you see "No matching distribution found for tensorflow<=2.19.0" (common on Python 3.13),
either install the latest TensorFlow and retry:

  pip install tensorflow

or recreate the venv with Python 3.11 or 3.12 so TensorFlow 2.19 is available:

  python3.12 -m venv .venv && source .venv/bin/activate
  pip install ultralytics tensorflow
  python export_yolo_tflite.py

Output is copied to Fridgely/modal/Yolo-v8-Detection.tflite.
"""

import shutil
import sys
from pathlib import Path

# Paths relative to this script
SCRIPT_DIR = Path(__file__).resolve().parent
FRIDGELY_MODAL = SCRIPT_DIR.parent / "Fridgely" / "modal"
OUTPUT_NAME = "Yolo-v8-Detection.tflite"


def main() -> None:
    try:
        from ultralytics import YOLO
    except ImportError:
        print("ultralytics not installed. Run: pip install ultralytics", file=sys.stderr)
        sys.exit(1)
    try:
        import tensorflow as tf  # noqa: F401
    except ImportError:
        print(
            "TensorFlow is required for TFLite export. Run: pip install tensorflow",
            file=sys.stderr,
        )
        print(
            "On Python 3.13 you may need: pip install tensorflow  (2.20). "
            "If export still fails, use a venv with Python 3.11 or 3.12.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Default: pretrained nano model; override with YOLO('path/to/your.pt') if needed
    model = YOLO("yolov8n.pt")
    # Export to TFLite; returns path to the .tflite file
    result = model.export(format="tflite")
    src = Path(result) if isinstance(result, (str, Path)) else Path(result[0])
    if not src.suffix == ".tflite":
        # might be a dir; find .tflite inside
        tflite_files = list(src.rglob("*.tflite")) if src.is_dir() else []
        if not tflite_files:
            print("No .tflite file found at", result, file=sys.stderr)
            sys.exit(1)
        src = tflite_files[0]

    FRIDGELY_MODAL.mkdir(parents=True, exist_ok=True)
    dst = FRIDGELY_MODAL / OUTPUT_NAME
    shutil.copy2(src, dst)
    print("Exported TFLite model to:", dst)


if __name__ == "__main__":
    main()

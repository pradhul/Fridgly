# TFLite model for fridge scanner

Place a **real TensorFlow Lite** model file here and name it `Yolo-v8-Detection.tflite`.

- The file must be a **TFLite FlatBuffer** (binary), not an ELF `.so` or any other format.
- To export YOLOv8 to TFLite with Ultralytics:
  ```python
  from ultralytics import YOLO
  model = YOLO('yolov8n.pt')  # or your trained weights
  model.export(format='tflite')  # produces a .tflite file
  ```
- Copy the exported `.tflite` file into this folder as `Yolo-v8-Detection.tflite`.

If the app shows "Failed to load model from ...", check with `file Yolo-v8-Detection.tflite` — it should report "data" or FlatBuffer, not "ELF ... shared object".

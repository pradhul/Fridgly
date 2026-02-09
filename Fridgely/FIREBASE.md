# Firebase setup (Firestore + Cloud Storage)

The app uses the **Firebase web SDK** (`firebase` package) for Firestore and Cloud Storage. No `@react-native-firebase` is required.

## Firestore

### Collection: `feedback`

Each synced correction is stored as one document with:

| Field         | Type   | Description                    |
|---------------|--------|--------------------------------|
| `detected_as` | string | Model’s original label         |
| `corrected_to`| string | User’s correction (or same if correct) |
| `confidence`  | number | Detection confidence 0–1       |
| `correct`     | boolean| true = user confirmed, false = corrected |
| `timestamp`   | timestamp | Server timestamp            |
| `user_id`     | string | Device/user id                 |
| `model_version` | number | App model version (e.g. 1)  |

### Collection: `model_versions`

Used for OTA model updates. Documents should have:

| Field          | Type   | Description                          |
|----------------|--------|--------------------------------------|
| `version`      | number | Integer version (e.g. 2, 3)          |
| `storage_path` | string | Path in Storage (e.g. `models/yolov8n_v2.tflite`) |
| `accuracy`     | number | Optional, for display                |
| `updated_at`   | any    | Optional                             |

- Create a **composite index** in Firestore: collection `model_versions`, fields `version` (Descending). The SDK will prompt for it on first query if missing.
- The app queries the document with the **highest `version`** and downloads that file from Storage.

## Cloud Storage

- Bucket: use your Firebase project’s default bucket (e.g. `your-project.appspot.com`).
- Put TFLite models under a `models/` prefix, e.g.:
  - `models/yolov8n_v1.tflite`
  - `models/yolov8n_v2.tflite`
- Ensure Storage rules allow read access to `models/*` for your app (e.g. allow read for authenticated users or for your app’s domain).

## Model updates (flow)

1. App calls `checkForModelUpdate()` (e.g. on startup).
2. It reads the latest document from `model_versions` (orderBy `version` desc, limit 1).
3. It gets a download URL for `storage_path` via Firebase Storage.
4. It downloads the file and saves it locally, then clears the scanner cache so the next scan uses the new model.

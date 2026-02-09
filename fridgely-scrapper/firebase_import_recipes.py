#!/usr/bin/env python3
"""
Bulk import Rashan recipes JSON into Firebase Firestore.

This script:
  - Reads a JSON file of recipes (e.g. indianhealthyrecipes_recipes.json)
  - Connects to Firebase using a service account JSON
  - Writes each recipe into a Firestore collection, in batches

USAGE (from project root after activating your venv):

  cd fridgely-scrapper

  # 1) Install dependency (once per venv)
  #    (venv) pip install firebase-admin

  # 2) Run import
  #    (venv) python firebase_import_recipes.py \
  #        --service-account ../fridgely-83ed4-firebase-adminsdk-fbsvc-8b60d5a3f9.json \
  #        --input indianhealthyrecipes_recipes.json \
  #        --collection recipes

NOTE:
  - This uses Firestore (recommended for app data).
  - Each recipe is stored as a single document with all fields from JSON.
"""

import argparse
import json
from typing import Any, Dict, List

import firebase_admin
from firebase_admin import credentials, firestore


def load_recipes(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("Input JSON must be a list of recipe objects.")
        return data


def init_firestore(service_account_path: str):
    cred = credentials.Certificate(service_account_path)
    # Only initialize once per process
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    return firestore.client()


def import_recipes(
    db,
    recipes: List[Dict[str, Any]],
    collection_name: str,
    batch_size: int = 400,
):
    """
    Import recipes into Firestore in batches.

    - Writes to collection_name
    - Uses auto-generated document IDs
    """
    total = len(recipes)
    print(f"Total recipes to import: {total}")
    if total == 0:
        return

    batch = db.batch()
    written = 0

    for idx, recipe in enumerate(recipes, start=1):
        doc_ref = db.collection(collection_name).document()
        batch.set(doc_ref, recipe)

        # Commit every batch_size documents
        if idx % batch_size == 0:
            print(f"Committing batch at {idx}/{total}...")
            batch.commit()
            batch = db.batch()
            written = idx

    # Commit remaining
    if (total - written) > 0:
        print(f"Committing final batch ({total - written} docs)...")
        batch.commit()

    print(f"Imported {total} recipes into collection '{collection_name}'.")


def main():
    parser = argparse.ArgumentParser(
        description="Bulk import Rashan recipes JSON into Firebase Firestore."
    )
    parser.add_argument(
        "--service-account",
        required=True,
        help="Path to Firebase service account JSON file.",
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to input recipes JSON file (list of recipe objects).",
    )
    parser.add_argument(
        "--collection",
        default="recipes",
        help="Firestore collection name to write into (default: recipes).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=400,
        help="Number of documents per Firestore batch write (max 500).",
    )

    args = parser.parse_args()

    print("============================================================")
    print("RASHAN FIREBASE RECIPES IMPORT")
    print("============================================================")
    print(f"Service account : {args.service_account}")
    print(f"Input JSON      : {args.input}")
    print(f"Collection      : {args.collection}")
    print(f"Batch size      : {args.batch_size}")
    print("============================================================\n")

    recipes = load_recipes(args.input)
    db = init_firestore(args.service_account)
    import_recipes(db, recipes, args.collection, batch_size=args.batch_size)

    print("\n[✓] Import complete.")


if __name__ == "__main__":
    main()


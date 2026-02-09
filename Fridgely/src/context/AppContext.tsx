import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { InventoryItem, initialInventory } from '../data/mockInventory';
import { Recipe, mockRecipes } from '../data/mockRecipes';
import { getPantry, initDatabase, savePantryItems } from '../services/DatabaseService';
import { fetchRecipesFromFirebase } from '../services/recipes';
import type { DetectedItem } from '../services/scanner';
import { clearScannerCache } from '../services/scanner';
import { checkForModelUpdate } from '../services/ModelUpdateService';
import { scheduleFeedbackSync, syncFeedbackToBackend } from '../services/SyncService';
import { verifyFirebaseConnection } from '../services/firebase';

type AppContextValue = {
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  applyScanResults: (items: DetectedItem[]) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(mockRecipes[0] ?? null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDatabase();
        if (cancelled) return;
        const pantry = await getPantry();
        if (cancelled) return;
        if (pantry.length > 0) {
          setInventory(pantry);
        }
        setDbReady(true);
      } catch (e) {
        console.warn('DB init failed, using in-memory inventory', e);
        setDbReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    (async () => {
      const result = await verifyFirebaseConnection();
      if (result.ok) {
        if (__DEV__) console.log('[Firebase] Connected — feedback/training data will sync to Firestore.');
      } else {
        console.warn('[Firebase] Not ready for training data sync:', result.error);
      }
    })();
    const cancelSync = scheduleFeedbackSync();
    return cancelSync;
  }, [dbReady]);

  useEffect(() => {
    if (!dbReady) return;
    (async () => {
      const result = await checkForModelUpdate();
      if (result.updated && result.path) clearScannerCache();
    })();
  }, [dbReady]);

  useEffect(() => {
    if (!dbReady || inventory.length === 0) return;
    savePantryItems(inventory).catch((e) => console.warn('Persist pantry failed', e));
  }, [dbReady, inventory]);

  const applyScanResults = useCallback((items: DetectedItem[]) => {
    if (!items.length) return;

    setInventory((current) => {
      const byName = (name: string) =>
        current.find(
          (i) => i.name.trim().toLowerCase() === name.trim().toLowerCase(),
        );

      const updated = [...current];

      for (const detected of items) {
        const existing = byName(detected.name);
        const confirmed = detected.confidence >= 0.95;

        if (existing) {
          const merged: InventoryItem = {
            ...existing,
            confirmed: existing.confirmed || confirmed,
            source: existing.source ?? 'scan',
            confidence: Math.max(existing.confidence ?? 0, detected.confidence),
            detectedAs: existing.detectedAs ?? detected.name,
          };
          const idx = updated.findIndex((i) => i.id === existing.id);
          if (idx !== -1) {
            updated[idx] = merged;
          }
        } else {
          const emoji =
            detected.category === 'vegetable'
              ? '🥦'
              : detected.category === 'fruit'
              ? '🍎'
              : detected.category === 'dairy'
              ? '🥛'
              : detected.category === 'protein'
              ? '🍗'
              : detected.category === 'grain'
              ? '🍞'
              : '❓';

          updated.push({
            id: `scan-${detected.id}`,
            name: detected.name,
            emoji,
            confirmed,
            source: 'scan',
            confidence: detected.confidence,
            detectedAs: detected.name,
          });
        }
      }

      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      inventory,
      setInventory,
      recipes,
      setRecipes,
      selectedRecipe,
      setSelectedRecipe,
      applyScanResults,
    }),
    [inventory, recipes, selectedRecipe],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};


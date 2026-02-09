import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { InventoryItem, initialInventory } from '../data/mockInventory';
import { Recipe, mockRecipes } from '../data/mockRecipes';
import { fetchRecipesFromFirebase } from '../services/recipes';

type AppContextValue = {
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(mockRecipes[0] ?? null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const remoteRecipes = await fetchRecipesFromFirebase(10);
        if (!cancelled && remoteRecipes.length > 0) {
          setRecipes(remoteRecipes);
          setSelectedRecipe((prev) => prev ?? remoteRecipes[0]);
        }
      } catch (error) {
        console.warn('Failed to load recipes from Firebase, falling back to mock data', error);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      inventory,
      setInventory,
      recipes,
      setRecipes,
      selectedRecipe,
      setSelectedRecipe,
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


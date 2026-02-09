import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './firebase';
import type { Recipe } from '../data/mockRecipes';

export async function fetchRecipesFromFirebase(count = 10): Promise<Recipe[]> {
  const q = query(collection(db, 'recipes'), limit(count));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;

    const title: string = data.title ?? data.name ?? 'Untitled recipe';
    const timeValue: string =
      typeof data.time === 'string'
        ? data.time
        : data.readyInMinutes
        ? `${data.readyInMinutes} min`
        : '30 min';

    const difficulty: Recipe['difficulty'] =
      data.difficulty === 'Medium' || data.difficulty === 'Hard'
        ? data.difficulty
        : 'Easy';

    const matchPercent: number =
      typeof data.matchPercent === 'number' ? data.matchPercent : 100;

    return {
      id: doc.id,
      title,
      time: timeValue,
      difficulty,
      matchPercent,
    };
  });
}


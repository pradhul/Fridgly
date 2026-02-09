export type Recipe = {
  id: string;
  title: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  matchPercent: number;
};

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Crispy Veggie Frittata',
    time: '25 min',
    difficulty: 'Easy',
    matchPercent: 100,
  },
  {
    id: '2',
    title: 'Roasted Veggie Buddha Bowl',
    time: '30 min',
    difficulty: 'Medium',
    matchPercent: 92,
  },
  {
    id: '3',
    title: 'One-Pan Creamy Tuscan Pasta',
    time: '20 min',
    difficulty: 'Easy',
    matchPercent: 85,
  },
];


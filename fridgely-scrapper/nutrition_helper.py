#!/usr/bin/env python3
"""
Nutrition Data Helper for Rashan
Matches ingredients to USDA FoodData Central
Adds macros (protein, carbs, fat) to recipes
"""

import json
import requests
from typing import Dict, List, Optional

# USDA FoodData Central API (free, no key needed for basic use)
USDA_API_URL = "https://fdc.nal.usda.gov/api/foods/search"

# Common Indian ingredients with USDA FDC IDs (pre-mapped for speed)
INGREDIENT_MAP = {
    # Legumes
    'chickpea': 174017,
    'chana': 174017,
    'lentil': 174011,
    'dal': 174011,
    'masoor': 174011,
    'kidney bean': 174006,
    'moong': 174018,
    'mung': 174018,
    
    # Vegetables
    'tomato': 170560,
    'onion': 170591,
    'spinach': 170591,
    'cauliflower': 170562,
    'cabbage': 170561,
    'carrot': 170563,
    'potato': 170572,
    'cucumber': 170563,
    'bell pepper': 170571,
    'green chilli': 170565,
    
    # Grains
    'rice': 170532,
    'wheat': 170570,
    'flour': 170570,
    'roti': 170570,
    'dosa': 170532,
    
    # Dairy
    'milk': 170881,
    'yogurt': 170919,
    'paneer': 170880,
    'ghee': 170880,
    'butter': 170880,
    'cheese': 170881,
    
    # Spices (per 1 tsp)
    'turmeric': 171326,
    'cumin': 171322,
    'coriander': 171321,
    'chilli powder': 171326,
    'salt': 171324,
    
    # Proteins
    'chicken': 170083,
    'mutton': 170084,
    'fish': 170095,
    'egg': 170875,
}

# Manually curated nutrition values for common ingredients (grams per 100g)
MANUAL_NUTRITION = {
    'chickpea': {'protein': 15, 'carbs': 27, 'fat': 6, 'calories': 164},
    'lentil': {'protein': 25, 'carbs': 20, 'fat': 1, 'calories': 116},
    'rice': {'protein': 7, 'carbs': 28, 'fat': 0.3, 'calories': 130},
    'paneer': {'protein': 18, 'carbs': 1, 'fat': 20, 'calories': 265},
    'chicken': {'protein': 31, 'carbs': 0, 'fat': 3, 'calories': 165},
    'egg': {'protein': 13, 'carbs': 1, 'fat': 11, 'calories': 155},
    'spinach': {'protein': 3, 'carbs': 3, 'fat': 0.4, 'calories': 23},
    'tomato': {'protein': 1, 'carbs': 3, 'fat': 0.2, 'calories': 18},
    'onion': {'protein': 1, 'carbs': 9, 'fat': 0.1, 'calories': 40},
    'olive oil': {'protein': 0, 'carbs': 0, 'fat': 100, 'calories': 884},
    'butter': {'protein': 0, 'carbs': 0, 'fat': 82, 'calories': 717},
    'milk': {'protein': 3, 'carbs': 5, 'fat': 3, 'calories': 61},
}


def search_usda(ingredient_name: str) -> Optional[Dict]:
    """Search USDA FoodData Central for ingredient"""
    try:
        params = {
            'query': ingredient_name,
            'pageSize': 1,
            'api_key': 'DEMO_KEY'  # Free tier (limited but works)
        }
        
        response = requests.get(USDA_API_URL, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('foods'):
                food = data['foods'][0]
                nutrients = {n['nutrientName']: n['value'] 
                           for n in food.get('foodNutrients', [])}
                
                return {
                    'name': food['description'],
                    'protein': nutrients.get('Protein', 0),
                    'carbs': nutrients.get('Carbohydrate, by difference', 0),
                    'fat': nutrients.get('Total lipid (fat)', 0),
                    'calories': nutrients.get('Energy', 0) / 4.184  # Convert kJ to kcal
                }
    except Exception as e:
        print(f"  [!] USDA lookup failed for '{ingredient_name}': {e}")
    
    return None


def get_nutrition_for_ingredient(ingredient: str) -> Optional[Dict]:
    """Get nutrition data for ingredient (fast lookup + fallback)"""
    ingredient_lower = ingredient.lower().strip()
    
    # Check manual map first (fastest)
    for key, nutrition in MANUAL_NUTRITION.items():
        if key in ingredient_lower:
            return nutrition
    
    # Try USDA API (slower, but comprehensive)
    print(f"  [?] Looking up '{ingredient}' in USDA...")
    usda_data = search_usda(ingredient_lower)
    if usda_data:
        return usda_data
    
    # Fallback: generic values
    print(f"  [!] No nutrition data for '{ingredient}' - using generic")
    return {'protein': 0, 'carbs': 0, 'fat': 0, 'calories': 0}


def estimate_recipe_nutrition(recipe: Dict, servings: int = 4) -> Dict:
    """
    Estimate nutrition for entire recipe
    Note: This is rough - ideally you'd have ingredient amounts
    """
    
    # Parse ingredients (very basic - assumes format like "1 cup chickpeas")
    ingredients_text = recipe.get('ingredients', '')
    ingredient_list = [i.strip() for i in ingredients_text.split('\n') if i.strip()]
    
    total_protein = 0
    total_carbs = 0
    total_fat = 0
    total_calories = 0
    
    print(f"\n[*] Calculating nutrition for: {recipe['title'][:50]}...")
    
    for ingredient_line in ingredient_list[:15]:  # Limit to first 15 ingredients
        # Extract ingredient name (very basic parsing)
        words = ingredient_line.split()
        ingredient_name = ' '.join(words[-2:]) if len(words) > 1 else ingredient_line
        
        nutrition = get_nutrition_for_ingredient(ingredient_name)
        if nutrition:
            # Rough estimate: assume ~100g per ingredient (very hand-wavy)
            total_protein += nutrition.get('protein', 0)
            total_carbs += nutrition.get('carbs', 0)
            total_fat += nutrition.get('fat', 0)
            total_calories += nutrition.get('calories', 0)
    
    # Divide by servings
    return {
        'protein_per_serving': round(total_protein / servings, 1),
        'carbs_per_serving': round(total_carbs / servings, 1),
        'fat_per_serving': round(total_fat / servings, 1),
        'calories_per_serving': round(total_calories / servings, 1),
        'note': 'Estimated from ingredients. Actual values may vary.'
    }


def add_nutrition_to_recipes(input_file: str, output_file: str):
    """Add nutrition data to all recipes in JSON"""
    
    print("=" * 60)
    print("RASHAN NUTRITION DATA HELPER")
    print("=" * 60)
    print(f"\nInput file: {input_file}")
    
    # Load recipes
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            recipes = json.load(f)
    except FileNotFoundError:
        print(f"[!] File not found: {input_file}")
        return
    
    print(f"[✓] Loaded {len(recipes)} recipes")
    
    # Add nutrition to each recipe
    for i, recipe in enumerate(recipes, 1):
        print(f"\n[{i}/{len(recipes)}] Processing: {recipe['title'][:50]}...")
        
        # Estimate nutrition
        nutrition = estimate_recipe_nutrition(recipe)
        recipe['nutrition'] = nutrition
        recipe['nutrition_calculated'] = True
    
    # Save augmented recipes
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 60)
    print(f"[✓] NUTRITION DATA ADDED")
    print(f"Output file: {output_file}")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Review the nutrition estimates (they're rough)")
    print("2. For critical recipes, manually verify macros")
    print("3. Import to your database")


def main():
    """Main entry point"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python nutrition_helper.py <input_file> [output_file]")
        print("\nExample:")
        print("  python nutrition_helper.py reddit_recipes_20240115_120000.json recipes_with_nutrition.json")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.json', '_with_nutrition.json')
    
    add_nutrition_to_recipes(input_file, output_file)


if __name__ == '__main__':
    main()

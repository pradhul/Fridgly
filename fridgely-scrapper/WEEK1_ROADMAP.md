# RASHAN WEEK 1-2: REDDIT SCRAPING ROADMAP

## THE GOAL
Get 150 recipes with nutrition data, ready to load into your database.

---

## STEP-BY-STEP EXECUTION

### DAY 1-2: Setup (30 minutes)
```bash
# 1. Install Python packages
pip install praw requests

# 2. Create Reddit app
# Go to: https://www.reddit.com/prefs/apps
# Create "script" app, get client_id + client_secret

# 3. Add credentials to reddit_recipe_scraper.py
# Edit: REDDIT_CONFIG['client_id'] = 'YOUR_ID'
#       REDDIT_CONFIG['client_secret'] = 'YOUR_SECRET'

# 4. Test the scraper
python reddit_recipe_scraper.py
```

**Expected output:** 
```
[✓] Scraping complete
Total recipes: ~300-400
Output file: reddit_recipes_20250204_143000.json
```

---

### DAY 3-4: Manual Review (2-3 hours)
```bash
# 1. Open the JSON file in your editor
# Example: reddit_recipes_20250204_143000.json

# 2. Read through recipes (sort by upvotes descending)
# Keep recipes with:
#   - Clear instructions
#   - Reasonable length (not too short, not a novel)
#   - Real food (not memes or discussions)

# 3. Use this Python snippet to help (copy-paste):
```

```python
import json

# Load recipes
with open('reddit_recipes_20250204_143000.json') as f:
    recipes = json.load(f)

# Sort by upvotes
recipes_sorted = sorted(recipes, key=lambda x: x['upvotes'], reverse=True)

# Print top 20 for review
for i, r in enumerate(recipes_sorted[:20]):
    print(f"{i+1}. {r['title']} ({r['upvotes']} upvotes) - r/{r['subreddit']}")
    print(f"   Length: {len(r['recipe_text'])} chars")
    print()
```

**Output:** Top 20 recipes sorted by quality (upvotes)

**Action:** Keep ~150-200 recipes, delete obviously bad ones (duplicates, non-recipes, spam)

---

### DAY 5: Add Nutrition Data (1-2 hours)
```bash
# 1. Add USDA lookups
pip install requests

# 2. Run nutrition helper
python nutrition_helper.py reddit_recipes_cleaned.json recipes_with_nutrition.json

# This will:
# - Look up each ingredient in USDA FoodData Central
# - Estimate macros per serving
# - Save as recipes_with_nutrition.json
```

**Expected output:**
```json
{
  "title": "Easy Chickpea Curry",
  "nutrition": {
    "protein_per_serving": 12.5,
    "carbs_per_serving": 20.3,
    "fat_per_serving": 8.1,
    "calories_per_serving": 189,
    "note": "Estimated from ingredients"
  },
  "nutrition_calculated": true
}
```

---

### DAY 6: Quality Check (1 hour)
```bash
# Run this Python snippet to validate data:

import json

with open('recipes_with_nutrition.json') as f:
    recipes = json.load(f)

print(f"Total recipes: {len(recipes)}")
print(f"Recipes with nutrition: {sum(1 for r in recipes if r.get('nutrition_calculated'))}")
print(f"Average upvotes: {sum(r['upvotes'] for r in recipes) / len(recipes):.0f}")

# Check for missing data
for r in recipes:
    if not r.get('nutrition'):
        print(f"Missing nutrition: {r['title']}")
    if not r.get('reddit_url'):
        print(f"Missing reddit_url: {r['title']}")

print("\n[✓] Data validation complete")
```

---

### DAY 7: Final Output (30 minutes)
```bash
# Create final recipes file
# Make sure it includes:
# - title
# - recipe_text (full instructions)
# - ingredients (extracted ingredients list)
# - nutrition (protein, carbs, fat, calories)
# - reddit_url (link back)
# - source (r/SubredditName)
# - credit (u/username)
# - upvotes (quality indicator)

# Save as: recipes_final.json (ready for DB import)
```

---

## FILE STRUCTURE

```
/home/claude/
├── reddit_recipe_scraper.py          # Main scraper
├── nutrition_helper.py               # Nutrition lookup
├── SCRAPER_SETUP.md                  # Setup guide
├── reddit_recipes_RAW.json           # Raw output from scraper
├── reddit_recipes_cleaned.json       # After manual review
└── recipes_with_nutrition.json       # Final, ready for DB
```

---

## TIMELINE SUMMARY

| Day | Task | Time | Output |
|-----|------|------|--------|
| 1-2 | Setup + run scraper | 30 min | 300-400 raw recipes |
| 3-4 | Manual review | 2-3 hrs | 150-200 cleaned recipes |
| 5 | Add nutrition | 1-2 hrs | Recipes with macros |
| 6 | Quality check | 1 hr | Validated data |
| 7 | Final export | 30 min | recipes_final.json |
| **Total** | | **6-8 hours** | **150 recipes, ready for backend** |

---

## DATABASE SCHEMA (For Week 3-4)

When you build your backend, your recipe table should have:

```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  recipe_text TEXT,
  ingredients TEXT,
  instructions TEXT,
  
  -- Nutrition per serving
  protein_g FLOAT,
  carbs_g FLOAT,
  fat_g FLOAT,
  calories FLOAT,
  
  -- Health categories
  is_keto BOOLEAN,
  is_vegan BOOLEAN,
  is_vegetarian BOOLEAN,
  is_high_protein BOOLEAN,
  is_cheap BOOLEAN,
  
  -- Metadata
  reddit_url VARCHAR(500),
  source VARCHAR(100),
  original_author VARCHAR(100),
  upvotes INT,
  
  -- For your app
  user_rating FLOAT DEFAULT 0,
  total_ratings INT DEFAULT 0,
  cook_time_minutes INT,
  difficulty_level VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## IMPORTANT REMINDERS

### 1. Credits
Every recipe must include:
- `reddit_url`: Link back to original post
- `source`: r/EatCheapAndHealthy (whatever)
- `original_author`: u/username

**In your React Native app, DISPLAY these credits.** Users will check them and might award your app for being honest.

### 2. Nutrition Accuracy
The nutrition estimates are **rough**. Reasons:
- Ingredient amounts aren't in the JSON
- USDA data varies by source
- Home-cooked food varies

**Solution:** Add a disclaimer in your app: "Nutrition estimated from ingredients. Actual values may vary."

### 3. Recipe Quality
Not all 300 recipes will be good. You'll manually curate down to 150-200. This is **normal and expected.**

---

## WHAT COMES NEXT (Week 3-4)

Once you have `recipes_final.json`:
1. Design PostgreSQL schema (see above)
2. Build Node.js backend to load recipes
3. Create API endpoint: `GET /recipes?health_goal=keto&ingredients=chickpea`
4. Connect React Native frontend to backend

**But first: Finish Week 1-2 scraping.**

---

## TROUBLESHOOTING CHECKLIST

- [ ] PRAW installed (`pip show praw`)
- [ ] Reddit app created and credentials added
- [ ] Scraper runs without errors
- [ ] Output JSON has 300+ recipes
- [ ] Each recipe has title, recipe_text, reddit_url
- [ ] Manual review done (duplicate removal)
- [ ] Nutrition data added
- [ ] All recipes have nutrition object

If any checkbox fails, fix before moving to Week 3.

---

## THAT'S IT

You now have a complete pipeline to:
1. **Scrape** Reddit recipes automatically
2. **Clean** and validate the data
3. **Enrich** with nutrition data
4. **Export** ready for your database

**Time to execute: 6-8 hours total.**

Start with Day 1 setup. Let me know if you hit any snags.

---

## APP NAME REMINDER

You're building: **RASHAN**

Tagline: "Smart recipes from your pantry"

Next: Build the backend (Week 3-4).

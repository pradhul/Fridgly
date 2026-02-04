# RASHAN REDDIT SCRAPER - SETUP GUIDE

## What This Does
Scrapes high-upvote recipes from Reddit's health/food communities, saves them with:
- Full recipe text
- Top comments (user tips)
- Reddit source credits
- Upvote counts (quality indicator)

Output: JSON file ready to load into your database.

---

## SETUP (5 minutes)

### 1. Install PRAW (Python Reddit API Wrapper)
```bash
pip install praw
```

### 2. Create Reddit App (Free)
1. Go to: https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in:
   - **name**: "Rashan Recipe Scraper" (anything)
   - **app type**: "script"
   - **redirect uri**: http://localhost:8080
4. Click "Create app"
5. You'll see:
   - **client_id** (under app name, ~20 chars)
   - **client_secret** (long string)
   - **user_agent**: Use the format in the scraper

### 3. Add Credentials to Script
Open `reddit_recipe_scraper.py` and replace:
```python
REDDIT_CONFIG = {
    'client_id': 'YOUR_CLIENT_ID',          # Paste here
    'client_secret': 'YOUR_CLIENT_SECRET',  # Paste here
    'user_agent': 'RashanRecipeScraper/1.0 by YourUsername'  # Change username
}
```

---

## USAGE

### Run the scraper
```bash
python reddit_recipe_scraper.py
```

### What happens
- Scrapes 8 subreddits (EatCheapAndHealthy, IndianFood, MealPrepSunday, ketorecipes, etc.)
- Looks for posts with 500+ upvotes (community validation)
- Extracts recipe + top 5 comments
- Saves as `reddit_recipes_YYYYMMDD_HHMMSS.json`
- Takes ~5-10 minutes (Reddit API rate limiting)

### Output example
```json
{
  "title": "Easy Chickpea Curry for Meal Prep",
  "recipe_text": "Ingredients:\n- 2 cans chickpeas...",
  "ingredients": "2 cans chickpeas, 1 onion, 2 tomatoes...",
  "upvotes": 2341,
  "subreddit": "MealPrepSunday",
  "reddit_url": "https://reddit.com/r/MealPrepSunday/comments/...",
  "created_at": "2023-05-15T10:30:00",
  "top_comments": [
    {
      "body": "Added spinach, turned out amazing!",
      "upvotes": 450
    }
  ],
  "source": "r/MealPrepSunday",
  "credit": "Original post by u/username"
}
```

---

## NEXT STEPS (After Scraping)

### 1. Manual Review (2-3 hours)
- Open the JSON file
- Read through 150 best recipes (sort by upvotes)
- Remove duplicates or non-recipes
- Keep recipes with clear instructions

### 2. Add Nutrition Data (1-2 hours)
- For each recipe, identify main ingredients
- Look up nutrition in USDA FoodData Central: https://fdc.nal.usda.gov/
- Add macros (protein, carbs, fat) to JSON

### 3. Import to Database
- Create recipe table in PostgreSQL
- Load JSON with credits intact
- Test in your React Native app

---

## CUSTOMIZATION

### Change minimum upvotes
```python
MIN_UPVOTES = 500  # Change to 1000 for stricter filtering
```

### Add/remove subreddits
```python
SUBREDDITS = [
    'EatCheapAndHealthy',
    'IndianFood',
    # Add more or remove
]
```

### Change recipe keywords
```python
RECIPE_KEYWORDS = ['recipe', 'cook', 'make', ...]
```

---

## TROUBLESHOOTING

### "Invalid credentials"
- Double-check client_id and client_secret
- Make sure you copied them correctly from Reddit app page

### "Rate limit exceeded"
- Reddit API has limits (60 requests/min)
- Script waits automatically
- Just let it run

### "No recipes found"
- Subreddit might be private or deleted
- Try removing it from SUBREDDITS list
- Or lower MIN_UPVOTES to 250

### "ModuleNotFoundError: praw"
```bash
pip install praw
```

---

## IMPORTANT: CREDITS

The scraper adds Reddit credits to every recipe:
```json
"reddit_url": "https://reddit.com/r/...",
"source": "r/EatCheapAndHealthy",
"credit": "Original post by u/username"
```

**In your app, display these credits.** This:
- Gives credit to original authors (ethical)
- Links back to Reddit (good for SEO + virality)
- Protects you legally (you're aggregating, not stealing)

---

## TIMELINE

- **Scraping**: 10 minutes
- **Manual review**: 2-3 hours
- **Nutrition data**: 1-2 hours
- **Import to DB**: 30 minutes

**Total: 4-6 hours → 150 validated recipes ready for your app**

You're on track for Week 1-2 complete.

#!/usr/bin/env python3
"""
Reddit Recipe Scraper for Rashan
Scrapes high-upvote recipes from health/food subreddits
Saves as JSON with Reddit source credits
"""

import praw
import json
import re
from datetime import datetime

# Reddit API credentials
# Get these from: https://www.reddit.com/prefs/apps
REDDIT_CONFIG = {
    'client_id': 'YOUR_CLIENT_ID',
    'client_secret': 'YOUR_CLIENT_SECRET',
    'user_agent': 'RashanRecipeScraper/1.0 by YourUsername'
}

# Subreddits to scrape
SUBREDDITS = [
    'EatCheapAndHealthy',
    'IndianFood',
    'MealPrepSunday',
    'ketorecipes',
    'vegetarian',
    'vegan',
    'fitmeals',
    'HealthyFood'
]

# Minimum upvotes to include recipe
# Now 0 so we rely mostly on keyword + length filters
MIN_UPVOTES = 0

# Keywords to identify recipe posts
# Broadened a bit so we don't miss good recipes
RECIPE_KEYWORDS = [
    'recipe',
    'cook',
    'make',
    'ingredients',
    'prepare',
    'homemade',
    'meal prep',
    'dinner',
    'lunch',
    'breakfast',
    'meal',
]


def is_recipe_post(title):
    """Check if post title contains recipe-related keywords"""
    title_lower = title.lower()
    return any(keyword in title_lower for keyword in RECIPE_KEYWORDS)


def extract_ingredients(text):
    """Try to extract ingredients section from recipe text"""
    # Look for "ingredients:" section
    ingredients_match = re.search(
        r'ingredients?:?\s*([\s\S]*?)(?:instructions?:|preparation|directions|steps:|$)',
        text,
        re.IGNORECASE
    )
    if ingredients_match:
        return ingredients_match.group(1).strip()
    
    # Fallback: return first 500 chars (likely contains ingredients)
    return text[:500] if len(text) > 500 else text


def clean_recipe_text(text):
    """Remove excessive formatting, trim to reasonable length"""
    # Remove extra whitespace
    text = re.sub(r'\n\s*\n', '\n', text)
    # Limit to 3000 characters (most recipes are shorter)
    return text[:3000]


def scrape_subreddit(reddit, subreddit_name):
    """Scrape recipes from a single subreddit"""
    print(f"\n[*] Scraping r/{subreddit_name}...")
    recipes = []
    
    try:
        subreddit = reddit.subreddit(subreddit_name)
        
        # Get top posts of all time (most reliable)
        for post in subreddit.top(time_filter='all', limit=200):
            # Skip stickied posts, ads
            if post.stickied:
                continue
            
            # Filter only by minimum upvotes (which may be 0)
            if post.score < MIN_UPVOTES:
                continue
            
            # Extract recipe text
            # For non-text/image posts, selftext may be empty – we still keep them
            recipe_text = clean_recipe_text(post.selftext or "")
            if len(recipe_text) < 20 and post.is_self:
                # For self-posts, require a bit of body text
                continue
            
            # Extract top comments (user tips, variations)
            comments = []
            try:
                post.comments.replace_more(limit=0)  # Flatten comment tree
                for comment in list(post.comments)[:5]:
                    if comment.score > 50 and len(comment.body) > 20:
                        comments.append({
                            'body': comment.body[:500],
                            'upvotes': comment.score
                        })
            except Exception as e:
                print(f"  [!] Error extracting comments: {e}")
            
            # Build recipe object
            recipe = {
                'title': post.title,
                'recipe_text': recipe_text,
                'ingredients': extract_ingredients(recipe_text),
                'upvotes': post.score,
                'subreddit': subreddit_name,
                'reddit_url': f"https://reddit.com{post.permalink}",
                'created_at': datetime.fromtimestamp(post.created_utc).isoformat(),
                'top_comments': comments,
                'source': f"r/{subreddit_name}",
                'credit': f"Original post by u/{post.author}" if post.author else "r/" + subreddit_name,
                # App-level user feedback fields (start empty, filled by your app)
                'user_likes': 0,
                'user_dislikes': 0,
                'user_rating': 0.0,      # average rating (e.g. 0–5 stars)
                'total_ratings': 0,      # how many ratings contributed to user_rating
                'user_comments': [],     # list of comment objects your app can append
            }
            
            recipes.append(recipe)
            print(f"  [+] {post.title[:60]}... ({post.score} upvotes)")
        
        print(f"[✓] Found {len(recipes)} recipes in r/{subreddit_name}")
        return recipes
    
    except Exception as e:
        print(f"[!] Error scraping r/{subreddit_name}: {e}")
        return []


def main():
    """Main scraper pipeline"""
    print("=" * 60)
    print("RASHAN REDDIT RECIPE SCRAPER")
    print("=" * 60)
    print(f"\nMinimum upvotes: {MIN_UPVOTES}")
    print(f"Subreddits: {', '.join(SUBREDDITS)}")
    
    # Initialize Reddit API
    print("\n[*] Initializing Reddit API...")
    try:
        reddit = praw.Reddit(
            client_id=REDDIT_CONFIG['client_id'],
            client_secret=REDDIT_CONFIG['client_secret'],
            user_agent=REDDIT_CONFIG['user_agent']
        )
        # Test connection
        reddit.user.me()
        print("[✓] Reddit API authenticated")
    except Exception as e:
        print(f"[!] Reddit API error: {e}")
        print("\nMake sure you have:")
        print("1. Installed PRAW: pip install praw")
        print("2. Created Reddit app: https://www.reddit.com/prefs/apps")
        print("3. Added credentials to this script")
        return
    
    # Scrape all subreddits
    all_recipes = []
    for subreddit in SUBREDDITS:
        recipes = scrape_subreddit(reddit, subreddit)
        all_recipes.extend(recipes)
    
    # Remove duplicates (same title)
    seen_titles = set()
    unique_recipes = []
    for recipe in all_recipes:
        if recipe['title'] not in seen_titles:
            unique_recipes.append(recipe)
            seen_titles.add(recipe['title'])
    
    # Save to JSON
    output_file = f"reddit_recipes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_recipes, f, indent=2, ensure_ascii=False)
    
    # Summary
    print("\n" + "=" * 60)
    print(f"[✓] SCRAPING COMPLETE")
    print(f"Total recipes: {len(unique_recipes)}")
    print(f"Output file: {output_file}")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Review recipes manually (check for duplicates, quality)")
    print("2. Add ICMR nutrition data (use USDA FoodData Central)")
    print("3. Import to your database with Reddit credits")
    print("4. Test in your app")


if __name__ == '__main__':
    main()

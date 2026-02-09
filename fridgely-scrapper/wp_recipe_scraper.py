#!/usr/bin/env python3
"""
Generic WordPress Recipe Scraper for Rashan

Goal:
  - Scrape full recipe text + ingredients from WordPress recipe pages
  - Save as JSON, similar shape to reddit_recipe_scraper.py output
  - No database – just timestamped JSON files

Intended usage:
  1. Manually collect a list of recipe URLs from sites you like
     (e.g. IndianHealthyRecipes, other Indian food blogs – ideally ones that
     use common WP recipe plugins like "WP Recipe Maker").
  2. Put them in a text file, one URL per line.
  3. Run:

        python wp_recipe_scraper.py urls.txt output_recipes.json --source_label "IndianHealthyRecipes" --state "Karnataka"

  4. Feed the resulting JSON into nutrition_helper.py.

NOTE:
  - Always check each site's robots.txt and Terms of Service before scraping.
  - Use this script responsibly (low rate, small batches).
"""

import argparse
import json
import re
from datetime import datetime
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup


def fetch_url(url: str, timeout: int = 15) -> Optional[str]:
    """Fetch HTML content for a single URL."""
    headers = {
        "User-Agent": "RashanRecipeScraper/1.0 (+https://example.com/contact)"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
        if resp.status_code != 200:
            print(f"[!] {url} returned status {resp.status_code}")
            return None
        return resp.text
    except Exception as e:
        print(f"[!] Error fetching {url}: {e}")
        return None


def extract_text_list(elements: List) -> List[str]:
    """Convert a list of BeautifulSoup elements into clean text lines."""
    lines: List[str] = []
    for el in elements:
        text = el.get_text(separator=" ", strip=True)
        if text:
            lines.append(text)
    return lines


def extract_ingredients_and_instructions(soup: BeautifulSoup) -> Dict[str, str]:
    """
    Try to extract ingredients and instructions from a WordPress recipe page.

    Strategy (in order):
      1. Look for WP Recipe Maker markup:
         - .wprm-recipe-ingredients
         - .wprm-recipe-instructions
      2. Fallback: search for headings like "Ingredients" / "Instructions"
         and grab the nearest <ul>/<ol>/<p> sections.
    """
    ingredients_lines: List[str] = []
    instructions_lines: List[str] = []

    # 1) WP Recipe Maker (very common)
    ingredients_block = soup.select_one(".wprm-recipe-ingredients")
    instructions_block = soup.select_one(".wprm-recipe-instructions")

    if ingredients_block:
        # Usually list items inside
        ingredients_lines = extract_text_list(ingredients_block.find_all(["li", "p"]))

    if instructions_block:
        instructions_lines = extract_text_list(instructions_block.find_all(["li", "p"]))

    # 2) Fallbacks based on headings
    def find_section_by_heading(
        heading_keywords: List[str],
    ) -> List[str]:
        pattern = re.compile("|".join(heading_keywords), re.IGNORECASE)
        for header_tag in ["h2", "h3", "h4"]:
            for h in soup.find_all(header_tag):
                if pattern.search(h.get_text(" ", strip=True)):
                    # Look at next siblings for content
                    collected: List[str] = []
                    sib = h.find_next_sibling()
                    # Walk a few siblings until structure clearly changes
                    steps = 0
                    while sib is not None and steps < 6:
                        if sib.name in ("ul", "ol"):
                            collected.extend(extract_text_list(sib.find_all("li")))
                        elif sib.name == "p":
                            text = sib.get_text(" ", strip=True)
                            if text:
                                collected.append(text)
                        sib = sib.find_next_sibling()
                        steps += 1
                    if collected:
                        return collected
        return []

    if not ingredients_lines:
        ingredients_lines = find_section_by_heading(["Ingredients"])

    if not instructions_lines:
        instructions_lines = find_section_by_heading(
            ["Instructions", "Method", "Directions", "Preparation"]
        )

    ingredients_text = "\n".join(ingredients_lines).strip()
    instructions_text = "\n".join(instructions_lines).strip()

    return {
        "ingredients": ingredients_text,
        "instructions": instructions_text,
    }


def scrape_recipe_page(url: str, source_label: str, state: Optional[str]) -> Optional[Dict]:
    """Scrape a single recipe page into a standardized dict."""
    print(f"[*] Scraping recipe: {url}")
    html = fetch_url(url)
    if not html:
        return None

    soup = BeautifulSoup(html, "html.parser")

    # Title – fallback to first <h1>, then <title>
    title_tag = soup.find("h1")
    if title_tag:
        title = title_tag.get_text(" ", strip=True)
    else:
        title = (soup.title.string or "").strip() if soup.title else url

    sections = extract_ingredients_and_instructions(soup)

    ingredients = sections.get("ingredients", "")
    instructions = sections.get("instructions", "")

    if not ingredients and not instructions:
        print(f"  [!] No clear recipe content found for {url}")

    recipe_text = instructions or ingredients

    recipe = {
        "title": title,
        "recipe_text": recipe_text,
        "ingredients": ingredients,
        "instructions": instructions,
        # Kept for shape parity with reddit_recipe_scraper
        "upvotes": 0,
        "subreddit": None,
        "source_url": url,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "source": source_label,
        "credit": source_label,
        # App-level user feedback fields (start empty, filled by your app)
        "user_likes": 0,
        "user_dislikes": 0,
        "user_rating": 0.0,       # average rating (e.g. 0–5 stars)
        "total_ratings": 0,       # how many ratings contributed to user_rating
        "user_comments": [],      # list of comment objects your app can append
    }

    if state:
        recipe["state"] = state

    return recipe


def read_urls_file(path: str) -> List[str]:
    """Read a file with one URL per line."""
    urls: List[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            url = line.strip()
            if url and not url.startswith("#"):
                urls.append(url)
    return urls


def main():
    parser = argparse.ArgumentParser(
        description="Scrape WordPress recipe pages into JSON for Rashan."
    )
    parser.add_argument(
        "urls_file", help="Path to a text file with one recipe URL per line."
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Output JSON file. If not given, a timestamped file is created.",
    )
    parser.add_argument(
        "--source_label",
        default="ExternalRecipeSite",
        help="Short label for the source site (e.g. IndianHealthyRecipes).",
    )
    parser.add_argument(
        "--state",
        default=None,
        help="Optional Indian state label to tag all recipes with (e.g. Karnataka).",
    )

    args = parser.parse_args()

    urls = read_urls_file(args.urls_file)
    if not urls:
        print(f"[!] No URLs found in {args.urls_file}")
        return

    print("=" * 60)
    print("RASHAN WORDPRESS RECIPE SCRAPER")
    print("=" * 60)
    print(f"Total URLs to scrape: {len(urls)}")
    print(f"Source label: {args.source_label}")
    if args.state:
        print(f"State tag: {args.state}")

    recipes: List[Dict] = []
    for i, url in enumerate(urls, 1):
        print(f"\n[{i}/{len(urls)}]")
        recipe = scrape_recipe_page(url, args.source_label, args.state)
        if recipe:
            recipes.append(recipe)

    if not recipes:
        print("\n[!] No recipes scraped successfully.")
        return

    output_file = (
        args.output
        if args.output
        else f"wp_recipes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print("[✓] SCRAPING COMPLETE")
    print(f"Recipes scraped: {len(recipes)}")
    print(f"Output file: {output_file}")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Spot-check a few recipes in the JSON for quality.")
    print("2. Optionally run nutrition_helper.py on the JSON.")
    print("3. Later, import into your database.")


if __name__ == "__main__":
    main()


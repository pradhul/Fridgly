#!/usr/bin/env python3
"""
Simple site crawler to discover WordPress recipe URLs for Rashan.

Current default usage is aimed at indianhealthyrecipes.com, but it is
generic enough to work for other WP-based recipe sites too.

It:
  - Crawls pages within a single domain (BFS, small polite delay)
  - Detects "recipe pages" by presence of common WP recipe markup
    (e.g. .wprm-recipe-ingredients)
  - Stops once it finds N recipe URLs
  - Writes them to a text file (one URL per line)

You then feed that URLs file into wp_recipe_scraper.py.

Example:
  python crawl_wp_recipes.py \\
    --start_url https://www.indianhealthyrecipes.com/ \\
    --max_recipes 520 \\
    --output_urls indianhealthyrecipes_urls_auto.txt
"""

import argparse
import time
from collections import deque
from typing import Set
from urllib.parse import urljoin, urlparse, urldefrag

import requests
from bs4 import BeautifulSoup


def is_same_domain(url: str, domain: str) -> bool:
    """Return True if url is within the specified domain."""
    try:
        parsed = urlparse(url)
        return parsed.netloc.endswith(domain)
    except Exception:
        return False


def normalize_url(base: str, link: str) -> str:
    """Resolve relative links and strip fragments."""
    abs_url = urljoin(base, link)
    abs_url, _ = urldefrag(abs_url)
    return abs_url


def is_likely_recipe_page(soup: BeautifulSoup) -> bool:
    """
    Heuristic to decide if a page is a recipe page.

    Current checks:
      - WP Recipe Maker ingredients block (.wprm-recipe-ingredients)
      - Structured data blocks with 'recipe' in class (very rough)
    """
    if soup.select_one(".wprm-recipe-ingredients"):
        return True

    # Fallback heuristic: divs with 'recipe' in class name
    for div in soup.find_all("div", class_=True):
        classes = " ".join(div.get("class", []))
        if "recipe" in classes.lower():
            return True

    return False


def crawl_for_recipes(
    start_url: str,
    domain: str,
    max_recipes: int,
    max_pages: int = 2000,
    delay_seconds: float = 0.3,
) -> Set[str]:
    """Breadth-first crawl within domain, collecting recipe URLs."""
    headers = {
        "User-Agent": "RashanRecipeCrawler/1.0 (+https://example.com/contact)"
    }

    queue = deque([start_url])
    visited: Set[str] = set()
    recipe_urls: Set[str] = set()

    pages_processed = 0

    while queue and len(recipe_urls) < max_recipes and pages_processed < max_pages:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)
        pages_processed += 1

        print(f"[{pages_processed}] Fetching: {url}")

        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code != 200:
                print(f"  [!] Status {resp.status_code}")
                continue
        except Exception as e:
            print(f"  [!] Error fetching page: {e}")
            continue

        soup = BeautifulSoup(resp.text, "html.parser")

        # Detect recipe pages
        if is_likely_recipe_page(soup):
            if url not in recipe_urls:
                recipe_urls.add(url)
                print(f"  [+] Found recipe page ({len(recipe_urls)}): {url}")
                if len(recipe_urls) >= max_recipes:
                    break

        # Discover more links within domain
        for a in soup.find_all("a", href=True):
            link = a["href"]
            if link.startswith("mailto:") or link.startswith("tel:"):
                continue
            next_url = normalize_url(url, link)
            if not is_same_domain(next_url, domain):
                continue
            if next_url not in visited:
                queue.append(next_url)

        time.sleep(delay_seconds)

    return recipe_urls


def main():
    parser = argparse.ArgumentParser(
        description="Crawl a WordPress recipe site to collect recipe URLs."
    )
    parser.add_argument(
        "--start_url",
        required=True,
        help="Starting URL for the crawl (e.g. https://www.indianhealthyrecipes.com/).",
    )
    parser.add_argument(
        "--domain",
        required=True,
        help="Domain to restrict crawling to (e.g. indianhealthyrecipes.com).",
    )
    parser.add_argument(
        "--max_recipes",
        type=int,
        default=500,
        help="Maximum number of recipe URLs to collect.",
    )
    parser.add_argument(
        "--output_urls",
        default="recipe_urls.txt",
        help="Output text file to write URLs into (one per line).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.3,
        help="Delay between requests in seconds (be polite!).",
    )

    args = parser.parse_args()

    print("============================================================")
    print("RASHAN WORDPRESS RECIPE CRAWLER")
    print("============================================================")
    print(f"Start URL   : {args.start_url}")
    print(f"Domain      : {args.domain}")
    print(f"Max recipes : {args.max_recipes}")
    print(f"Delay (s)   : {args.delay}")
    print("============================================================\n")

    recipe_urls = crawl_for_recipes(
        start_url=args.start_url,
        domain=args.domain,
        max_recipes=args.max_recipes,
        delay_seconds=args.delay,
    )

    if not recipe_urls:
        print("[!] No recipe URLs discovered.")
        return

    with open(args.output_urls, "w", encoding="utf-8") as f:
        for url in sorted(recipe_urls):
            f.write(url + "\n")

    print("\n============================================================")
    print("[✓] CRAWL COMPLETE")
    print(f"Recipe URLs found : {len(recipe_urls)}")
    print(f"Output URLs file  : {args.output_urls}")
    print("============================================================")


if __name__ == "__main__":
    main()


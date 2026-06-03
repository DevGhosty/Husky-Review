#!/usr/bin/env python3
"""
UW Campus Activities Scraper (Playwright)
Scrapes student organizations from UW engagement platforms using a headless browser.

Strategy: intercept the JSON API calls the SPA makes internally — avoids fragile
DOM selectors. Falls back to DOM card scraping if no API response is captured.

Usage:
  # Install deps first (one-time):
  #   pip install playwright && playwright install chromium

  # Dry run (prints orgs, no DB write):
  python uw_activities_scraper.py

  # Show the browser window (useful for debugging login/auth):
  python uw_activities_scraper.py --headed

  # Write to Supabase:
  python uw_activities_scraper.py --upsert

  # Pass a Netscape cookie file if the site requires UW login:
  python uw_activities_scraper.py --cookies cookies.txt --upsert
"""

import argparse
import asyncio
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.async_api import async_playwright, BrowserContext, Page, Response

load_dotenv()

# ---------------------------------------------------------------------------
# Targets
# ---------------------------------------------------------------------------

# Each campus uses its own CampusGroups instance.
# API interception (on_response) works identically for all three.
# Tacoma's DubNet requires a separate login — pass --cookies-tacoma <file> if needed.
TARGETS = [
    {
        "campus":  "Seattle",
        "url":     "https://huskylink.washington.edu/organizations",
        "method":  "playwright",   # CampusGroups SPA — API interception
        "auth":    False,
    },
    {
        "campus":  "Bothell",
        "url":     "https://gather.uwb.edu/club_signup?view=all&group_type=9999",
        "method":  "html",         # server-rendered HTML — BeautifulSoup
        "auth":    False,
    },
    {
        "campus":  "Tacoma",
        "url":     "https://dubnet.tacoma.uw.edu/organizations",
        "method":  "playwright",   # CampusGroups SPA — API interception
        "auth":    True,           # requires UW Tacoma login; pass --cookies-tacoma
    },
]

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

async def _inject_cookies(context: BrowserContext, cookie_file: str) -> None:
    """Load a Netscape-format cookie file into the Playwright browser context."""
    cookies = []
    with open(cookie_file, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.rstrip("\n")
            if line.startswith("#HttpOnly_"):
                line = line[len("#HttpOnly_"):]
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 7:
                continue
            domain, _, path, secure, expires, name, value = parts[:7]
            cookies.append({
                "name": name,
                "value": value,
                "domain": domain.lstrip("."),
                "path": path,
                "secure": secure.upper() == "TRUE",
            })
    await context.add_cookies(cookies)
    print(f"  Injected {len(cookies)} cookies from {cookie_file}")


# ---------------------------------------------------------------------------
# Parse
# ---------------------------------------------------------------------------

def _extract_orgs_from_api(body: dict | list, campus: str, source_url: str, now: str) -> list[dict]:
    """Try to pull org records out of a CampusGroups API response."""
    # CampusGroups wraps results in various keys depending on endpoint version
    if isinstance(body, list):
        items = body
    else:
        items = (
            body.get("value")
            or body.get("data")
            or body.get("organizations")
            or body.get("items")
            or body.get("results")
            or []
        )

    if not isinstance(items, list) or not items:
        return []

    orgs = []
    for item in items:
        if not isinstance(item, dict):
            continue
        name = (
            item.get("name") or item.get("Name")
            or item.get("organizationName") or item.get("shortName") or ""
        ).strip()
        if not name:
            continue

        desc = (
            item.get("description") or item.get("Description")
            or item.get("summary") or item.get("about") or ""
        ).strip()

        raw_cats = item.get("categories") or item.get("Categories") or []
        categories = [
            (c.get("name") or c.get("Name") or str(c)).strip()
            if isinstance(c, dict) else str(c).strip()
            for c in raw_cats
            if c
        ]

        external_id = str(
            item.get("id") or item.get("Id")
            or item.get("organizationId") or item.get("webKey") or ""
        )

        orgs.append({
            "campus": campus,
            "name": name,
            "description": desc,
            "categories": categories,
            "website": (item.get("websiteKey") or item.get("website") or "").strip(),
            "email": (item.get("email") or item.get("contactEmail") or "").strip(),
            "external_id": external_id,
            "source_url": source_url,
            "scraped_at": now,
        })
    return orgs


async def _dom_fallback(page: Page, campus: str, source_url: str, now: str) -> list[dict]:
    """
    DOM fallback: extract org cards when API interception yields nothing.
    CampusGroups renders org tiles with data-* attributes or visible text.
    """
    orgs = []
    # Try common card selectors used by CampusGroups / Presence platforms
    selectors = [
        '[data-name]',
        '[class*="org-card"]',
        '[class*="OrganizationCard"]',
        '[class*="tile"]',
    ]
    cards = []
    for sel in selectors:
        cards = await page.query_selector_all(sel)
        if cards:
            break

    for card in cards:
        # Prefer data attribute; fall back to first heading or strong text
        name = await card.get_attribute("data-name") or ""
        if not name:
            el = await card.query_selector("h2, h3, h4, strong, [class*='name']")
            name = (await el.inner_text()).strip() if el else ""
        if not name:
            continue

        desc_el = await card.query_selector("p, [class*='desc'], [class*='summary']")
        desc = (await desc_el.inner_text()).strip() if desc_el else ""

        orgs.append({
            "campus": campus,
            "name": name,
            "description": desc,
            "categories": [],
            "website": "",
            "email": "",
            "external_id": "",
            "source_url": source_url,
            "scraped_at": now,
        })

    return orgs


def scrape_html_clubs(campus: str, source_url: str) -> list[dict]:
    """
    Scrape GatherUWB (UW Bothell) club directory — server-rendered HTML,
    no JavaScript required. Each club is in <li class="list-group-item">.
    Follows pagination if present.
    """
    now = datetime.now(timezone.utc).isoformat()
    orgs: list[dict] = []
    seen: set[str] = set()
    page_url: str | None = source_url

    while page_url:
        resp = requests.get(page_url, headers=_HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        for li in soup.select("li.list-group-item"):
            name_tag = li.select_one("h2.media-heading a")
            if not name_tag:
                continue
            name = name_tag.get_text(strip=True)
            if not name or name in seen:
                continue
            seen.add(name)

            href = name_tag.get("href", "")
            id_match = re.search(r"club_id=(\d+)", href)
            external_id = id_match.group(1) if id_match else ""

            cat_tag = li.select_one("p.grey-element")
            categories: list[str] = []
            if cat_tag:
                raw = cat_tag.get_text(separator=" ", strip=True)
                # Format: "Department - Social/Recreational" — drop the "Department" label
                categories = [
                    c.strip()
                    for c in re.split(r"[-\n]", raw)
                    if c.strip() and c.strip().lower() != "department"
                ]

            # Description: any non-heading paragraph in the card body
            desc_parts = [
                p.get_text(strip=True)
                for p in li.select("div.media-body p")
                if "grey-element" not in (p.get("class") or [])
                and p.get_text(strip=True)
            ]
            description = " ".join(desc_parts[:3])

            orgs.append({
                "campus":      campus,
                "name":        name,
                "description": description,
                "categories":  categories,
                "website":     f"https://gather.uwb.edu/student_community?club_id={external_id}" if external_id else "",
                "email":       "",
                "external_id": external_id,
                "source_url":  page_url,
                "scraped_at":  now,
            })

        # Follow pagination if there is a "next" link
        next_link = soup.select_one('a[rel="next"], li.next > a, .pagination .next a')
        if next_link and next_link.get("href"):
            href = next_link["href"]
            page_url = href if href.startswith("http") else f"https://gather.uwb.edu{href}"
        else:
            page_url = None

    return orgs


async def scrape_target(page: Page, url: str, campus: str, debug_api: bool = False) -> list[dict]:
    """
    Navigate to a campus engagement platform and extract all org records.
    Uses API interception; falls back to DOM scraping.
    Pass debug_api=True to print every JSON API call the page makes (helps
    discover endpoint patterns for new CampusGroups instances).
    """
    now = datetime.now(timezone.utc).isoformat()
    # Deduplicate during capture so the scroll-termination counter is accurate
    seen_keys: set[tuple] = set()
    captured: list[dict] = []

    # CampusGroups endpoint patterns that carry paginated org lists
    ORG_SEARCH_PATTERNS = ("/search/organizations", "/search/chapters", "/club_signup")

    async def on_response(resp: Response) -> None:
        if resp.status != 200:
            return
        content_type = resp.headers.get("content-type", "")
        if "json" not in content_type:
            return
        url_lower = resp.url.lower()

        if debug_api:
            try:
                body = await resp.json()
                print(f"    [debug] {resp.url[:100]}")
                print(f"           keys={list(body.keys()) if isinstance(body, dict) else type(body).__name__}")
            except Exception:
                pass
            return

        if not any(p in url_lower for p in ORG_SEARCH_PATTERNS):
            return
        # Skip pure metadata endpoints
        if any(k in url_lower for k in ("/category", "/branch", "/tag", "/type")):
            return
        try:
            body = await resp.json()
            orgs = _extract_orgs_from_api(body, campus, url, now)
            new_count = 0
            for org in orgs:
                key = (org["campus"], org["name"])
                if key not in seen_keys:
                    seen_keys.add(key)
                    captured.append(org)
                    new_count += 1
            if new_count:
                print(f"    API hit {resp.url[:80]} → +{new_count} new ({len(captured)} total)")
        except Exception:
            pass

    page.on("response", on_response)

    print(f"  Navigating to {url} …")
    try:
        await page.goto(url, wait_until="networkidle", timeout=60_000)
    except Exception as e:
        print(f"  Navigation timeout/error: {e}", file=sys.stderr)

    # Scroll until 3 consecutive scrolls yield no new data (handles infinite scroll pagination)
    consecutive_empty = 0
    for _ in range(200):
        prev = len(captured)
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1_500)
        if len(captured) == prev:
            consecutive_empty += 1
            if consecutive_empty >= 3:
                break
        else:
            consecutive_empty = 0

    # Click "Load More" / "Next Page" buttons if present — wrapped so a page
    # navigation or close doesn't crash the whole run
    try:
        for btn_text in ("Load More", "Show More", "Next", "load more"):
            while True:
                btn = await page.query_selector(f'button:has-text("{btn_text}"), a:has-text("{btn_text}")')
                if not btn:
                    break
                prev = len(captured)
                await btn.click()
                await page.wait_for_timeout(2_000)
                if len(captured) == prev:
                    break
    except Exception:
        pass  # button section is a best-effort supplement; API data is already captured

    if captured:
        return captured

    # API interception found nothing — fall back to DOM
    print("  No API responses captured; trying DOM fallback …")
    return await _dom_fallback(page, campus, url, now)


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

async def scrape_all(
    headed: bool = False,
    cookie_file: str | None = None,
    cookie_file_tacoma: str | None = None,
    debug_api: bool = False,
    only_campus: str | None = None,
) -> list[dict]:
    all_orgs: list[dict] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=not headed)

        for target in TARGETS:
            campus = target["campus"]
            needs_auth = target.get("auth", False)

            if only_campus and campus.lower() != only_campus.lower():
                continue

            # Create a fresh context per campus so cookies don't bleed across domains
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                )
            )

            if campus == "Tacoma" and cookie_file_tacoma:
                await _inject_cookies(context, cookie_file_tacoma)
            elif campus != "Tacoma" and cookie_file:
                await _inject_cookies(context, cookie_file)

            if needs_auth and campus == "Tacoma" and not cookie_file_tacoma:
                print(f"\nSkipping {campus} — requires login. Export DubNet cookies and pass --cookies-tacoma <file>.")
                await context.close()
                continue

            print(f"\nScraping {campus} …")
            if target.get("method") == "html":
                orgs = scrape_html_clubs(campus, target["url"])
            else:
                page = await context.new_page()
                orgs = await scrape_target(page, target["url"], campus, debug_api=debug_api)
                await page.close()
            print(f"  -> {len(orgs)} orgs found for {campus}")
            all_orgs.extend(orgs)
            await context.close()

        await browser.close()

    return all_orgs


# ---------------------------------------------------------------------------
# Upsert
# ---------------------------------------------------------------------------

def upsert_to_supabase(orgs: list[dict], url: str, key: str) -> None:
    from supabase import create_client
    client = create_client(url, key)
    # Supabase has a ~1 MB request limit; batch in chunks of 200 to stay safe
    chunk_size = 200
    total = 0
    for i in range(0, len(orgs), chunk_size):
        chunk = orgs[i : i + chunk_size]
        try:
            client.table("campus_orgs").upsert(chunk, on_conflict="campus,name").execute()
            total += len(chunk)
            print(f"  Upserted rows {i+1}–{i+len(chunk)} ({total} so far)")
        except Exception as e:
            print(f"  Upsert error on rows {i+1}–{i+len(chunk)}: {e}", file=sys.stderr)
            raise
    print(f"  Done — {total} rows → campus_orgs")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scrape UW campus student organizations into Supabase",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--upsert",          action="store_true", help="Write results to Supabase")
    parser.add_argument("--headed",          action="store_true", help="Show browser window (debug)")
    parser.add_argument("--campus",          default=None, help="Scrape only this campus: Seattle, Bothell, or Tacoma")
    parser.add_argument("--debug-api",       action="store_true", help="Print every JSON API call the page makes (for discovering new endpoint patterns)")
    parser.add_argument("--cookies",         default=None, help="Netscape cookie file (Seattle/Bothell)")
    parser.add_argument("--cookies-tacoma",  default=None, help="Netscape cookie file for DubNet (Tacoma)")
    parser.add_argument("--supabase-url",    default=os.getenv("SUPABASE_URL"))
    parser.add_argument("--supabase-key",    default=os.getenv("SUPABASE_SERVICE_KEY"))
    args = parser.parse_args()

    orgs = asyncio.run(scrape_all(
        headed=args.headed,
        cookie_file=args.cookies,
        cookie_file_tacoma=args.cookies_tacoma,
        debug_api=args.debug_api,
        only_campus=args.campus,
    ))

    if not orgs:
        print("No orgs found. Try --headed to watch the browser and diagnose.")
        sys.exit(1)

    if args.upsert:
        if not args.supabase_url or not args.supabase_key:
            print(
                "Error: --upsert requires SUPABASE_URL and SUPABASE_SERVICE_KEY.\n"
                "Set them in .env or pass --supabase-url / --supabase-key.",
                file=sys.stderr,
            )
            sys.exit(1)
        upsert_to_supabase(orgs, args.supabase_url, args.supabase_key)
    else:
        print("\nDry-run results (pass --upsert to write to Supabase):")
        for o in orgs:
            cats = ", ".join(o["categories"][:2]) if o["categories"] else "—"
            print(f"  [{o['campus']:8s}] {o['name'][:55]:55s}  {cats}")

    print(f"\nTotal: {len(orgs)} orgs. Done.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
UW Time Schedule Scraper
Fetches course sections from the public UW time schedule and upserts them into Supabase.

Usage:
  # Dry run (prints parsed sections, no DB write):
  python uw_schedule_scraper.py --campus B --quarter SPR2026 --dept css

  # Write to Supabase (reads SUPABASE_URL + SUPABASE_SERVICE_KEY from .env or env):
  python uw_schedule_scraper.py --campus B --quarter SPR2026 --dept css --upsert

  # Multiple departments:
  python uw_schedule_scraper.py --campus B --quarter SPR2026 --dept css csse b --upsert

  # Dump raw HTML for debugging if parsing breaks:
  python uw_schedule_scraper.py --campus B --quarter SPR2026 --dept css --dump-html

Campus codes:  B = Bothell, T = Tacoma, (omit or empty) = Seattle
Quarter codes: SPR2026, WIN2026, AUT2025, SUM2026, …
"""

import argparse
import os
import re
import sys
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://www.washington.edu/students/timeschd"

# Mimic a real browser so the UW server doesn't redirect to Shibboleth auth.
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def build_url(campus: str, quarter: str, dept: str) -> str:
    campus = campus.strip("/")
    if campus.lower() == "none":
        campus = ""
    if campus:
        return f"{BASE_URL}/{campus}/{quarter}/{dept.lower()}.html"
    return f"{BASE_URL}/{quarter}/{dept.lower()}.html"


def fetch_html(campus: str, quarter: str, dept: str) -> tuple[str, str]:
    url = build_url(campus, quarter, dept)
    resp = requests.get(url, headers=HEADERS, timeout=30)
    if resp.status_code == 404:
        print(f"  404 – no schedule found at {url}", file=sys.stderr)
        return "", url
    resp.raise_for_status()
    # Detect a Shibboleth redirect (login page returned as 200)
    if "shibboleth" in resp.url.lower() or "weblogin" in resp.url.lower():
        print(
            f"  Redirected to UW login: {resp.url}\n"
            "  The schedule page may require a UW NetID session.\n"
            "  Export your browser cookies to a Netscape-format file and pass --cookies <path>.",
            file=sys.stderr,
        )
        return "", url
    return resp.text, url


def _load_cookies(cookie_file: str) -> requests.cookies.RequestsCookieJar:
    """
    Parse a Netscape-format cookie file into a RequestsCookieJar.
    Handles the '#HttpOnly_' prefix that modern browser extensions add,
    which Python's MozillaCookieJar silently drops (those are the Shibboleth session cookies).
    """
    jar = requests.cookies.RequestsCookieJar()
    with open(cookie_file, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.rstrip("\n")
            # Strip the HttpOnly marker so the rest of the line parses normally
            if line.startswith("#HttpOnly_"):
                line = line[len("#HttpOnly_"):]
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 7:
                continue
            domain, _, path, secure, _expires, name, value = parts[:7]
            jar.set(name, value, domain=domain.lstrip("."), path=path)
    print(f"  Loaded {len(jar)} cookies from {cookie_file}")
    return jar


def fetch_html_with_cookies(campus: str, quarter: str, dept: str, cookie_file: str) -> tuple[str, str]:
    """Fetch using a Netscape-format cookie file (exported from browser after logging in)."""
    jar = _load_cookies(cookie_file)
    session = requests.Session()
    session.cookies = jar
    url = build_url(campus, quarter, dept)
    resp = session.get(url, headers=HEADERS, timeout=30)
    if resp.status_code == 404:
        print(f"  404 – no schedule found at {url}", file=sys.stderr)
        return "", url
    resp.raise_for_status()
    if "shibboleth" in resp.text.lower() and "samlrequest" in resp.text.lower():
        print(
            "  Still hitting Shibboleth — cookies may be expired or missing the session cookie.\n"
            "  Re-export cookies from your browser while on the schedule page and try again.",
            file=sys.stderr,
        )
        return "", url
    return resp.text, url


# ---------------------------------------------------------------------------
# Parse
# ---------------------------------------------------------------------------

def _parse_pre_line(line: str, course_number: str, course_title: str,
                    campus: str, quarter: str, dept: str,
                    source_url: str, now: str) -> dict | None:
    """
    Parse one fixed-width section line from a <pre> block.

    The format (from the actual UW schedule page) is:
      Restr  12884 A  5       TTh    545-745P   UW1  102      Rajanna,Madhu   Open   6/  24
       IS   >21426 A  1-5     to be arranged    *    *                         0/  40
      Restr  12928 AA  LB     F      900-1230   DISC 362      Peng,Yang        Open  21/  24
    """
    # SLN: 5 digits (may be preceded by '>' for IS/instructor-supervised sections)
    m = re.search(r'>?(\d{5})', line)
    if not m:
        return None
    sln = m.group(1)
    after = line[m.end():]

    # Extract enrollment with regex before splitting — "6/  24" has internal spaces
    enroll_m = re.search(r'(\d+)/\s*(\d+)', after)
    enrollment_open = int(enroll_m.group(1)) if enroll_m else None
    enrollment_limit = int(enroll_m.group(2)) if enroll_m else None

    # Extract status
    status_m = re.search(r'\b(Open|Closed|Restr)\b', after, re.IGNORECASE)
    status = status_m.group(1) if status_m else ''

    # Tokenise on 2+ spaces (the page uses fixed-width padding)
    parts = [p.strip() for p in re.split(r'\s{2,}', after.strip()) if p.strip()]
    if len(parts) < 2:
        return None

    section = parts[0]   # "A", "B", "AA", …
    credits  = parts[1]  # "5", "1-5", "LB", …
    idx = 2

    # Meeting info: "to be arranged" or "<days> <time>"
    days = time_str = ''
    if len(parts) > idx and re.search(r'to be arranged', parts[idx], re.IGNORECASE):
        days = 'ARR'
        idx += 1
    elif len(parts) > idx:
        days = parts[idx]
        idx += 1
        # Time token starts with digits (e.g. "545-745P", "1100-100")
        if len(parts) > idx and re.match(r'\d', parts[idx]):
            time_str = parts[idx]
            idx += 1

    # Building and room
    # Tokens with a single space inside (e.g. "DISC 362") stayed together during split
    building = room = ''
    if len(parts) > idx:
        token = parts[idx]
        if ' ' in token:
            building, room = token.split(' ', 1)
            idx += 1
        else:
            building = token
            idx += 1
            if len(parts) > idx and re.match(r'^[\d*]+[A-Z]?$', parts[idx]):
                room = parts[idx]
                idx += 1

    # Instructor: next token that contains a comma (Last,First) or is all-caps
    instructor = ''
    if len(parts) > idx:
        candidate = parts[idx]
        if ',' in candidate or re.match(r'^[A-Z][A-Z ,.\'-]+$', candidate):
            instructor = candidate
            idx += 1

    # Clean up placeholder asterisks (online / no fixed room)
    if building == '*':
        building = ''
    if room == '*':
        room = ''

    meeting_time = (
        'to be arranged' if days == 'ARR'
        else f"{days} {time_str}".strip()
    )

    return {
        'campus': campus,
        'quarter': quarter,
        'department': dept.upper(),
        'course_number': course_number,
        'course_title': course_title,
        'sln': sln,
        'section': section,
        'credits': credits,
        'meeting_days': days,
        'meeting_time': meeting_time,
        'building': building,
        'room': room,
        'instructor': instructor,
        'enrollment_open': enrollment_open,
        'enrollment_limit': enrollment_limit,
        'status': status,
        'source_url': source_url,
        'scraped_at': now,
    }


def parse_sections(html: str, campus: str, quarter: str, dept: str, source_url: str,
                   debug: bool = False) -> list[dict]:
    """
    Parse all course sections from a UW time schedule page.

    Page structure:
    - Green tables (bgcolor='#ccffcc') are course headers: <A NAME=css342>…TITLE…
    - Following white/grey tables each hold one <pre> block per section.
    - <pre> text is fixed-width; the first non-indented line is the section data.
    - Note lines have 16+ leading spaces and are skipped.
    """
    soup = BeautifulSoup(html, "html.parser")
    sections: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()

    # Course headers: <A NAME="css342"> inside a green table
    anchor_re = re.compile(rf'^{re.escape(dept.lower())}\d+', re.IGNORECASE)
    all_anchors = soup.find_all('a', attrs={'name': anchor_re})
    if debug:
        print(f"  [debug] anchors found: {len(all_anchors)}")
        for a in all_anchors[:3]:
            print(f"    name={a.get('name')!r}  parent_tags={[p.name for p in a.parents][:4]}")
        # Show first <pre> block raw text
        first_pre = soup.find('pre')
        if first_pre:
            print(f"  [debug] first <pre> text (first 300 chars):\n{first_pre.get_text(separator='|')[:300]}")

    for anchor in all_anchors:
        name_attr = anchor.get('name', '')
        cn_m = re.match(rf'{re.escape(dept.lower())}(\d+[a-zA-Z]?)', name_attr, re.IGNORECASE)
        if not cn_m:
            continue
        course_number = cn_m.group(1)

        # Course title is the text of the next <a href=…> on the same line
        title_link = anchor.find_next_sibling('a') or anchor.find_next('a', href=True)
        course_title = title_link.get_text(' ', strip=True) if title_link else ''

        green_table = anchor.find_parent('table')
        if debug:
            print(f"  [debug] course {course_number!r}: green_table={'found' if green_table else 'MISSING'}")
        if not green_table:
            continue

        # Walk following siblings until the next green course-header table
        siblings = list(green_table.find_next_siblings())
        if debug and course_number == '101':
            print(f"  [debug] CSS 101 green_table has {len(siblings)} next siblings")
            for s in siblings[:8]:
                tag = getattr(s, 'name', '[text]')
                bg  = s.get('bgcolor', '') if hasattr(s, 'get') else ''
                has_pre = bool(s.find('pre')) if hasattr(s, 'find') else False
                print(f"    tag={tag!r}  bgcolor={bg!r}  has_pre={has_pre}")

        for sibling in siblings:
            if sibling.name == 'table' and sibling.find('a', attrs={'name': anchor_re}):
                break  # reached the next course header
            if sibling.name != 'table':
                continue

            pre = sibling.find('pre')
            if not pre:
                continue

            # No separator so inline <a> tags don't split the fixed-width text
            for line in pre.get_text().split('\n'):
                if not line.strip():
                    continue
                if line.startswith(' ' * 16):
                    continue  # indented note line, not section data
                if not re.search(r'\d{5}', line):
                    continue
                rec = _parse_pre_line(
                    line, course_number, course_title,
                    campus, quarter, dept, source_url, now
                )
                if rec:
                    sections.append(rec)
                break  # only first data line per <pre> block

    return sections


# ---------------------------------------------------------------------------
# Upsert
# ---------------------------------------------------------------------------

def upsert_to_supabase(sections: list[dict], url: str, key: str) -> None:
    from supabase import create_client

    client = create_client(url, key)
    result = (
        client.table("course_sections")
        .upsert(sections, on_conflict="campus,quarter,sln")
        .execute()
    )
    print(f"  Upserted {len(sections)} rows → course_sections")
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scrape UW Time Schedule into Supabase",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--campus",   default="B",        help="Campus code (B, T, or blank for Seattle)")
    parser.add_argument("--quarter",  default="SPR2026",  help="Quarter code e.g. SPR2026")
    parser.add_argument("--dept",     nargs="+",          default=["css"], help="Department(s) e.g. css csse")
    parser.add_argument("--targets",  default=None,       help="JSON file of campus/dept targets (overrides --campus/--dept)")
    parser.add_argument("--upsert",   action="store_true", help="Write results to Supabase")
    parser.add_argument("--dump-html", action="store_true", help="Print raw HTML and exit (debug)")
    parser.add_argument("--cookies",  default=None,       help="Path to Netscape cookie file (if auth required)")
    parser.add_argument("--delay",     type=float, default=0.5, help="Seconds to wait between requests (default 0.5)")
    parser.add_argument("--debug-parse", action="store_true", help="Print parser diagnostic info")
    parser.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL"), help="Supabase project URL")
    parser.add_argument("--supabase-key", default=os.getenv("SUPABASE_SERVICE_KEY"), help="Supabase service role key")
    args = parser.parse_args()

    # Build list of (campus, dept) pairs to scrape
    if args.targets:
        import json
        with open(args.targets, encoding="utf-8") as f:
            config = json.load(f)
        pairs = [
            (entry["campus"], dept)
            for entry in config
            for dept in entry["depts"]
        ]
    else:
        pairs = [(args.campus, dept) for dept in args.dept]

    all_sections: list[dict] = []

    for campus, dept in pairs:
        label = f"{campus}/{args.quarter}/{dept.lower()}" if campus else f"{args.quarter}/{dept.lower()}"
        print(f"Fetching {label} …")

        html, url = "", ""
        for attempt in range(3):
            try:
                if args.cookies:
                    html, url = fetch_html_with_cookies(campus, args.quarter, dept, args.cookies)
                else:
                    html, url = fetch_html(campus, args.quarter, dept)
                break
            except Exception as e:
                wait = (attempt + 1) * 5
                print(f"  Connection error (attempt {attempt + 1}/3): {e}. Retrying in {wait}s…", file=sys.stderr)
                time.sleep(wait)
        else:
            print(f"  Skipping {label} after 3 failed attempts.", file=sys.stderr)

        time.sleep(args.delay)

        if not html:
            continue

        if args.dump_html:
            print(html)
            return

        sections = parse_sections(html, campus, args.quarter, dept, url,
                                   debug=args.debug_parse)
        print(f"  Parsed {len(sections)} sections from {url}")

        if not sections:
            print("  No sections found – page may be empty, or run with --dump-html to inspect.")
        all_sections.extend(sections)

    if not all_sections:
        print("Nothing to write.")
        sys.exit(1)

    if args.upsert:
        if not args.supabase_url or not args.supabase_key:
            print(
                "Error: --upsert requires SUPABASE_URL and SUPABASE_SERVICE_KEY.\n"
                "Set them in a .env file or pass --supabase-url / --supabase-key.",
                file=sys.stderr,
            )
            sys.exit(1)
        upsert_to_supabase(all_sections, args.supabase_url, args.supabase_key)
    else:
        print("\nDry-run results (pass --upsert to write to Supabase):")
        for s in all_sections:
            instructor = s["instructor"] or "TBA"
            print(
                f"  {s['department']:6s} {s['course_number']:4s} {s['section']:3s}  "
                f"SLN {s['sln']}  {s['meeting_days']:8s} {s['meeting_time']:20s}  "
                f"{instructor}"
            )

    print("Done.")


if __name__ == "__main__":
    main()

import sys
import json
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from typing import Optional, Dict, Any

COURT_PORTAL_URL = "https://portal.scscourt.org/search"

def attempt_live_search(first_name: str, last_name: str) -> Optional[str]:
    """
    Attempt to fetch data from the live court portal.
    Returns HTML content if successful, None if blocked or unavailable.
    """
    try:
        headers = {
            'User-Agent': 'Court Records Research Bot - Educational Purpose',
            'Accept': 'text/html,application/xhtml+xml',
        }

        params = {
            'firstName': first_name,
            'lastName': last_name
        }

        response = requests.get(
            COURT_PORTAL_URL,
            params=params,
            headers=headers,
            timeout=10
        )

        if response.status_code == 200:
            html_lower = response.text.lower()

            if 'captcha' in html_lower or 'recaptcha' in html_lower:
                print("Live access blocked: CAPTCHA detected", file=sys.stderr)
                return None

            if 'access denied' in html_lower or 'forbidden' in html_lower:
                print("Live access blocked: Access denied", file=sys.stderr)
                return None

            if len(response.text) < 100:
                print("Live access failed: Response too short", file=sys.stderr)
                return None

            print(f"Live access successful: Retrieved {len(response.text)} bytes", file=sys.stderr)
            return response.text

        else:
            print(f"Live access failed: HTTP {response.status_code}", file=sys.stderr)
            return None

    except requests.exceptions.Timeout:
        print("Live access failed: Timeout", file=sys.stderr)
        return None
    except requests.exceptions.ConnectionError:
        print("Live access failed: Connection error", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Live access failed: {str(e)}", file=sys.stderr)
        return None

def get_fixture_path(first_name: str, last_name: str) -> Optional[str]:
    """Get the path to mock fixture if available."""
    import os
    key = f"{first_name.lower()}-{last_name.lower()}"

    fixtures = {
        'john-smith': 'fixtures/john-smith-search.html',
        'jose-garcia': 'fixtures/jose-garcia-search.html',
    }

    fixture_path = fixtures.get(key)
    if fixture_path:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        full_path = os.path.join(project_root, fixture_path)
        if os.path.exists(full_path):
            return full_path

    return None

def load_fixture(fixture_path: str) -> Optional[str]:
    """Load HTML content from fixture file."""
    try:
        with open(fixture_path, 'r', encoding='utf-8') as f:
            content = f.read()
            print(f"Using mock data from: {fixture_path}", file=sys.stderr)
            return content
    except Exception as e:
        print(f"Failed to load fixture: {str(e)}", file=sys.stderr)
        return None

def main():
    if len(sys.argv) != 3:
        print(json.dumps({
            "success": False,
            "error": "InvalidArguments",
            "message": "Usage: python scraper.py <first_name> <last_name>"
        }))
        sys.exit(1)

    first_name = sys.argv[1]
    last_name = sys.argv[2]

    print(f"Searching for: {first_name} {last_name}", file=sys.stderr)
    print("Attempting live access first...", file=sys.stderr)

    html_content = attempt_live_search(first_name, last_name)
    data_source = "live"

    if html_content is None:
        print("Live access not available, checking for mock data...", file=sys.stderr)
        fixture_path = get_fixture_path(first_name, last_name)

        if fixture_path:
            html_content = load_fixture(fixture_path)
            data_source = "mock"
        else:
            print(json.dumps({
                "success": True,
                "totalCases": 0,
                "cases": [],
                "query": {
                    "firstName": first_name,
                    "lastName": last_name
                },
                "message": "No data available (live blocked, no mock fixture)"
            }))
            sys.exit(0)

    if html_content is None:
        print(json.dumps({
            "success": False,
            "error": "DataRetrievalError",
            "message": "Could not retrieve data from live or mock sources"
        }))
        sys.exit(1)

    # Output the HTML content and data source for the parser
    print(json.dumps({
        "html": html_content,
        "dataSource": data_source
    }))

if __name__ == "__main__":
    main()

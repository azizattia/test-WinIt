# Santa Clara County Court Records API

Full-stack API for searching Santa Clara court records. Attempts to access live court portal first, automatically falls back to mock data if access is blocked or unavailable.

## Tech Stack

- Next.js 14 + React 18
- TypeScript
- Python 3 (BeautifulSoup for parsing, Requests for HTTP)
- Plain CSS (no frameworks)
- Docker

## Getting Started

### With Docker

```bash
docker-compose up --build
```

Then open http://localhost:3000

### Without Docker

```bash
npm install
pip3 install -r python/requirements.txt
npm run dev
```

## Testing the API

Try these names in the web interface or via curl:
- John Smith (2 cases - mock)
- Jose Garcia (1 case - mock)
- Any other name (will attempt live access first)

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Smith"}'
```

Response includes `dataSource` field showing whether data came from "live" or "mock" source.

## Access & Anti-Bot Strategy (Legal and Operational)

### Live Access Attempt (Primary Method)

This API **attempts to access the live court portal first** for every search:

1. Sends HTTP request to https://portal.scscourt.org/search
2. Uses proper User-Agent identification
3. Includes timeout and error handling
4. Detects and respects blocking mechanisms

**What we check for:**
- CAPTCHA presence (immediate fallback)
- Access denied messages
- HTTP error codes (403, 429, etc.)
- Connection timeouts or failures
- Geo-restrictions

**No bypass attempts:**
- Not circumventing CAPTCHAs
- Not using proxies or VPNs
- Not spoofing headers to evade detection
- Not attempting rate limit bypass
- Not using headless browsers to avoid detection

### Mock Data Fallback (Secondary Method)

When live access is blocked or unavailable, the system automatically falls back to pre-saved HTML fixtures:

- Fixtures stored in `fixtures/` directory
- Only available for test names (John Smith, Jose Garcia)
- Returns 404 if no fixture exists for the searched name

### How It Works

1. **User submits search** (firstName + lastName)
2. **Scraper attempts live access** (`python/scraper.py`)
   - Makes HTTP request with proper identification
   - Checks response for blocking indicators
   - Returns HTML if successful
3. **If live blocked:**
   - Logs the reason (CAPTCHA, access denied, timeout, etc.)
   - Looks for matching mock fixture
   - Uses fixture if available, otherwise returns 404
4. **Parser processes HTML** (`python/parser.py`)
   - Extracts case data using BeautifulSoup
   - Returns structured JSON
   - Includes `dataSource` field ("live" or "mock")

### Compliance Statement

**This implementation does not bypass security protections.**

We respect all access controls:
- CAPTCHA detected → immediate fallback to mock
- Access denied → immediate fallback to mock
- Rate limits → no retry attempts
- Any blocking → graceful degradation

Live access requires:
- No CAPTCHA present
- No access restrictions
- Successful HTTP response
- Valid HTML content

If these conditions aren't met, we use mock data or return no results.

### Future Live Access

For production live access, we would need:
- Written permission from Santa Clara County Superior Court
- Official API or authorized access method
- Rate limiting (1 request per 5 seconds minimum)
- Proper authentication if required
- Legal review and approval

## How It Works

1. User submits first/last name
2. API calls Python scraper
3. Scraper attempts live portal access
4. If blocked: falls back to mock fixture
5. Parser extracts structured data from HTML
6. JSON response returned to client

## API Documentation

### POST /api/search

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith"
}
```

**Response (200):**
```json
{
  "success": true,
  "totalCases": 2,
  "cases": [
    {
      "caseInfo": {
        "caseNumber": "23CV401234",
        "filingDate": "01/15/2023",
        "caseType": "Civil - Unlimited",
        "status": "Active",
        "courtLocation": "Santa Clara County Superior Court - Old Courthouse"
      },
      "parties": [...],
      "hearings": [...],
      "financials": {...},
      "sourceMetadata": {
        "sourceUrl": "https://portal.scscourt.org/search",
        "scrapeTimestamp": "2023-11-07T12:00:00Z",
        "dataSource": "mock"
      }
    }
  ],
  "query": {
    "firstName": "John",
    "lastName": "Smith"
  }
}
```

**404:** No cases found (live blocked + no mock fixture)
**400:** Missing firstName or lastName
**500:** Server error

### GET /api/search

Returns API info and available test names.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/search/route.ts    # API endpoint
│   │   ├── globals.css            # Plain CSS styles
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── SearchForm.tsx         # React UI
│   └── lib/
│       └── types.ts               # TypeScript types
├── python/
│   ├── scraper.py                 # Live access attempt + fallback
│   ├── parser.py                  # HTML parser
│   └── requirements.txt
├── fixtures/
│   ├── john-smith-search.html
│   └── jose-garcia-search.html
├── examples/
│   └── example-response-john-smith.json
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Development Notes

**Scraper** (`scraper.py`):
- Attempts HTTP request to live portal
- Detects CAPTCHA, access denied, timeouts
- Falls back to fixture if blocked
- Returns HTML + data source indicator

**Parser** (`parser.py`):
- Extracts case info, parties, hearings, financials
- Works with both live and mock HTML
- Includes data source in metadata

**Input sanitization**: Allows only letters, spaces, hyphens, apostrophes.

## License

For educational purposes. Production use requires authorization from Santa Clara County Superior Court.

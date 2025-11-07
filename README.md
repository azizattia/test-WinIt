# Santa Clara County Court Records API

Full-stack API for searching Santa Clara court records. Takes a first and last name, returns structured case data including case info, parties, hearings, and financials.

## Tech Stack

- Next.js 14 + React 18
- TypeScript
- Python 3 (BeautifulSoup for parsing)
- Tailwind CSS
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
- John Smith (2 cases)
- Jose Garcia (1 case)

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Smith"}'
```

You should get back JSON with case details. Check `examples/example-response-john-smith.json` for what the response looks like.

## Access & Anti-Bot Strategy (Legal and Operational)

### Compliance Approach

This implementation uses mock data fixtures instead of live scraping to comply with the court portal's terms of service and anti-bot protections.

**What we checked:**
- Reviewed the court portal's robots.txt and terms of use
- Found that automated scraping is prohibited
- CAPTCHA and WAF protections are in place

**Our approach:**
- Using pre-saved HTML fixtures in `fixtures/` directory
- No live requests to the court portal
- Sample data for testing: John Smith and Jose Garcia

**No security bypass:**
- Not circumventing CAPTCHAs or reCAPTCHA
- Not using proxies or VPNs to evade detection
- Not spoofing user agents
- Not attempting to bypass rate limits or WAF

### Mock vs Live Mode

The app is set up to support both modes:

**Mock mode (current):**
- Uses HTML files from `fixtures/`
- Safe for testing and demo

**Live mode (not implemented):**
Would require:
- Written permission from the court
- Official API credentials
- Rate limiting implementation
- Legal approval

### If implementing live access

We'd need to:
- Get explicit written permission
- Implement proper rate limiting (1 req per 5 sec minimum)
- Use clear user-agent identification
- Respect 429 responses
- Cache results to minimize requests

**Bottom line:** This implementation doesn't bypass any security. It's using mock data for demonstration purposes only. Live scraping would require proper authorization.

## How It Works

1. User submits first/last name via web form or API
2. Next.js API route validates and sanitizes input
3. Python parser extracts data from HTML fixtures
4. Structured JSON returned to client

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

**404:** No cases found
**400:** Missing firstName or lastName
**500:** Server error

### GET /api/search

Returns API info and available test names.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/search/route.ts    # API endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── SearchForm.tsx         # React UI
│   └── lib/
│       └── types.ts               # TypeScript types
├── python/
│   ├── parser.py                  # BeautifulSoup HTML parser
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

The Python parser extracts:
- Case number, filing date, type, status, location
- All parties (name, role, details)
- All hearings (date/time, type, department, judge, result)
- Financial info (fines, fees, balance)

Input sanitization prevents command injection by allowing only letters, spaces, hyphens, and apostrophes.

## License

For educational purposes. Any production use must comply with applicable laws and court system terms of service.

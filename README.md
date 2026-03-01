# Inspector AI

An AI-powered home pre-inspection tool for home buyers. Enter a property address and get an instant, personalized inspection risk report generated from real public building permit records.

## What It Does

1. Looks up public building permit records for the address from city open-data APIs
2. Classifies and analyzes those permits (roof work, ADU/garage conversions, structural changes, etc.)
3. Sends the permit data to Google Gemini to generate a structured inspection report
4. Returns a report with an AI summary, key positives, red flags, questions to ask your agent, and a list of nearby home inspectors

**Supported cities:** Los Angeles, Chicago, San Francisco, San Diego County, Seattle, New York City

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Python 3, FastAPI, Uvicorn |
| AI | Google Gemini API |
| Permit Data | Socrata Open Data (LA), Chicago/SF/SD/Seattle/NYC Open Data APIs |
| Inspector Search | Google Geocoding API + Google Places Text Search API |

## Project Structure

```
irvine-hacks-2026/
├── backend.py                  # FastAPI app, POST /inspection-report endpoint
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (see setup below)
├── services/
│   ├── permit_lookup.py        # Routes addresses to city permit fetchers
│   ├── ai_service.py           # Google Gemini integration
│   ├── rules.py                # Regex-based permit classifier
│   ├── address_parser.py       # Parses full address strings into components
│   └── clients/
│       ├── ladbs_client.py     # Los Angeles (LADBS) permit data
│       ├── chicago_client.py   # Chicago permit data
│       ├── sf_client.py        # San Francisco permit data
│       ├── sandiego_client.py  # San Diego County permit data
│       ├── seattle_client.py   # Seattle permit data
│       ├── nyc_client.py       # New York City permit data
│       └── places_client.py    # Google Places — nearby inspector search
└── frontend/
    ├── app/
    │   ├── page.tsx            # Landing page
    │   ├── address/page.tsx    # Address input form
    │   └── report/page.tsx     # Report display page
    └── components/
        └── TypingHeadline.tsx  # Animated headline component
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))
- A Google Maps API key with Geocoding and Places APIs enabled (optional — skips inspector search if absent)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/irvine-hacks-2026.git
cd irvine-hacks-2026
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=models/gemini-2.5-flash-lite   # optional, this is the default
SOCRATA_APP_TOKEN=your_socrata_token_here   # optional, improves LA permit rate limits
GOOGLE_MAPS_API_KEY=your_maps_api_key_here  # optional, enables nearby inspector search
```

### 3. Start the backend

```bash
pip install -r requirements.txt
uvicorn backend:app --reload
```

The API will be running at `http://localhost:8000`. Interactive docs are available at `http://localhost:8000/docs`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:3000`.

If your backend runs on a different URL, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API

### `POST /inspection-report`

Generates an inspection report for a given address.

**Request body:**

```json
{
  "address": "123 Main St, Los Angeles, CA 90001",
  "year_built": 1985,
  "has_adu": false
}
```

**Response:**

```json
{
  "status": "OK",
  "summary": "...",
  "good_points": [{ "text": "...", "detail": "..." }],
  "bad_points":  [{ "text": "...", "detail": "..." }],
  "questions":   [{ "text": "...", "detail": "..." }],
  "disclaimer":  "...",
  "nearby_inspectors": [
    {
      "name": "...",
      "address": "...",
      "rating": 4.8,
      "distance_miles": 1.2
    }
  ]
}
```

**Error status values:**

| Status | Meaning |
|---|---|
| `UNSUPPORTED_CITY` | Address is not in a supported city |
| `NO_PERMITS_FOUND` | No permit records found for the address |
| `ERROR` | Internal server error |

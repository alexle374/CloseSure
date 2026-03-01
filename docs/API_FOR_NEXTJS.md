# Inspection Report API — Contract for Next.js

Use this backend as a **standalone API server**. Your Next.js app should call it over HTTP (e.g. `fetch` or axios). No need to port Python to Next.js; keep this repo as the API and host it (e.g. Railway, Render, or same host behind a reverse proxy).

---

## Base URL

- Local: `http://127.0.0.1:8000`
- Production: set `NEXT_PUBLIC_API_URL` or your backend base URL in Next.js env.

---

## Endpoint: `POST /inspection-report`

**Request body (JSON):**

| Field          | Type    | Required | Description                          |
|----------------|---------|----------|--------------------------------------|
| `full_address` | string  | Yes      | Full address, e.g. "956 4th Ave, Los Angeles, CA 90019" |
| `year_built`   | number  | Yes      | Year the property was built          |
| `adu_claimed`  | boolean | No       | Whether listing claims ADU/garage conversion (default: false) |

**Success (200) — Slim response (default):**

```json
{
  "status": "OK",
  "summary": "string",
  "good_points": ["string"],
  "bad_points": ["string"],
  "questions_to_ask": ["string"],
  "disclaimer": "string",
  "nearby_inspectors": [
    { "name": "string", "rating": number | null, "distance_miles": number | null, "address": "string" }
  ],
  "nearby_inspectors_note": "string | null"
}
```

**Unsupported city (200):**

```json
{
  "status": "UNSUPPORTED_CITY",
  "message": "Permit lookup supports Los Angeles, Chicago, San Francisco, San Diego, Seattle, and New York City.",
  "parsed_full_address": { ... },
  "year_built": number,
  "permits": []
}
```

**Error (4xx/5xx):** `{ "detail": "string" }`

---

## TypeScript types (copy into your Next.js app)

```ts
// Request
export interface InspectionReportRequest {
  full_address: string;
  year_built: number;
  adu_claimed?: boolean;
}

// Nearby inspector (Google Places)
export interface NearbyInspector {
  name: string;
  rating: number | null;
  distance_miles: number | null;
  address: string;
}

// Success response
export interface InspectionReportResponse {
  status: "OK";
  summary: string;
  good_points: string[];
  bad_points: string[];
  questions_to_ask: string[];
  disclaimer: string;
  nearby_inspectors: NearbyInspector[];
  nearby_inspectors_note: string | null;
}

// Unsupported city
export interface UnsupportedCityResponse {
  status: "UNSUPPORTED_CITY";
  message: string;
  parsed_full_address: Record<string, unknown>;
  year_built: number;
  permits: unknown[];
}

export type InspectionReportApiResponse = InspectionReportResponse | UnsupportedCityResponse;
```

---

## Example: fetch from Next.js (App Router or Pages)

```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/inspection-report`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    full_address: "956 4th Ave, Los Angeles, CA 90019",
    year_built: 1952,
    adu_claimed: false,
  }),
});
const data = await res.json();
if (data.status === "OK") {
  // data.summary, data.good_points, data.nearby_inspectors, etc.
} else if (data.status === "UNSUPPORTED_CITY") {
  // show data.message
}
```

---

## Optional: full payload

`POST /inspection-report?full=true` returns the full payload (permit_result, ai_report, input) for debugging. For the main site, use the default slim response above.

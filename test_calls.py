"""
Test inspection report for supported cities (Los Angeles, Chicago, San Francisco).
Prompts for a full address, year built, and ADU; calls the API and shows the report.
"""
import requests
import json

API_URL = "http://127.0.0.1:8000/inspection-report"

EXPECTED_KEYS = ["summary", "good_points", "bad_points", "questions_to_ask", "disclaimer"]


def main():
    print("=== Inspection Report — Test Supported Cities ===\n")
    print("Supported: Los Angeles, Chicago, San Francisco, San Diego, Seattle, New York City\n")

    full_address = input(
        "Add a city address (e.g. 956 4th Ave, Los Angeles/San Fransisco/Chicago/San Diego/Seattle/New York City, CA 90019: "
    ).strip()
    if not full_address:
        print("Address required.")
        return

    year_input = input("Year built (e.g. 1949): ").strip()
    try:
        year_built = int(year_input)
    except ValueError:
        print("Year must be a number.")
        return

    adu_input = input("ADU, Garage Conversion, Guest House? (yes/no) [no]: ").strip().lower() or "no"
    adu_claimed = adu_input in ("yes", "y", "1", "true")

    payload = {
        "full_address": full_address,
        "year_built": year_built,
        "adu_claimed": adu_claimed,
    }

    print("\n--- Sending request ---")
    try:
        r = requests.post(API_URL, json=payload, timeout=60)
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect. Is the backend running? (uvicorn backend:app)")
        return

    print(f"Status: {r.status_code}\n")
    try:
        data = r.json()
    except requests.exceptions.JSONDecodeError:
        print("Error: Backend returned invalid or empty JSON.")
        print("Response text (first 500 chars):", (r.text or "(empty)")[:500])
        return

    if r.status_code != 200:
        print("Response:", json.dumps(data, indent=2))
        return

    # Check for UNSUPPORTED_CITY (permit lookup returns 200 but with different structure)
    if data.get("status") == "UNSUPPORTED_CITY":
        print("Result: City not supported.")
        print(data.get("message", "Permit lookup supports LA, Chicago, SF, San Diego, Seattle, NYC."))
        print(json.dumps(data, indent=2))
        return

    # Validate expected format
    missing = [k for k in EXPECTED_KEYS if k not in data]
    if missing:
        print(f"Format check FAILED: missing keys {missing}")
    else:
        print("Format check OK: summary, good_points, bad_points, questions_to_ask, disclaimer present.\n")

    # Pretty-print the report
    print("--- Report ---")
    print(f"Summary: {data.get('summary', '')}")
    print("\nGood points:")
    for i, p in enumerate(data.get("good_points", []), 1):
        print(f"  {i}. {p}")
    print("\nBad points:")
    for i, p in enumerate(data.get("bad_points", []), 1):
        print(f"  {i}. {p}")
    print("\nQuestions to ask:")
    for i, p in enumerate(data.get("questions_to_ask", []), 1):
        print(f"  {i}. {p}")
    print(f"\nDisclaimer: {data.get('disclaimer', '')}")

    inspectors = data.get("nearby_inspectors", [])
    note = data.get("nearby_inspectors_note")
    if inspectors:
        print("\nNearby inspectors (name, rating, distance):")
        for i, insp in enumerate(inspectors, 1):
            rating = insp.get("rating")
            dist = insp.get("distance_miles")
            rating_s = f"{rating}" if rating is not None else "—"
            dist_s = f"{dist} mi" if dist is not None else "—"
            print(f"  {i}. {insp.get('name', '—')}  rating: {rating_s}  distance: {dist_s}")
    else:
        print("\nNearby inspectors: (none)")
        if note:
            print(f"  → {note}")


if __name__ == "__main__":
    main()

from datetime import datetime
from .address_parser import parse_full_address
from .clients import (
    fetch_permits_la,
    fetch_permits_chicago,
    fetch_permits_sf,
    fetch_permits_sandiego,
    fetch_permits_seattle,
    fetch_permits_nyc,
)
from .rules import classify_permit, summarize_categories, build_highlights

# City (normalized) -> fetcher. Fetcher(address, zip_code, limit) -> { permits, fallback_used, parsed }.
CITY_FETCHERS = {
    "los angeles": fetch_permits_la,
    "la": fetch_permits_la,
    "chicago": fetch_permits_chicago,
    "san francisco": fetch_permits_sf,
    "sf": fetch_permits_sf,
    "san diego": fetch_permits_sandiego,
    "seattle": fetch_permits_seattle,
    "new york": fetch_permits_nyc,
    "new york city": fetch_permits_nyc,
    "nyc": fetch_permits_nyc,
}

def _normalize_city(city: str) -> str:
    return (city or "").strip().lower()


def lookup_by_full_address(
    full_address: str,
    year_built: int,
    adu_claimed: bool,
    limit: int = 25
):
    parsed = parse_full_address(full_address)
    city_key = _normalize_city(parsed.get("city") or "")

    current_year = datetime.now().year
    estimated_age = max(0, current_year - year_built)

    fetcher = CITY_FETCHERS.get(city_key)
    if not fetcher:
        return {
            "status": "UNSUPPORTED_CITY",
            "message": "Permit lookup supports Los Angeles, Chicago, San Francisco, San Diego, Seattle, and New York City.",
            "parsed_full_address": parsed,
            "year_built": year_built,
            "estimated_age": estimated_age,
            "count": 0,
            "permits": [],
        }

    result = fetcher(address=parsed["street_line"], zip_code=parsed["zip_code"], limit=limit)
    permits = result["permits"]

    for p in permits:
        p["categories"] = classify_permit(p)

    flags = summarize_categories(permits)
    highlights = build_highlights(permits)

    _source = {
        "los angeles": "LADBS (LA)", "la": "LADBS (LA)",
        "chicago": "Chicago", "san francisco": "SF DBI", "sf": "SF DBI",
        "san diego": "SD County", "seattle": "Seattle", "new york": "NYC DOB",
        "new york city": "NYC DOB", "nyc": "NYC DOB",
    }
    source = _source.get(city_key, city_key)
    messages = [
        f"Year built: {year_built} (estimated age: {estimated_age}).",
        f"Found {len(permits)} permit(s) in {source} records."
    ]

    if adu_claimed:
        if flags.get("adu_or_conversion_detected"):
            messages.append("Potential ADU/garage conversion indicators detected in permit text.")
        else:
            messages.append("No ADU/garage-conversion indicators detected in permit descriptions.")
    else:
        messages.append("ADU marked No by user; showing permit history for awareness.")

    return {
        "status": "OK",
        "full_address": full_address,
        "parsed_full_address": parsed,
        "year_built": year_built,
        "estimated_age": estimated_age,
        "adu_claimed": adu_claimed,
        "count": len(permits),
        "fallback_used": result.get("fallback_used"),
        "message": " ".join(messages),
        "flags": flags,
        "highlights": highlights,
        "permits": permits,
        # This is what you pass into Gemini:
        "ready_for_ai": {
            "property": parsed,
            "year_built": year_built,
            "estimated_age": estimated_age,
            "adu_claimed": adu_claimed,
            "permit_summary": flags,
            "permit_highlights": highlights,
            "permit_records": permits,
        }
    }
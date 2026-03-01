from datetime import datetime
from .address_parser import parse_full_address
from .ladbs_client import fetch_permits
from .rules import classify_permit, summarize_categories, build_highlights

def lookup_by_full_address(
    full_address: str,
    year_built: int,
    adu_claimed: bool,
    limit: int = 25
):
    parsed = parse_full_address(full_address)

    current_year = datetime.now().year
    estimated_age = max(0, current_year - year_built)

    # LA check (demo scope)
    if parsed["city"].lower() not in ["los angeles", "la"]:
        return {
            "status": "UNSUPPORTED_CITY",
            "message": "Demo supports Los Angeles only (LADBS).",
            "parsed_full_address": parsed,
            "year_built": year_built,
            "estimated_age": estimated_age,
            "count": 0,
            "permits": [],
        }

    result = fetch_permits(address=parsed["street_line"], zip_code=parsed["zip_code"], limit=limit)
    permits = result["permits"]

    for p in permits:
        p["categories"] = classify_permit(p)

    flags = summarize_categories(permits)
    highlights = build_highlights(permits)

    messages = [
        f"Year built: {year_built} (estimated age: {estimated_age}).",
        f"Found {len(permits)} permit(s) in LADBS records (2006–present)."
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
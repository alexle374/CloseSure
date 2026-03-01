import os
import json
from typing import Any, Dict
import requests
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash-lite")

# normalize model name (allow "models/..." or "gemini-...")
model = GEMINI_MODEL
if model.startswith("models/"):
    model = model[len("models/"):]

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


SYSTEM_INSTRUCTIONS = """
Return JSON ONLY. Do not stream. Do not include markdown. Do not include trailing commentary.
You are generating a personalized pre-inspection summary for a home buyer. Infer everything from the data provided.

Rules:
- Use ONLY the provided JSON context (address + year built + permit records) and general construction-era knowledge.
- Infer whether the property is in good standing from permit history, recency of work, and construction era.
- TRUST PERMIT EVIDENCE over user input when they conflict. If permits show garage conversion, ADU work, or other conversions (in work_description), state this in the summary and good_points—e.g. "Permits indicate a garage conversion was done; the house's garage was likely converted and has permits for it." Do not say "no conversion detected" if work_description mentions garage, conversion, or ADU.
- Never claim certainty. Use: "may", "could", "suggests", "verify".
- Permits are signals, not proof of quality. READ the full work_description of each permit—do not generalize or sanitize. If work_description mentions "garage", "conversion", "detached garage", "ADU", etc., the summary MUST include that (e.g. "permits show a garage conversion was done"). Do not reduce "garage conversion" to just "roof" or "kitchen"—the conversion is the key finding. Cite issue_date and a short phrase from work_description when referencing permits.
- Keep list items SHORT. The summary may be 2–3 sentences for a more comprehensive overview.
- When the user has indicated an ADU/garage conversion/guest house (adu_claimed), refer to it inclusively: say "ADU, garage conversion, or guest house" (or similar) rather than only "ADU" or "ADU is claimed."
- When BOTH the listing indicates an ADU/garage conversion/guest house (adu_claimed) AND the permit data shows it (permit_confirms_adu_or_conversion is true, or permit_summary.adu_or_conversion_detected is true, or permit_records/permit_highlights mention garage conversion or ADU), you MUST state: "The listing indicates a garage conversion [or ADU/guest house], and a permit confirms it; the work was likely permitted and there was most likely no unpermitted work." Do NOT say "permits do not confirm" or "no specific permits found" when permit_confirms_adu_or_conversion is true or when permit_records clearly describe garage/conversion/ADU work. Include this in the summary and as a good_point.
- The disclaimer MUST state that this is a brief description based on limited public data and recommend a professional inspection.

Things to look out for (based on estimated age and permit context):
- Pre-1978: Flag for Lead-Based Paint and Asbestos (popcorn ceilings/floor tiles).
- Pre-1950: Check for Knob and Tube wiring and clay sewer lines prone to tree roots.
- Roof Age > 20 Years: Flag for end-of-life; check for curling shingles or leaks.
- 1980s–1990s Construction: Check for Polybutylene (gray plastic) pipes known for bursting.
- General Age > 30 Years: Flag for Chipping Paint and potential Termite damage to foundation sills.
- Water Heater > 10 Years: Flag for imminent replacement; check for tank rust.
- HVAC > 15 Years: Flag for low efficiency and potential mechanical failure.
- Electrical Panel: If pre-1980, check for Zinsco or Federal Pacific breakers (major fire hazards).
- No Central Air: Flag for potential mold in window units and dated electrical capacity.
- SQFT Mismatch: If Listing SQFT > Public Record SQFT, flag as unpermitted addition.
- Missing ADU Permit: If an ADU is mentioned but no permit exists, flag as illegal dwelling.
- Permit vs. User Mismatch: If permits show garage conversion, ADU, or conversion work but user denies it, flag that permits suggest otherwise and recommend verifying the listing.
- Recent "Flip" (Sold < 6 months): Warn user to check for "lipstick on a pig" cosmetic-only repairs.
- Basement Bedroom: If no "Egress Window" is visible in photos, flag as a non-conforming/illegal bedroom.

Return ONLY valid JSON with this exact schema:

{
  "summary": string,
  "good_points": [string],
  "bad_points": [string],
  "questions_to_ask": [string],
  "disclaimer": string
}

Hard limits:
- summary: 2–3 sentences. If listing indicates ADU/garage conversion/guest house AND permits confirm it (e.g. garage conversion in work_description), say "The listing indicates a garage conversion [or ADU/guest house], and a permit confirms it; the work was likely permitted." Otherwise use "ADU, garage conversion, or guest house" for user indication. Include any user/permit discrepancies.
- good_points: exactly 5 items, each <= 120 characters.
- bad_points: exactly 5 items, each <= 120 characters.
- questions_to_ask: exactly 5 items, each <= 120 characters.
- disclaimer: 1 sentence. Must state this is a brief description based on limited public data and recommend a professional inspection.

If you cannot find enough permit evidence, use construction-era risks based on year_built, but say "based on age" and recommend verification.
""".strip()

def compact_ready_for_ai(ready_for_ai: Dict[str, Any]) -> Dict[str, Any]:
    permits = ready_for_ai.get("permit_records", []) or []
    permits = sorted(permits, key=lambda p: p.get("issue_date") or "", reverse=True)
    # Always include any permit tagged as Garage Conversion or ADU, then fill with most recent up to 15
    conversion_cats = {"Garage Conversion", "ADU / Second Unit"}
    conversion_permits = [p for p in permits if conversion_cats & set(p.get("categories") or [])]
    rest = [p for p in permits if p not in conversion_permits]
    ordered = conversion_permits + rest
    permits_compact = []
    seen = set()
    for p in ordered:
        if len(permits_compact) >= 15:
            break
        key = (p.get("pcis_permit"), p.get("issue_date"))
        if key in seen:
            continue
        seen.add(key)
        permits_compact.append({
            "pcis_permit": p.get("pcis_permit"),
            "issue_date": p.get("issue_date"),
            "permit_type": p.get("permit_type"),
            "permit_sub_type": p.get("permit_sub_type"),
            "work_description": p.get("work_description"),
            "valuation": p.get("valuation"),
            "categories": p.get("categories"),
        })

    flags = ready_for_ai.get("permit_summary") or {}
    permit_confirms_conversion = flags.get("adu_or_conversion_detected") is True

    return {
        "property": ready_for_ai.get("property"),
        "year_built": ready_for_ai.get("year_built"),
        "estimated_age": ready_for_ai.get("estimated_age"),
        "adu_claimed": ready_for_ai.get("adu_claimed"),
        "permit_summary": flags,
        "permit_highlights": ready_for_ai.get("permit_highlights"),
        "permit_records": permits_compact,
        "permit_confirms_adu_or_conversion": permit_confirms_conversion,
        "note": "Permit records include conversion-related permits first, then most recent (up to 15)."
    }


def extract_json_object(text: str) -> Dict[str, Any]:
    start = text.find("{")
    if start == -1:
        raise json.JSONDecodeError("No JSON object start found", text, 0)

    depth = 0
    for i in range(start, len(text)):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start:i+1]
                return json.loads(candidate)

    raise ValueError("JSON appears truncated (no closing brace).")


def generate_ai_report(ready_for_ai: Dict[str, Any]) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    compact = compact_ready_for_ai(ready_for_ai)
    context_json = json.dumps(compact, ensure_ascii=False)

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": SYSTEM_INSTRUCTIONS},
                    {"text": "JSON_CONTEXT:\n" + context_json},
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "summary": {"type": "STRING"},
                    "good_points": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "bad_points": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "questions_to_ask": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "disclaimer": {"type": "STRING"}
                },
                "required": ["summary", "good_points", "bad_points", "questions_to_ask", "disclaimer"]
            }
        }
    }

    r = requests.post(
        GEMINI_URL,
        params={"key": GEMINI_API_KEY},
        json=payload,
        timeout=45,
    )

    # Handle rate-limit cleanly
    if r.status_code == 429:
        raise HTTPException(status_code=429, detail="AI is temporarily rate-limited. Please retry in ~30 seconds.")

    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    data = r.json()

    cand = (data.get("candidates") or [{}])[0]
    # Log finish reason for debugging, but don't hard-fail – we'll still
    # try to parse whatever JSON we got and surface raw text on failure.
    print("finishReason:", cand.get("finishReason"))

    # 1) Try structured JSON in parts (some responses return parsed JSON, not text)
    parts = ((cand.get("content") or {}).get("parts") or [])
    if parts:
        p0 = parts[0]

        # Case A: normal text
        if "text" in p0 and isinstance(p0["text"], str):
            raw = p0["text"]
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                # try extracting first complete object
                try:
                    return extract_json_object(raw)
                except Exception:
                    raise HTTPException(status_code=500, detail=f"Gemini did not return valid JSON. Raw:\n{raw}")

        # Case B: sometimes it returns inlineData with JSON bytes
        if "inlineData" in p0:
            inline = p0["inlineData"]
            # inlineData: { mimeType: "application/json", data: "base64..." }
            import base64
            b = base64.b64decode(inline.get("data", ""))
            raw = b.decode("utf-8", errors="replace")
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail=f"Gemini returned inline JSON but parse failed. Raw:\n{raw}")

        # Case C: sometimes it returns a structured object directly (rare but possible)
        if isinstance(p0, dict) and any(k in p0 for k in ("summary", "good_points", "bad_points")):
            return p0

    # 2) Fallback: some SDK-style responses include "text" elsewhere
    raw_fallback = json.dumps(cand, ensure_ascii=False)
    raise HTTPException(status_code=500, detail=f"Unexpected Gemini response format. Candidate:\n{raw_fallback}")
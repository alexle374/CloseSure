"""
Google Geocoding + Places API (classic): nearby home inspection companies.
"""
import os
import math
import requests
from pathlib import Path
from typing import Any, Dict, List
from dotenv import load_dotenv

# Project root (parent of services/)
_project_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_project_root / ".env")

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"

def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3959
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi, dlam = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def geocode_address(address: str) -> tuple[tuple[float, float] | None, str | None]:
    if not GOOGLE_MAPS_API_KEY:
        return None, "GOOGLE_MAPS_API_KEY is empty"
    try:
        r = requests.get(GEOCODE_URL, params={"address": address, "key": GOOGLE_MAPS_API_KEY}, timeout=10)
        if r.status_code != 200:
            return None, f"Geocoding HTTP {r.status_code}"
        data = r.json()
    except Exception as e:
        return None, f"Geocoding error: {e}"
    status = data.get("status")
    if status != "OK" or not data.get("results"):
        return None, f"Geocoding: {status} — {data.get('error_message', status or 'unknown')}"
    loc = data["results"][0]["geometry"]["location"]
    return (loc["lat"], loc["lng"]), None

def find_nearby_inspectors(address: str, max_results: int = 4) -> tuple[List[Dict[str, Any]], str | None]:
    if not GOOGLE_MAPS_API_KEY:
        return [], "GOOGLE_MAPS_API_KEY not set in .env"
    coords, err = geocode_address(address)
    if err:
        return [], err
    lat, lng = coords
    try:
        r = requests.get(
            PLACES_TEXT_SEARCH_URL,
            params={"query": f"home inspection near {address}", "key": GOOGLE_MAPS_API_KEY},
            timeout=15,
        )
        if r.status_code != 200:
            return [], f"Places API HTTP {r.status_code}: {(r.text or '')[:150]}"
        data = r.json()
    except Exception as e:
        return [], f"Places API error: {e}"
    if data.get("status") != "OK":
        return [], f"Places API: {data.get('status')} — {data.get('error_message', 'unknown')}"
    results = data.get("results") or []
    out: List[Dict[str, Any]] = []
    for p in results[:max_results]:
        loc = (p.get("geometry") or {}).get("location") or {}
        plat, plng = loc.get("lat"), loc.get("lng")
        dist = round(_haversine_miles(lat, lng, plat, plng), 1) if (plat is not None and plng is not None) else None
        out.append({
            "name": p.get("name") or "Unknown",
            "rating": p.get("rating"),
            "distance_miles": dist,
            "address": p.get("formatted_address") or "",
        })
    return out, None

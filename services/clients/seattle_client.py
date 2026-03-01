"""
Seattle Building Permits via data.seattle.gov (Socrata).
"""
import os
import requests
from typing import Any, Dict, List, Optional
from ..address_parser import parse_address

SEATTLE_URL = "https://data.seattle.gov/resource/76t5-zqzr.json"
SOCRATA_APP_TOKEN = os.getenv("SOCRATA_APP_TOKEN", "")
DEFAULT_LIMIT = 25

def _normalize(raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for p in raw:
        desc = (p.get("description") or "").strip()
        ptype = p.get("permittypedesc") or p.get("permittypemapped") or p.get("permit_type") or ""
        out.append({
            "pcis_permit": p.get("permitnum") or "",
            "issue_date": "",
            "permit_type": ptype,
            "permit_sub_type": p.get("permitclass") or "",
            "work_description": desc,
            "valuation": None,
        })
    return out

def fetch_permits(address: str, zip_code: Optional[int], limit: int = DEFAULT_LIMIT) -> Dict[str, Any]:
    try:
        address_start, street_name, street_suffix = parse_address(address)
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    params = {"$where": f"contains(upper(originaladdress1), '{str(address_start)}')", "$limit": str(limit * 2)}
    if zip_code is not None:
        params["$where"] += f" AND originalzip='{zip_code}'"
    headers = {"X-App-Token": SOCRATA_APP_TOKEN} if SOCRATA_APP_TOKEN else {}
    try:
        r = requests.get(SEATTLE_URL, params=params, headers=headers, timeout=20)
        if r.status_code != 200:
            return {"permits": [], "fallback_used": True, "parsed": {}}
        raw = r.json()
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    raw_list = raw if isinstance(raw, list) else []
    filtered = [p for p in raw_list if street_name.upper() in (p.get("originaladdress1") or "").upper()]
    permits = _normalize(filtered[:limit])
    return {"parsed": {"address_start": address_start, "street_name": street_name, "street_suffix": street_suffix}, "fallback_used": None, "permits": permits}

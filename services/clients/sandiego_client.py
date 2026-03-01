"""
San Diego County Building Permits via data.sandiegocounty.gov (Socrata).
"""
import os
import requests
from typing import Any, Dict, List, Optional
from ..address_parser import parse_address

SD_COUNTY_URL = "https://data.sandiegocounty.gov/resource/dyzh-7eat.json"
SOCRATA_APP_TOKEN = os.getenv("SOCRATA_APP_TOKEN", "")
DEFAULT_LIMIT = 25

def _normalize(raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for p in raw:
        issue = p.get("issued_date") or p.get("open_date") or ""
        if isinstance(issue, str) and "T" in issue:
            issue = issue.split("T")[0]
        desc = p.get("use") or p.get("primary_scope_code") or ""
        out.append({
            "pcis_permit": p.get("record_id") or p.get("id") or "",
            "issue_date": issue,
            "permit_type": p.get("record_type") or p.get("record_subtype") or "",
            "permit_sub_type": p.get("record_category") or "",
            "work_description": desc,
            "valuation": None,
        })
    return out

def fetch_permits(address: str, zip_code: Optional[int], limit: int = DEFAULT_LIMIT) -> Dict[str, Any]:
    try:
        address_start, street_name, street_suffix = parse_address(address)
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    params = {"$where": f"contains(upper(street_address), '{str(address_start)}')", "$order": "issued_date DESC", "$limit": str(limit)}
    if zip_code is not None:
        params["$where"] += f" AND zip_code='{zip_code}'"
    headers = {"X-App-Token": SOCRATA_APP_TOKEN} if SOCRATA_APP_TOKEN else {}
    try:
        r = requests.get(SD_COUNTY_URL, params=params, headers=headers, timeout=20)
        if r.status_code != 200:
            return {"permits": [], "fallback_used": True, "parsed": {}}
        raw = r.json()
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    raw_list = raw if isinstance(raw, list) else []
    filtered = [p for p in raw_list if street_name.upper() in (p.get("street_address") or "").upper()]
    permits = _normalize(filtered[:limit])
    return {"parsed": {"address_start": address_start, "street_name": street_name, "street_suffix": street_suffix}, "fallback_used": None, "permits": permits}

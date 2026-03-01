"""
Chicago Building Permits via data.cityofchicago.org (Socrata).
"""
import os
import requests
from typing import Any, Dict, List, Optional
from ..address_parser import parse_address

CHICAGO_URL = "https://data.cityofchicago.org/resource/bicx-55dc.json"
SOCRATA_APP_TOKEN = os.getenv("SOCRATA_APP_TOKEN", "")
DEFAULT_LIMIT = 25

def _normalize(raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for p in raw:
        issue = p.get("issue_date") or p.get("application_start_date") or ""
        if isinstance(issue, str) and "T" in issue:
            issue = issue.split("T")[0]
        out.append({
            "pcis_permit": p.get("permit_") or p.get("id") or "",
            "issue_date": issue,
            "permit_type": p.get("permit_type") or "",
            "permit_sub_type": p.get("review_type") or "",
            "work_description": p.get("work_description") or "",
            "valuation": p.get("total_fee"),
        })
    return out

def fetch_permits(address: str, zip_code: Optional[int], limit: int = DEFAULT_LIMIT) -> Dict[str, Any]:
    try:
        address_start, street_name, street_suffix = parse_address(address)
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    params = {"$where": f"street_number='{address_start}'", "$order": "issue_date DESC", "$limit": str(limit)}
    headers = {"X-App-Token": SOCRATA_APP_TOKEN} if SOCRATA_APP_TOKEN else {}
    try:
        r = requests.get(CHICAGO_URL, params=params, headers=headers, timeout=20)
        if r.status_code != 200:
            return {"permits": [], "fallback_used": True, "parsed": {}}
        raw = r.json()
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    permits = _normalize(raw if isinstance(raw, list) else [])
    return {"parsed": {"address_start": address_start, "street_name": street_name, "street_suffix": street_suffix}, "fallback_used": None, "permits": permits}

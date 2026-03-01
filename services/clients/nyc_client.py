"""NYC DOB Permit Issuance via data.cityofnewyork.us (Socrata)."""
import os
import requests
from typing import Any, Dict, List, Optional
from ..address_parser import parse_address, soql_escape

NYC_URL = "https://data.cityofnewyork.us/resource/ipu4-2q9a.json"
SOCRATA_APP_TOKEN = os.getenv("SOCRATA_APP_TOKEN", "")
DEFAULT_LIMIT = 25

def _normalize(raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for p in raw:
        issue = p.get("issuance_date") or p.get("filing_date") or ""
        if issue and len(issue) >= 10:
            issue = issue[:10].replace("/", "-")
        work = p.get("work_type") or p.get("permit_type") or ""
        out.append({
            "pcis_permit": p.get("job__") or p.get("permit_si_no") or "",
            "issue_date": issue,
            "permit_type": p.get("permit_type") or work,
            "permit_sub_type": p.get("permit_subtype") or "",
            "work_description": work,
            "valuation": None,
        })
    return out

def fetch_permits(address: str, zip_code: Optional[int], limit: int = DEFAULT_LIMIT) -> Dict[str, Any]:
    try:
        address_start, street_name, street_suffix = parse_address(address)
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    street_full = f"{street_name} {street_suffix}".strip().upper()
    name = soql_escape(street_full)
    where = f"house__='{address_start}' AND upper(street_name)='{name}'"
    if zip_code is not None:
        where += f" AND zip_code='{zip_code}'"
    params = {"$where": where, "$order": "issuance_date DESC", "$limit": str(limit)}
    headers = {"X-App-Token": SOCRATA_APP_TOKEN} if SOCRATA_APP_TOKEN else {}
    try:
        r = requests.get(NYC_URL, params=params, headers=headers, timeout=20)
        if r.status_code != 200:
            return {"permits": [], "fallback_used": True, "parsed": {}}
        raw = r.json()
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    permits = _normalize(raw if isinstance(raw, list) else [])
    return {"parsed": {"address_start": address_start, "street_name": street_name, "street_suffix": street_suffix}, "fallback_used": None, "permits": permits}

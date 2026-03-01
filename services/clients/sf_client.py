"""San Francisco Building Permits via data.sfgov.org (Socrata)."""
import os
import requests
from typing import Any, Dict, List, Optional
from ..address_parser import parse_address, soql_escape

SF_URL = "https://data.sfgov.org/resource/i98e-djp9.json"
SOCRATA_APP_TOKEN = os.getenv("SOCRATA_APP_TOKEN", "")
DEFAULT_LIMIT = 25

def _normalize(raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for p in raw:
        issue = p.get("issued_date") or p.get("filed_date") or p.get("permit_creation_date") or ""
        if isinstance(issue, str) and "T" in issue:
            issue = issue.split("T")[0]
        out.append({
            "pcis_permit": p.get("permit_number") or p.get("record_id") or "",
            "issue_date": issue,
            "permit_type": p.get("permit_type_definition") or p.get("permit_type") or "",
            "permit_sub_type": "",
            "work_description": p.get("description") or "",
            "valuation": p.get("revised_cost") or p.get("estimated_cost"),
        })
    return out

def fetch_permits(address: str, zip_code: Optional[int], limit: int = DEFAULT_LIMIT) -> Dict[str, Any]:
    try:
        address_start, street_name, street_suffix = parse_address(address)
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    name, suf = soql_escape(street_name), soql_escape(street_suffix)
    where = f"street_number='{address_start}' AND upper(street_name)='{name}' AND upper(street_suffix)='{suf}'"
    if zip_code is not None:
        where += f" AND zipcode='{zip_code}'"
    params = {"$where": where, "$order": "issued_date DESC", "$limit": str(limit)}
    headers = {"X-App-Token": SOCRATA_APP_TOKEN} if SOCRATA_APP_TOKEN else {}
    try:
        r = requests.get(SF_URL, params=params, headers=headers, timeout=20)
        if r.status_code != 200:
            return {"permits": [], "fallback_used": True, "parsed": {}}
        raw = r.json()
    except Exception:
        return {"permits": [], "fallback_used": True, "parsed": {}}
    permits = _normalize(raw if isinstance(raw, list) else [])
    return {"parsed": {"address_start": address_start, "street_name": street_name, "street_suffix": street_suffix}, "fallback_used": None, "permits": permits}

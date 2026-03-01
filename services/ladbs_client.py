import os
from typing import Any, Dict, Optional
import requests
from fastapi import HTTPException

from .address_parser import parse_address, soql_escape

LADBS_URL = "https://data.lacity.org/resource/hbkd-qubn.json"
SOCRATA_APP_TOKEN = os.getenv("SOCRATA_APP_TOKEN", "")
# $env:SOCRATA_APP_TOKEN="AjARtHuksyBRDxK9fb1vbMJmd"

DEFAULT_LIMIT = 25

def fetch_permits(address: str, zip_code: Optional[int], limit: int = DEFAULT_LIMIT) -> Dict[str, Any]:
    address_start, street_name, street_suffix = parse_address(address)

    name = soql_escape(street_name)
    suf = soql_escape(street_suffix)

    select = ",".join([
        "pcis_permit",
        "issue_date",
        "permit_type",
        "permit_sub_type",
        "work_description",
        "address_start",
        "street_name",
        "street_suffix",
        "zip_code",
        "valuation",
    ])

    where = (
        f"address_start={address_start} "
        f"AND upper(street_name)='{name}' "
        f"AND upper(street_suffix)='{suf}'"
    )

    if zip_code is not None:
        where += f" AND zip_code={zip_code}"

    params = {
        "$select": select,
        "$where": where,
        "$order": "issue_date DESC",
        "$limit": str(limit),
    }

    headers = {"X-App-Token": SOCRATA_APP_TOKEN} if SOCRATA_APP_TOKEN else {}

    r = requests.get(LADBS_URL, params=params, headers=headers, timeout=20)

    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    return {
        "parsed": {
            "address_start": address_start,
            "street_name": street_name,
            "street_suffix": street_suffix,
        },
        "fallback_used": None,
        "permits": r.json(),
    }
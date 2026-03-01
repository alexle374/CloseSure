import re

# Unit/apt designators to strip before permit lookup (LADBS uses building address)
_UNIT_PATTERN = re.compile(
    r"\s+(?:APT|APARTMENT|UNIT|STE|SUITE|#|NO\.?)\s*\d+[A-Z]?\s*$",
    re.IGNORECASE,
)

_SUFFIX_MAP = {
    "STREET": "ST", "ST": "ST",
    "AVENUE": "AVE", "AVE": "AVE",
    "BOULEVARD": "BLVD", "BLVD": "BLVD",
    "ROAD": "RD", "RD": "RD",
    "DRIVE": "DR", "DR": "DR",
    "LANE": "LN", "LN": "LN",
    "COURT": "CT", "CT": "CT",
    "PLACE": "PL", "PL": "PL",
    "CIRCLE": "CIR", "CIR": "CIR",
    "TERRACE": "TER", "TER": "TER",
    "WAY": "WAY",
}

def normalize_suffix(address: str) -> str:
    up = (address or "").strip().upper()
    return _SUFFIX_MAP.get(up, up)

def strip_unit_from_street(street: str) -> str:
    """Remove unit/apt (e.g. 'APT 1611') so LADBS lookup uses building address."""
    return _UNIT_PATTERN.sub("", (street or "").strip()).strip()


def parse_full_address(full_address: str):
    """
    Input:  '11350 Albata St, Los Angeles, CA 90049'
           '801 S Grand Ave APT 1611, Los Angeles, CA 90017'
    Output: {
      street_line, city, state, zip_code,
      address_start, street_name, street_suffix
    }
    """
    parts = [p.strip() for p in full_address.strip().split(",") if p.strip()]
    if len(parts) < 3:
        raise ValueError("Use format: '11350 Albata St, Los Angeles, CA 90049'")

    street_line = strip_unit_from_street(parts[0]).upper()
    city = parts[1].upper()

    # last part usually "CA 90049"
    state_zip = parts[2].upper()
    m = re.search(r"\b([A-Z]{2})\s+(\d{5})(?:-\d{4})?\b", state_zip)
    if not m:
        raise ValueError("Could not parse state + zip. Example: 'CA 90049'")
    state = m.group(1)
    zip_code = int(m.group(2))

    # reuse your existing street parser (street_line already has unit stripped)
    address_start, street_name, street_suffix = parse_address(street_line)

    return {
        "street_line": street_line,
        "street_line_raw": parts[0].strip(),
        "city": city,
        "state": state,
        "zip_code": zip_code,
        "address_start": address_start,
        "street_name": street_name,
        "street_suffix": street_suffix,
    }


def parse_address(address: str):
    """
    Accepts:
      '11350 Albata St, Los Angeles, CA 90049'
    Returns:
      (11350, 'ALBATA', 'ST')
    """
    cleaned = address.strip().upper().split(",")[0]
    cleaned = re.sub(r"\s+", " ", cleaned)
    parts = cleaned.split(" ")

    if len(parts) < 3:
        raise ValueError("Address must look like '11350 ALBATA ST'")

    try:
        address_start = int(parts[0])
    except:
        raise ValueError("Address must start with a number.")

    street_suffix = normalize_suffix(parts[-1])
    street_name = " ".join(parts[1:-1]).strip()

    if not street_name:
        raise ValueError("Could not parse street name.")

    return address_start, street_name, street_suffix

def soql_escape(s: str) -> str:
    return (s or "").replace("'", "''")
    

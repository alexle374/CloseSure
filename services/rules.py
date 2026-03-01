import re
from typing import Dict, Any, List
from collections import Counter

RULES = [
    ("ADU / Second Unit", [r"\bADU\b", r"\bJADU\b", r"ACCESSORY\s+DWELL", r"\bSECOND\s+UNIT\b", r"\bGUEST\s+HOUSE\b"]),
    ("Garage Conversion", [r"GARAGE\s+CONVERS", r"\bCONVERT(ED|)\b.*\bGARAGE\b", r"\bCHANGE\s+OF\s+USE\b", r"\bDWELLING\s+UNIT(S)?\b"]),
    ("Accessory Structure", [r"\bACCESSORY\s+STRUCT", r"\bOUTBUILDING\b", r"\bSHED\b"]),
    ("Recreation Room", [r"\bREC(\.|)?\s*ROOM\b", r"\bRECREATION\s+ROOM\b", r"\bGAME\s+ROOM\b"]),
    ("Pool House", [r"POOL\s+HOUSE", r"\bCABANA\b"]),
    ("Studio", [r"\bSTUDIO\b"]),
    ("Roof", [r"\bROOF\b", r"\bREROOF\b", r"\bRE-ROOF\b"]),
]

def classify_permit(row: Dict[str, Any]) -> List[str]:
    text = " ".join([
        str(row.get("permit_type") or ""),
        str(row.get("permit_sub_type") or ""),
        str(row.get("work_description") or ""),
    ]).upper()

    cats = []
    for name, patterns in RULES:
        if any(re.search(p, text) for p in patterns):
            cats.append(name)

    # If strong categories present, avoid weak labels if you add them later
    return cats

def adu_indicator_found(categories: List[str]) -> bool:
    return any(c in categories for c in ["ADU / Second Unit", "Garage Conversion"])

def summarize_categories(permits: List[Dict[str, Any]]) -> Dict[str, Any]:
    cats = []
    for p in permits:
        cats.extend(p.get("categories", []))
    counts = Counter(cats)
    return {
        "detected_categories": list(counts.keys()),
        "category_counts": dict(counts),
        "adu_or_conversion_detected": any(c in counts for c in ["ADU / Second Unit", "Garage Conversion"]),
    }

def build_highlights(permits: List[Dict[str, Any]]) -> List[str]:
    out = []
    for p in permits[:8]:
        year = (p.get("issue_date") or "")[:4] if isinstance(p.get("issue_date"), str) else ""
        ptype = p.get("permit_type") or "Permit"
        desc = (p.get("work_description") or "").strip()
        if desc:
            out.append(f"{ptype} ({year}): {desc[:80]}{'…' if len(desc) > 80 else ''}")
        else:
            out.append(f"{ptype} ({year})")
    return out
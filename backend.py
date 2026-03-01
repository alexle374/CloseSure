# backend.py
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env from same folder as backend.py so it works no matter where you run uvicorn from
load_dotenv(Path(__file__).resolve().parent / ".env")

from services.permit_lookup import lookup_by_full_address
from services.ai_service import generate_ai_report
from services.clients import find_nearby_inspectors

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class InspectionRequest(BaseModel):
    full_address: str
    year_built: int
    adu_claimed: bool = False

@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}

@app.post("/inspection-report")
def inspection_report(req: InspectionRequest, full: bool = False):
    permit_result = lookup_by_full_address(
        full_address=req.full_address,
        year_built=req.year_built,
        adu_claimed=req.adu_claimed,
    )

    if permit_result.get("status") == "UNSUPPORTED_CITY":
        return permit_result

    ai_report = generate_ai_report(permit_result["ready_for_ai"])

    try:
        inspectors, inspectors_error = find_nearby_inspectors(req.full_address, max_results=4)
    except Exception as e:
        inspectors = []
        inspectors_error = str(e)
    nearby_inspectors_note = inspectors_error if (not inspectors and inspectors_error) else None

    if full:
        return {
            "status": "OK",
            "input": req.model_dump(),
            "permit_result": permit_result,
            "ai_report": ai_report,
            "nearby_inspectors": inspectors,
            "nearby_inspectors_note": nearby_inspectors_note,
        }

    # Slim payload for frontend: summary + good/bad points + questions to ask + disclaimer + inspectors
    return {
        "status": "OK",
        "summary": ai_report.get("summary", ""),
        "good_points": ai_report.get("good_points", []),
        "bad_points": ai_report.get("bad_points", []),
        "questions_to_ask": ai_report.get("questions_to_ask", []),
        "disclaimer": ai_report.get("disclaimer", ""),
        "nearby_inspectors": inspectors,
        "nearby_inspectors_note": nearby_inspectors_note,
    }
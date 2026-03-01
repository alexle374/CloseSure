# backend.py
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from services.permit_lookup import lookup_by_full_address
from services.ai_service import generate_ai_report

app = FastAPI()

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

    if full:
        return {
            "status": "OK",
            "input": req.model_dump(),
            "permit_result": permit_result,
            "ai_report": ai_report,
        }

    # Slim payload for frontend: summary + good/bad points + questions to ask + disclaimer
    return {
        "status": "OK",
        "summary": ai_report.get("summary", ""),
        "good_points": ai_report.get("good_points", []),
        "bad_points": ai_report.get("bad_points", []),
        "questions_to_ask": ai_report.get("questions_to_ask", []),
        "disclaimer": ai_report.get("disclaimer", ""),
    }
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import LegalSuggestRequest, LegalSuggestResponse
from services.legal_intel_service import LegalIntelService, BNS_CORPUS, BNSS_CORPUS, BSA_CORPUS, LANDMARK_JUDGMENTS
from services.case_service import CaseService

router = APIRouter(prefix="/legal-intel", tags=["Legal Intelligence"])

@router.post("/suggest", response_model=LegalSuggestResponse)
def suggest_legal_provisions(
    req: LegalSuggestRequest,
    engine_mode: Optional[str] = Query("auto", description="Engine mode: auto, offline, online")
):
    if not req.narrative.strip():
        raise HTTPException(status_code=400, detail="Incident narrative cannot be empty")

    if engine_mode not in ("auto", "offline", "online"):
        engine_mode = "auto"

    result = LegalIntelService.analyze_incident(
        narrative=req.narrative,
        language=req.language or "en",
        engine_mode=engine_mode
    )
    return result

@router.get("/case/{case_id}/recommendations", response_model=LegalSuggestResponse)
def get_case_legal_recommendations(
    case_id: str,
    engine_mode: Optional[str] = Query("auto", description="Engine mode: auto, offline, online"),
    db: Session = Depends(get_db)
):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return LegalIntelService.analyze_incident(
        narrative=case.incident_summary,
        language=case.original_language or "en",
        engine_mode=engine_mode
    )

@router.get("/engine-status")
def get_engine_status():
    """Return current legal intelligence engine status and capabilities."""
    from services.llm_service import LLMService
    llm_status = LLMService.get_status()

    return {
        "offline": {
            "available": True,
            "scoring_methods": ["keyword", "tfidf", "tfidf+keyword"],
            "description": "Local NLP engine using TF-IDF cosine similarity + keyword matching against BNS/BNSS/BSA corpus"
        },
        "online": {
            "available": llm_status["available"],
            "provider": llm_status["provider"],
            "model": llm_status["model"],
            "api_key_configured": llm_status["api_key_configured"],
            "description": llm_status["description"]
        },
        "corpus_stats": {
            "bns_sections": len(BNS_CORPUS),
            "bnss_sections": len(BNSS_CORPUS),
            "bsa_provisions": len(BSA_CORPUS),
            "landmark_judgments": len(LANDMARK_JUDGMENTS)
        }
    }

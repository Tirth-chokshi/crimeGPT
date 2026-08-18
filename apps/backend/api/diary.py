from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import get_db
from models import Case, CaseDiaryEvent
from schemas import DiaryEventCreate, DiaryEventResponse
from services.case_service import CaseService
from services.diary_service import DiaryService
from services.diary_export_service import generate_case_diary_docx

router = APIRouter(prefix="/diary", tags=["Case Diary & BNSS Timeline"])

@router.get("/{case_id}")
def get_case_diary(case_id: str, db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    events = db.query(CaseDiaryEvent).filter(CaseDiaryEvent.case_id == case_id).order_by(CaseDiaryEvent.event_timestamp.asc()).all()
    bnss_compliance = DiaryService.calculate_bnss_deadlines(case)

    return {
        "case_id": case.id,
        "fir_number": case.fir_number,
        "status": case.status,
        "bnss_compliance_clocks": bnss_compliance,
        "events": [
            DiaryEventResponse.from_orm(e) for e in events
        ]
    }

@router.post("/{case_id}/event", response_model=DiaryEventResponse)
def add_diary_event(case_id: str, req: DiaryEventCreate, db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    event = DiaryService.add_diary_event(
        db=db,
        case_id=case_id,
        step_title=req.step_title,
        step_type=req.step_type,
        description=req.description,
        location=req.location or case.police_station,
        officer_name=req.officer_name,
        officer_badge=req.officer_badge,
        statutory_ref=req.statutory_deadline_reference
    )
    return DiaryEventResponse.from_orm(event)


# ── Phase 5: New endpoints ────────────────────────────────────────────────────

@router.get("/{case_id}/compliance-clocks")
def get_compliance_clocks(case_id: str, db: Session = Depends(get_db)):
    """
    Returns per-accused statutory compliance clocks:
    - 24-hour Magistrate Production deadline (BNSS Sec 187(1))
    - 15-day Police Remand cap (BNSS Sec 187(2))
    - 60/90-day Chargesheet deadline with default bail flag (BNSS Sec 187(3) & 479)
    """
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    clocks = DiaryService.calculate_per_accused_clocks(case)
    alerts = DiaryService.get_compliance_alerts(case)

    return {
        "case_id": case_id,
        "fir_number": case.fir_number,
        "case_status": case.status,
        "per_accused_clocks": clocks,
        "active_alerts": alerts,
        "alert_count": len(alerts),
        "critical_alert_count": sum(1 for a in alerts if a["level"] in ("CRITICAL", "OVERDUE"))
    }


@router.get("/{case_id}/alerts")
def get_compliance_alerts(case_id: str, db: Session = Depends(get_db)):
    """
    Returns only the active compliance alerts for the case (sorted by severity).
    Useful for the dashboard notification bell.
    """
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    alerts = DiaryService.get_compliance_alerts(case)
    return {
        "case_id": case_id,
        "fir_number": case.fir_number,
        "alerts": alerts,
        "total": len(alerts),
        "has_critical": any(a["level"] in ("CRITICAL", "OVERDUE") for a in alerts)
    }


@router.get("/{case_id}/export")
def export_case_diary(case_id: str, db: Session = Depends(get_db)):
    """
    Generates and streams the official BNSS Case Diary as a .docx file.
    Includes:
    - Case metadata cover page
    - Per-accused statutory compliance clock summary
    - Active compliance alerts
    - Chronological diary entries table with descriptions
    - IO / SHO signature block
    """
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    summary = DiaryService.get_diary_summary(case)
    clocks = DiaryService.calculate_per_accused_clocks(case)
    alerts = DiaryService.get_compliance_alerts(case)

    docx_bytes = generate_case_diary_docx(summary, clocks, alerts)

    safe_fir = case.fir_number.replace("/", "-").replace("\\", "-")
    filename = f"CaseDiary_{safe_fir}.docx"

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

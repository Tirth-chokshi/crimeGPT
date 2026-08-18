from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Case, Seizure
from services.case_service import CaseService
from services.cctns_sync_service import CCTNSSyncService

router = APIRouter(prefix="/sync", tags=["CCTNS & ICJS Interoperability Gateway"])


@router.post("/cctns/{case_id}")
def sync_case_to_cctns(
    case_id: str,
    officer_name: str = Query("Inspector R. K. Jadeja"),
    officer_badge: str = Query("GJ-AHM-4421"),
    db: Session = Depends(get_db)
):
    """
    Pushes case dossier to CCTNS National Crime Database & ICJS Judiciary Interoperability Bus.
    """
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    result = CCTNSSyncService.push_to_cctns(
        db=db,
        case=case,
        officer_name=officer_name,
        officer_badge=officer_badge
    )
    return result


@router.post("/esakshya/{seizure_id}")
def sync_evidence_to_esakshya(
    seizure_id: str,
    hash_value: str = Query(None),
    officer_name: str = Query("Inspector R. K. Jadeja"),
    officer_badge: str = Query("GJ-AHM-4421"),
    db: Session = Depends(get_db)
):
    """
    Registers an electronic evidence item in the National e-Sakshya Vault under BSA 2023 Section 63.
    """
    seizure = db.query(Seizure).filter(Seizure.id == seizure_id).first()
    if not seizure:
        raise HTTPException(status_code=404, detail="Seizure item not found")

    case = CaseService.get_case_by_id(db, seizure.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Parent case not found")

    result = CCTNSSyncService.push_to_esakshya(
        db=db,
        case=case,
        seizure=seizure,
        hash_value=hash_value,
        officer_name=officer_name,
        officer_badge=officer_badge
    )
    return result


@router.get("/{case_id}/status")
def get_case_sync_status(case_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the sync status and transaction audit trail for CCTNS and e-Sakshya.
    """
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return CCTNSSyncService.get_sync_status(db, case_id)

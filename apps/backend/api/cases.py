from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Case, Person, CaseSection, Seizure
from schemas import (
    CaseResponse, CaseCreate, CaseUpdate,
    PersonCreate, PersonResponse,
    SectionCreate, SectionResponse,
    SeizureCreate, SeizureResponse
)
from services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["Case Management"])

@router.get("/", response_model=List[CaseResponse])
def list_cases(
    status: Optional[str] = Query(None, description="Filter by case status"),
    search: Optional[str] = Query(None, description="Keyword search in FIR or summary"),
    db: Session = Depends(get_db)
):
    return CaseService.get_all_cases(db, status=status, search=search)

@router.post("/", response_model=CaseResponse)
def create_case(case_in: CaseCreate, db: Session = Depends(get_db)):
    # Check if FIR number already exists
    existing = db.query(Case).filter(Case.fir_number == case_in.fir_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"FIR Number '{case_in.fir_number}' already registered in the system.")
    return CaseService.create_case(db, case_in)

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.patch("/{case_id}/status", response_model=CaseResponse)
def update_status(
    case_id: str,
    status: str = Query(..., description="New status string"),
    notes: Optional[str] = Query("", description="Investigation notes"),
    officer_name: Optional[str] = Query("Inspector R. K. Jadeja"),
    db: Session = Depends(get_db)
):
    case = CaseService.update_case_status(db, case_id, status, officer_name=officer_name, notes=notes)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

# Person endpoints
@router.post("/{case_id}/persons", response_model=PersonResponse)
def add_person(case_id: str, person_in: PersonCreate, db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    person = Person(case_id=case_id, **person_in.dict())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person

# Section endpoints
@router.post("/{case_id}/sections", response_model=SectionResponse)
def add_section(case_id: str, section_in: SectionCreate, db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    sec = CaseSection(case_id=case_id, **section_in.dict())
    db.add(sec)
    db.commit()
    db.refresh(sec)
    return sec

# Seizure endpoints
@router.post("/{case_id}/seizures", response_model=SeizureResponse)
def add_seizure(case_id: str, seizure_in: SeizureCreate, db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    sz = Seizure(case_id=case_id, **seizure_in.dict())
    db.add(sz)
    db.commit()
    db.refresh(sz)
    return sz

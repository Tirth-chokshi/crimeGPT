from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models import Case, Person, CaseSection, Seizure, CaseDiaryEvent, GeneratedDocument, AuditLog
from schemas import CaseCreate, CaseUpdate, PersonCreate, SectionCreate, SeizureCreate

class CaseService:
    @staticmethod
    def get_all_cases(db: Session, status: Optional[str] = None, search: Optional[str] = None) -> List[Case]:
        query = db.query(Case)
        if status and status != "ALL":
            query = query.filter(Case.status == status)
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                (Case.fir_number.ilike(search_fmt)) |
                (Case.police_station.ilike(search_fmt)) |
                (Case.incident_summary.ilike(search_fmt)) |
                (Case.investigating_officer_name.ilike(search_fmt))
            )
        return query.order_by(Case.created_at.desc()).all()

    @staticmethod
    def get_case_by_id(db: Session, case_id: str) -> Optional[Case]:
        return db.query(Case).filter(Case.id == case_id).first()

    @staticmethod
    def create_case(db: Session, case_in: CaseCreate, officer_name: str = "Inspector R. K. Jadeja", role: str = "IO") -> Case:
        new_case = Case(
            fir_number=case_in.fir_number,
            police_station=case_in.police_station,
            district=case_in.district,
            state=case_in.state,
            fir_date=case_in.fir_date or datetime.utcnow(),
            incident_date_time=case_in.incident_date_time,
            incident_place=case_in.incident_place,
            incident_summary=case_in.incident_summary,
            incident_summary_original=case_in.incident_summary_original,
            original_language=case_in.original_language,
            status=case_in.status,
            investigating_officer_name=case_in.investigating_officer_name,
            investigating_officer_badge=case_in.investigating_officer_badge,
            investigating_officer_rank=case_in.investigating_officer_rank
        )
        db.add(new_case)
        db.flush()

        # Add Persons
        for p in case_in.persons or []:
            person_obj = Person(
                case_id=new_case.id,
                person_type=p.person_type,
                name=p.name,
                father_or_husband_name=p.father_or_husband_name,
                age=p.age,
                gender=p.gender,
                phone=p.phone,
                aadhaar_or_id=p.aadhaar_or_id,
                address=p.address,
                occupation=p.occupation,
                role_description=p.role_description,
                statement=p.statement,
                arrest_date_time=p.arrest_date_time,
                custody_status=p.custody_status,
                physical_features=p.physical_features,
                medical_examination_status=p.medical_examination_status
            )
            db.add(person_obj)

        # Add Sections
        for s in case_in.sections or []:
            sec_obj = CaseSection(
                case_id=new_case.id,
                act=s.act,
                section_number=s.section_number,
                section_title=s.section_title,
                ipc_crpc_equivalent=s.ipc_crpc_equivalent,
                is_ai_recommended=s.is_ai_recommended,
                ai_confidence=s.ai_confidence,
                ai_rationale=s.ai_rationale,
                status=s.status
            )
            db.add(sec_obj)

        # Add Seizures
        for sz in case_in.seizures or []:
            sz_obj = Seizure(
                case_id=new_case.id,
                item_name=sz.item_name,
                category=sz.category,
                description=sz.description,
                quantity_or_value=sz.quantity_or_value,
                seized_from_person_name=sz.seized_from_person_name,
                seizure_place=sz.seizure_place,
                seizure_date_time=sz.seizure_date_time,
                panchas_present=sz.panchas_present,
                hash_value_or_serial=sz.hash_value_or_serial,
                videography_ref_id=sz.videography_ref_id,
                storage_location=sz.storage_location
            )
            db.add(sz_obj)

        # Automatically add initial Case Diary Entry: FIR Registered under Sec 173 BNSS
        diary_init = CaseDiaryEvent(
            case_id=new_case.id,
            step_title="Registration of FIR & Handover of Investigation",
            step_type="FIR",
            location=new_case.police_station,
            description=(
                f"FIR {new_case.fir_number} formally registered under Section 173 BNSS based on written/oral complaint. "
                f"Copy of FIR supplied free of cost to the complainant. Investigation assigned to {new_case.investigating_officer_name}."
            ),
            officer_name=new_case.investigating_officer_name,
            officer_badge=new_case.investigating_officer_badge,
            statutory_deadline_reference="Section 173 BNSS: FIR Registration Completed",
            event_timestamp=datetime.utcnow()
        )
        db.add(diary_init)

        # Audit Log
        audit = AuditLog(
            case_id=new_case.id,
            action="CASE_CREATED",
            officer_name=officer_name,
            role=role,
            details=f"Created FIR {new_case.fir_number} with {len(case_in.persons or [])} persons, {len(case_in.sections or [])} sections."
        )
        db.add(audit)

        db.commit()
        db.refresh(new_case)
        return new_case

    @staticmethod
    def update_case_status(db: Session, case_id: str, new_status: str, officer_name: str, notes: str = "") -> Optional[Case]:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            return None
        
        old_status = case.status
        case.status = new_status
        case.updated_at = datetime.utcnow()

        # Add diary event for status transition
        status_titles = {
            "INVESTIGATION": "Investigation Formalized & Crime Scene Inspection",
            "ARREST_EFFECTED": "Arrest of Accused Effected under Sec 35 BNSS",
            "REMAND_GRANTED": "Production before Magistrate & Police Custody Remand Granted",
            "JUDICIAL_CUSTODY": "Forwarded to Judicial Custody / Central Jail",
            "CHARGESHEET_FILED": "Final Chargesheet Filed before Court under Sec 193 BNSS"
        }
        step_title = status_titles.get(new_status, f"Status Transition: {new_status}")

        diary = CaseDiaryEvent(
            case_id=case.id,
            step_title=step_title,
            step_type="STATUS_UPDATE",
            location=case.police_station,
            description=f"Case status changed from {old_status} to {new_status}. Notes: {notes or 'Investigation proceeding as per statutory rules.'}",
            officer_name=officer_name,
            statutory_deadline_reference=f"BNSS State Machine: {new_status}",
            event_timestamp=datetime.utcnow()
        )
        db.add(diary)

        audit = AuditLog(
            case_id=case.id,
            action="STATUS_UPDATED",
            officer_name=officer_name,
            role="IO",
            details=f"Transitioned status from {old_status} to {new_status}"
        )
        db.add(audit)
        db.commit()
        db.refresh(case)
        return case

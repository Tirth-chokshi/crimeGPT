import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    fir_number = Column(String(100), unique=True, index=True, nullable=False)
    police_station = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Gujarat")
    fir_date = Column(DateTime, default=datetime.utcnow)
    incident_date_time = Column(String(100), nullable=True)
    incident_place = Column(String(255), nullable=True)
    incident_summary = Column(Text, nullable=False)
    incident_summary_original = Column(Text, nullable=True)
    original_language = Column(String(10), default="en")
    status = Column(String(50), default="FIR_REGISTERED")  # FIR_REGISTERED, INVESTIGATION, ARREST_EFFECTED, REMAND_GRANTED, JUDICIAL_CUSTODY, CHARGESHEET_FILED
    investigating_officer_name = Column(String(150), default="Inspector R. K. Jadeja")
    investigating_officer_badge = Column(String(50), default="GJ-AHM-4421")
    investigating_officer_rank = Column(String(50), default="Police Inspector (IO)")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    persons = relationship("Person", back_populates="case", cascade="all, delete-orphan")
    sections = relationship("CaseSection", back_populates="case", cascade="all, delete-orphan")
    seizures = relationship("Seizure", back_populates="case", cascade="all, delete-orphan")
    diary_events = relationship("CaseDiaryEvent", back_populates="case", cascade="all, delete-orphan", order_by="CaseDiaryEvent.event_timestamp")
    documents = relationship("GeneratedDocument", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")

class Person(Base):
    __tablename__ = "persons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    person_type = Column(String(30), nullable=False)  # VICTIM, ACCUSED, WITNESS, INFORMANT
    name = Column(String(150), nullable=False)
    father_or_husband_name = Column(String(150), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), default="Male")
    phone = Column(String(30), nullable=True)
    aadhaar_or_id = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    occupation = Column(String(100), nullable=True)
    role_description = Column(Text, nullable=True)
    statement = Column(Text, nullable=True)
    arrest_date_time = Column(String(100), nullable=True)
    custody_status = Column(String(50), default="FREE")  # FREE, NOTICE_SERVED, POLICE_CUSTODY, JUDICIAL_CUSTODY, ON_BAIL
    physical_features = Column(JSON, nullable=True)  # {height, complexion, build, identification_marks, scars}
    medical_examination_status = Column(String(30), default="PENDING")  # PENDING, COMPLETED, EXEMPTED
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="persons")

class CaseSection(Base):
    __tablename__ = "case_sections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    act = Column(String(20), default="BNS")  # BNS, BNSS, BSA, IT_ACT
    section_number = Column(String(50), nullable=False)
    section_title = Column(String(255), nullable=False)
    ipc_crpc_equivalent = Column(String(100), nullable=True)
    is_ai_recommended = Column(Boolean, default=False)
    ai_confidence = Column(Float, default=1.0)
    ai_rationale = Column(Text, nullable=True)
    status = Column(String(30), default="ACCEPTED")  # ACCEPTED, PROPOSED, REMOVED
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="sections")

class Seizure(Base):
    __tablename__ = "seizures"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    item_name = Column(String(200), nullable=False)
    category = Column(String(50), default="OTHER")  # WEAPON, CASH, ELECTRONIC_DEVICE, VEHICLE, DOCUMENT, NARCOTICS, OTHER
    description = Column(Text, nullable=True)
    quantity_or_value = Column(String(100), nullable=True)
    seized_from_person_name = Column(String(150), nullable=True)
    seizure_place = Column(String(255), nullable=True)
    seizure_date_time = Column(String(100), nullable=True)
    panchas_present = Column(JSON, nullable=True)  # List of {name, age, address}
    hash_value_or_serial = Column(String(100), nullable=True)
    videography_ref_id = Column(String(100), nullable=True)
    storage_location = Column(String(150), default="Malkhana Locker Rack #B4")
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="seizures")

class CaseDiaryEvent(Base):
    __tablename__ = "case_diary_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    event_timestamp = Column(DateTime, default=datetime.utcnow)
    step_title = Column(String(255), nullable=False)
    step_type = Column(String(50), nullable=False)  # FIR, CRIME_SCENE_VISIT, WITNESS_EXAMINATION, SEIZURE, ARREST, MEDICAL_EXAM, REMAND_PRODUCED, CUSTODY_EXTENDED, FORENSIC_DISPATCH, CHARGESHEET
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    officer_name = Column(String(150), nullable=False)
    officer_badge = Column(String(50), nullable=True)
    statutory_deadline_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="diary_events")

class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    doc_type = Column(String(50), nullable=False)  # PURVANI_CHARGESHEET, MEDICAL_LETTER, REMAND_REQUEST, SEIZURE_RECEIPT, COURT_CUSTODY_LETTER, ACCUSED_PANCHANAMA, FACE_IDENTIFICATION_FORM
    title = Column(String(255), nullable=False)
    language = Column(String(10), default="en")
    status = Column(String(50), default="FINAL")  # DRAFT, FINAL, SIGNED, SUBMITTED_TO_COURT
    structured_content = Column(JSON, nullable=True)
    file_name = Column(String(255), nullable=True)
    generated_by_officer = Column(String(150), default="IO Inspector Jadeja")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    case = relationship("Case", back_populates="documents")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=True)
    action = Column(String(100), nullable=False)
    officer_name = Column(String(150), nullable=False)
    role = Column(String(50), default="IO")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="audit_logs")

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

# --- Person Schemas ---
class PersonBase(BaseModel):
    person_type: str = "VICTIM"  # VICTIM, ACCUSED, WITNESS, INFORMANT
    name: str
    father_or_husband_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = "Male"
    phone: Optional[str] = None
    aadhaar_or_id: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    role_description: Optional[str] = None
    statement: Optional[str] = None
    arrest_date_time: Optional[str] = None
    custody_status: Optional[str] = "FREE"
    physical_features: Optional[Dict[str, Any]] = None
    medical_examination_status: Optional[str] = "PENDING"

class PersonCreate(PersonBase):
    pass

class PersonResponse(PersonBase):
    id: str
    case_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Section Schemas ---
class SectionBase(BaseModel):
    act: str = "BNS"
    section_number: str
    section_title: str
    ipc_crpc_equivalent: Optional[str] = None
    is_ai_recommended: bool = False
    ai_confidence: float = 1.0
    ai_rationale: Optional[str] = None
    status: str = "ACCEPTED"

class SectionCreate(SectionBase):
    pass

class SectionResponse(SectionBase):
    id: str
    case_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Seizure Schemas ---
class SeizureBase(BaseModel):
    item_name: str
    category: str = "OTHER"
    description: Optional[str] = None
    quantity_or_value: Optional[str] = None
    seized_from_person_name: Optional[str] = None
    seizure_place: Optional[str] = None
    seizure_date_time: Optional[str] = None
    panchas_present: Optional[List[Dict[str, Any]]] = None
    hash_value_or_serial: Optional[str] = None
    videography_ref_id: Optional[str] = None
    storage_location: Optional[str] = "Malkhana Locker Rack #B4"

class SeizureCreate(SeizureBase):
    pass

class SeizureResponse(SeizureBase):
    id: str
    case_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Diary Event Schemas ---
class DiaryEventBase(BaseModel):
    event_timestamp: Optional[datetime] = None
    step_title: str
    step_type: str = "INVESTIGATION"
    location: Optional[str] = None
    description: str
    officer_name: str = "Inspector R. K. Jadeja"
    officer_badge: Optional[str] = "GJ-AHM-4421"
    statutory_deadline_reference: Optional[str] = None

class DiaryEventCreate(DiaryEventBase):
    pass

class DiaryEventResponse(DiaryEventBase):
    id: str
    case_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentGenerateRequest(BaseModel):
    doc_type: str  # PURVANI_CHARGESHEET, MEDICAL_LETTER, REMAND_REQUEST, SEIZURE_RECEIPT, COURT_CUSTODY_LETTER, ACCUSED_PANCHANAMA, FACE_IDENTIFICATION_FORM
    language: str = "en"
    override_fields: Optional[Dict[str, Any]] = None

class DocumentResponse(BaseModel):
    id: str
    case_id: str
    doc_type: str
    title: str
    language: str
    status: str
    structured_content: Dict[str, Any]
    file_name: Optional[str] = None
    download_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Case Schemas ---
class CaseBase(BaseModel):
    fir_number: str
    police_station: str
    district: str
    state: str = "Gujarat"
    fir_date: Optional[datetime] = None
    incident_date_time: Optional[str] = None
    incident_place: Optional[str] = None
    incident_summary: str
    incident_summary_original: Optional[str] = None
    original_language: str = "en"
    status: str = "FIR_REGISTERED"
    investigating_officer_name: str = "Inspector R. K. Jadeja"
    investigating_officer_badge: str = "GJ-AHM-4421"
    investigating_officer_rank: str = "Police Inspector (IO)"

class CaseCreate(CaseBase):
    persons: Optional[List[PersonCreate]] = []
    sections: Optional[List[SectionCreate]] = []
    seizures: Optional[List[SeizureCreate]] = []

class CaseUpdate(BaseModel):
    fir_number: Optional[str] = None
    police_station: Optional[str] = None
    district: Optional[str] = None
    incident_date_time: Optional[str] = None
    incident_place: Optional[str] = None
    incident_summary: Optional[str] = None
    status: Optional[str] = None
    investigating_officer_name: Optional[str] = None
    investigating_officer_badge: Optional[str] = None
    investigating_officer_rank: Optional[str] = None

class CaseResponse(CaseBase):
    id: str
    created_at: datetime
    updated_at: datetime
    persons: List[PersonResponse] = []
    sections: List[SectionResponse] = []
    seizures: List[SeizureResponse] = []
    diary_events: List[DiaryEventResponse] = []
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True

# --- Legal Intelligence Suggestion Request / Response ---
class LegalSuggestRequest(BaseModel):
    narrative: str
    language: Optional[str] = "en"
    case_context: Optional[Dict[str, Any]] = None

class CandidateSection(BaseModel):
    act: str = "BNS"
    section_number: str
    section_title: str
    ipc_equivalent: Optional[str] = None
    confidence: float
    rationale: str
    bailable: str
    cognizable: str
    punishment: str
    scoring_method: str = "keyword"  # keyword, tfidf, tfidf+keyword, llm, default
    statutory_citations: List[str] = []

class CandidateJudgment(BaseModel):
    case_name: str
    citation: str
    bench: str
    subject: str
    principle: str
    applicable_sections: List[str] = []

class LegalSuggestResponse(BaseModel):
    detected_language: str
    engine_mode: str = "offline_tfidf"  # offline_keyword, offline_tfidf, online_llm
    summary_analysis: str
    bns_sections: List[CandidateSection]
    bnss_procedural_mandates: List[Dict[str, Any]]
    bsa_evidence_rules: List[Dict[str, Any]]
    landmark_judgments: List[CandidateJudgment]
    investigation_action_checklist: List[str]
    llm_insights: Optional[Dict[str, Any]] = None

# --- Auth Schemas ---
class UserLogin(BaseModel):
    username: str
    password: str
    role: str = "IO"  # IO, SHO, LEGAL_ADVISOR

class AuthResponse(BaseModel):
    token: str
    officer_name: str
    badge_number: str
    role: str
    police_station: str

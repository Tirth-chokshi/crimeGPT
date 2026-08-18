import os
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Case, GeneratedDocument, CaseDiaryEvent, AuditLog
from schemas import DocumentGenerateRequest, DocumentResponse
from services.case_service import CaseService
from services.document_service import DocumentService, DOCUMENT_METADATA, DOCS_OUTPUT_DIR

router = APIRouter(prefix="/documents", tags=["Document Generation Engine"])

@router.get("/types")
def get_supported_document_types():
    return [
        {
            "id": doc_type,
            "title": meta["title"],
            "sub_title": meta["sub_title"],
            "code": meta["code"],
            "required_for_trial": doc_type in ["PURVANI_CHARGESHEET", "REMAND_REQUEST", "SEIZURE_RECEIPT"]
        }
        for doc_type, meta in DOCUMENT_METADATA.items()
    ]

@router.post("/generate/{case_id}", response_model=DocumentResponse)
def generate_document(
    case_id: str,
    req: DocumentGenerateRequest,
    officer_name: str = Query("Inspector R. K. Jadeja"),
    db: Session = Depends(get_db)
):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if req.doc_type not in DOCUMENT_METADATA:
        raise HTTPException(status_code=400, detail=f"Unsupported document type: {req.doc_type}")

    # Build payload
    payload = DocumentService.prepare_document_payload(case, req.doc_type, language=req.language)
    if req.override_fields:
        payload.update(req.override_fields)

    # Generate DOCX
    docx_filename = DocumentService.generate_docx(payload)

    # Save to GeneratedDocument table
    meta = DOCUMENT_METADATA[req.doc_type]
    doc_record = GeneratedDocument(
        case_id=case_id,
        doc_type=req.doc_type,
        title=meta["title"],
        language=req.language,
        status="FINAL",
        structured_content=payload,
        file_name=docx_filename,
        generated_by_officer=officer_name
    )
    db.add(doc_record)

    # Add Case Diary Event for document creation
    diary_event = CaseDiaryEvent(
        case_id=case_id,
        step_title=f"Legal Document Generated: {meta['title']}",
        step_type="DOCUMENT_GENERATED",
        location=case.police_station,
        description=(
            f"Generated official {meta['title']} ({meta['code']}) for FIR {case.fir_number}. "
            f"Document stored in case dossier with verified SHA-256 integrity."
        ),
        officer_name=officer_name,
        statutory_deadline_reference=meta["sub_title"]
    )
    db.add(diary_event)

    # Audit Log
    audit = AuditLog(
        case_id=case_id,
        action="DOCUMENT_GENERATED",
        officer_name=officer_name,
        role="IO",
        details=f"Generated {req.doc_type} ({docx_filename})"
    )
    db.add(audit)

    db.commit()
    db.refresh(doc_record)

    return DocumentResponse(
        id=doc_record.id,
        case_id=doc_record.case_id,
        doc_type=doc_record.doc_type,
        title=doc_record.title,
        language=doc_record.language,
        status=doc_record.status,
        structured_content=payload,
        file_name=doc_record.file_name,
        download_url=f"/api/documents/download/{docx_filename}",
        created_at=doc_record.created_at
    )

@router.get("/download/{filename}")
def download_docx(filename: str):
    file_path = os.path.join(DOCS_OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested file does not exist on server.")
    
    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename
    )

@router.get("/case/{case_id}", response_model=List[DocumentResponse])
def get_case_documents(case_id: str, db: Session = Depends(get_db)):
    docs = db.query(GeneratedDocument).filter(GeneratedDocument.case_id == case_id).order_by(GeneratedDocument.created_at.desc()).all()
    resp = []
    for d in docs:
        resp.append(DocumentResponse(
            id=d.id,
            case_id=d.case_id,
            doc_type=d.doc_type,
            title=d.title,
            language=d.language,
            status=d.status,
            structured_content=d.structured_content or {},
            file_name=d.file_name,
            download_url=f"/api/documents/download/{d.file_name}" if d.file_name else None,
            created_at=d.created_at
        ))
    return resp

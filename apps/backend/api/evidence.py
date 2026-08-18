from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from models import Case, Seizure, AuditLog
from services.case_service import CaseService
from services.evidence_vault_service import EvidenceVaultService

router = APIRouter(prefix="/evidence", tags=["BSA Electronic Evidence Vault"])


@router.post("/{seizure_id}/compute-hash")
async def compute_seizure_hash(
    seizure_id: str,
    file: UploadFile = File(...),
    officer_name: str = Form("Inspector R. K. Jadeja"),
    officer_badge: str = Form("GJ-AHM-4421"),
    db: Session = Depends(get_db)
):
    """
    Upload an electronic evidence file, compute its cryptographic SHA-256 and MD5 hashes,
    and attach the SHA-256 digest to the Seizure Mudamal record.
    """
    seizure = db.query(Seizure).filter(Seizure.id == seizure_id).first()
    if not seizure:
        raise HTTPException(status_code=404, detail="Seizure item not found")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded evidence file is empty")

    hashes = EvidenceVaultService.compute_hashes(content)
    seizure.hash_value_or_serial = hashes["sha256"]

    audit = AuditLog(
        case_id=seizure.case_id,
        action="EVIDENCE_HASH_COMPUTED",
        officer_name=officer_name,
        role="IO",
        details=f"Computed SHA-256 hash for evidence '{seizure.item_name}' (Filename: {file.filename}, Size: {hashes['size_formatted']}): {hashes['sha256']}"
    )
    db.add(audit)
    db.commit()
    db.refresh(seizure)

    return {
        "seizure_id": seizure.id,
        "item_name": seizure.item_name,
        "filename": file.filename,
        "sha256": hashes["sha256"],
        "md5": hashes["md5"],
        "size_bytes": hashes["size_bytes"],
        "size_formatted": hashes["size_formatted"],
        "computed_at_ist": hashes["computed_at_ist"],
        "status": "HASH_ATTACHED"
    }


@router.post("/{seizure_id}/set-hash")
def set_seizure_hash_manual(
    seizure_id: str,
    sha256_hash: str = Form(...),
    officer_name: str = Form("Inspector R. K. Jadeja"),
    db: Session = Depends(get_db)
):
    """
    Manually attach an existing SHA-256 hash from an external forensic workstation (EnCase / FTK / Cellebrite).
    """
    seizure = db.query(Seizure).filter(Seizure.id == seizure_id).first()
    if not seizure:
        raise HTTPException(status_code=404, detail="Seizure item not found")

    cleaned_hash = sha256_hash.strip().upper()
    seizure.hash_value_or_serial = cleaned_hash

    audit = AuditLog(
        case_id=seizure.case_id,
        action="EVIDENCE_HASH_MANUAL_SET",
        officer_name=officer_name,
        role="IO",
        details=f"Attached manual forensic SHA-256 hash to '{seizure.item_name}': {cleaned_hash}"
    )
    db.add(audit)
    db.commit()
    db.refresh(seizure)

    return {
        "seizure_id": seizure.id,
        "item_name": seizure.item_name,
        "sha256": cleaned_hash,
        "status": "HASH_ATTACHED"
    }


@router.get("/{seizure_id}/certificate")
def download_bsa_sec63_certificate(
    seizure_id: str,
    officer_name: str = "Inspector R. K. Jadeja",
    officer_badge: str = "GJ-AHM-4421",
    db: Session = Depends(get_db)
):
    """
    Generates and downloads the official Section 63 BSA Digital Evidence Certificate (.docx).
    """
    seizure = db.query(Seizure).filter(Seizure.id == seizure_id).first()
    if not seizure:
        raise HTTPException(status_code=404, detail="Seizure item not found")

    case = CaseService.get_case_by_id(db, seizure.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Parent case not found")

    hash_val = seizure.hash_value_or_serial or "PENDING"
    docx_bytes = EvidenceVaultService.generate_bsa_section63_certificate(
        case=case,
        seizure=seizure,
        hash_value=hash_val,
        officer_name=officer_name,
        officer_badge=officer_badge
    )

    safe_item = "".join(c for c in seizure.item_name if c.isalnum() or c in ("-", "_")).strip() or "Item"
    filename = f"BSA_Sec63_Certificate_{safe_item}.docx"

    # Audit log
    audit = AuditLog(
        case_id=case.id,
        action="BSA_SEC63_CERTIFICATE_GENERATED",
        officer_name=officer_name,
        role="IO",
        details=f"Generated statutory Section 63 BSA Digital Evidence Certificate for '{seizure.item_name}' (SHA-256: {hash_val[:16]}...)"
    )
    db.add(audit)
    db.commit()

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/{seizure_id}/qr")
def get_seizure_qr_code(seizure_id: str, db: Session = Depends(get_db)):
    """
    Generates and returns the Malkhana QR verification code as a PNG image.
    """
    seizure = db.query(Seizure).filter(Seizure.id == seizure_id).first()
    if not seizure:
        raise HTTPException(status_code=404, detail="Seizure item not found")

    case = CaseService.get_case_by_id(db, seizure.case_id)
    fir_num = case.fir_number if case else "FIR-UNKNOWN"

    qr_bytes = EvidenceVaultService.generate_qr_code(
        seizure_id=seizure.id,
        case_fir=fir_num,
        item_name=seizure.item_name,
        hash_value=seizure.hash_value_or_serial or "PENDING",
        storage_location=seizure.storage_location or "Malkhana Locker Rack #B4"
    )

    return Response(content=qr_bytes, media_type="image/png")


@router.post("/{seizure_id}/verify-hash")
async def verify_seizure_hash(
    seizure_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a digital evidence file to verify its cryptographic integrity against the recorded baseline SHA-256 hash.
    Detects tampering, corruption, or unauthorized alteration.
    """
    seizure = db.query(Seizure).filter(Seizure.id == seizure_id).first()
    if not seizure:
        raise HTTPException(status_code=404, detail="Seizure item not found")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    result = EvidenceVaultService.verify_evidence_integrity(seizure, content)

    # Log audit
    audit = AuditLog(
        case_id=seizure.case_id,
        action="EVIDENCE_TAMPER_CHECK",
        officer_name="Forensic Officer / IO",
        role="IO",
        details=f"Tamper Verification for '{seizure.item_name}': Status = {result['status']}, Match = {result['match']}"
    )
    db.add(audit)
    db.commit()

    return result

"""
CrimeGPT WhatsApp LERS Arrest Notification & BharatPol Mock API
================================================================
Task 6: WhatsApp Law Enforcement Request System (LERS) message generator
Task 7: BharatPol national criminal record mock integration
Task 3: HTML document preview endpoint (PDF via browser)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
from services.case_service import CaseService
from services.html_preview_service import generate_html_preview
from services.document_service import DocumentService, DOCUMENT_METADATA, DOCS_OUTPUT_DIR
from models import Case, GeneratedDocument, AuditLog
import os
import random
import string
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/io", tags=["LERS, BharatPol & Document Preview"])

IST = timezone(timedelta(hours=5, minutes=30))


def _ist_now() -> str:
    return datetime.now(IST).strftime("%d/%m/%Y %H:%M:%S IST")


def _rand_code(prefix: str, n: int = 6) -> str:
    return f"{prefix}-{''.join(random.choices(string.digits + string.ascii_uppercase, k=n))}"


# ─────────────────────────────────────────────────────────────────────────────
# Task 6 — WhatsApp LERS Arrest Notification
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/whatsapp-lers/{case_id}")
def generate_lers_message(
    case_id: str,
    language: str = Query("en", description="Message language: en / hi / gu"),
    db: Session = Depends(get_db)
):
    """
    Generate a LERS-compliant WhatsApp arrest notification message.
    Covers: Accused identity, FIR details, offences, rights advisory (D.K. Basu),
    Arnesh Kumar compliance note, and IO contact.
    """
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    accused_list = [p for p in case.persons if p.person_type == "ACCUSED"]
    sections = [s for s in case.sections if s.status == "ACCEPTED"]
    accused = accused_list[0] if accused_list else None

    sections_str = ", ".join(f"{s.act} Sec {s.section_number}" for s in sections) or "BNS Sections Under Investigation"
    accused_name = accused.name if accused else "Accused (Name TBC)"
    accused_age = accused.age if accused else "Adult"
    arrest_dt = accused.arrest_date_time if accused else "Under Investigation"
    custody = accused.custody_status if accused else "FREE"

    io = case.investigating_officer_name
    io_badge = case.investigating_officer_badge
    ps = case.police_station

    ref_no = _rand_code("LERS-GJ")

    if language == "hi":
        msg = f"""🚨 *गिरफ्तारी सूचना — BNSS धारा 35*
━━━━━━━━━━━━━━━━━━━━━
📋 FIR क्र.: *{case.fir_number}*
🏛️ थाना: {ps}
👤 आरोपी: *{accused_name}* (आयु: {accused_age})
📅 गिरफ्तारी: {arrest_dt}
⚖️ धाराएं: {sections_str}
🔒 हिरासत: {custody}
━━━━━━━━━━━━━━━━━━━━━
✅ *D.K. Basu दिशानिर्देश लागू*
• गिरफ्तारी मेमो तैयार किया गया
• परिवार को सूचित किया गया
• चिकित्सा जांच: पूर्ण / अनुरोधित
• BNSS धारा 35(3) — Arnesh Kumar अनुपालन
━━━━━━━━━━━━━━━━━━━━━
👮 IO: {io} [{io_badge}]
📞 थाना संपर्क: {ps}
🕐 समय: {_ist_now()}
🔖 संदर्भ: {ref_no}
━━━━━━━━━━━━━━━━━━━━━
_CrimeGPT | BNS/BNSS/BSA 2023 अनुरूप_"""

    elif language == "gu":
        msg = f"""🚨 *ધરપકડ સૂચના — BNSS કલમ 35*
━━━━━━━━━━━━━━━━━━━━━
📋 FIR નં.: *{case.fir_number}*
🏛️ પોલીસ સ્ટેશન: {ps}
👤 આરોપી: *{accused_name}* (ઉંમર: {accused_age})
📅 ધરપકડ: {arrest_dt}
⚖️ કલમો: {sections_str}
🔒 કસ્ટડી: {custody}
━━━━━━━━━━━━━━━━━━━━━
✅ *D.K. Basu માર્ગદર્શિકા પ્રમાણે*
• ધરપકડ મેમો તૈયાર
• પરિવારને જાણ કરવામાં આવી
• તબીબી તપાસ: પૂર્ણ / વિનંતી
• BNSS કલમ 35(3) — Arnesh Kumar અનુપાલન
━━━━━━━━━━━━━━━━━━━━━
👮 IO: {io} [{io_badge}]
📞 સ્ટેશન: {ps}
🕐 સમય: {_ist_now()}
🔖 સંદર્ભ: {ref_no}
━━━━━━━━━━━━━━━━━━━━━
_CrimeGPT | BNS/BNSS/BSA 2023 અનુરૂપ_"""

    else:  # English
        msg = f"""🚨 *ARREST NOTIFICATION — BNSS Section 35*
━━━━━━━━━━━━━━━━━━━━━
📋 FIR No.: *{case.fir_number}*
🏛️ Police Station: {ps}
👤 Accused: *{accused_name}* (Age: {accused_age})
📅 Arrest Date/Time: {arrest_dt}
⚖️ Offences: {sections_str}
🔒 Custody Status: {custody}
━━━━━━━━━━━━━━━━━━━━━
✅ *D.K. Basu Guidelines Complied*
• Arrest Memo prepared & signed
• Family/relative intimated within 8 hours
• Medical examination: Completed / Requested
• BNSS Sec 35(3) Notice — Arnesh Kumar compliance
━━━━━━━━━━━━━━━━━━━━━
👮 IO: {io} [{io_badge}]
📞 Station: {ps}, {case.district}
🕐 Generated: {_ist_now()}
🔖 LERS Ref: {ref_no}
━━━━━━━━━━━━━━━━━━━━━
_CrimeGPT | BNS/BNSS/BSA 2023 Compliant System_"""

    # Audit log
    audit = AuditLog(
        case_id=case_id,
        action="LERS_WHATSAPP_GENERATED",
        officer_name=io,
        role="IO",
        details=f"WhatsApp LERS arrest notification generated for {accused_name}. Ref: {ref_no}"
    )
    db.add(audit)
    db.commit()

    return {
        "lers_ref": ref_no,
        "case_id": case_id,
        "fir_number": case.fir_number,
        "language": language,
        "generated_at_ist": _ist_now(),
        "whatsapp_message": msg,
        "character_count": len(msg),
        "compliance_note": "Message includes D.K. Basu & Arnesh Kumar mandatory advisories per BNSS Sec 35"
    }


# ─────────────────────────────────────────────────────────────────────────────
# Task 7 — BharatPol National Criminal Record Mock API
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/bharatpol/push/{case_id}")
def push_to_bharatpol(
    case_id: str,
    db: Session = Depends(get_db)
):
    """
    Simulate pushing accused records to BharatPol National Criminal Database (ICJS).
    BharatPol is India's national law enforcement portal integrating CCTNS,
    Interpol, Red Corner Notices, and interstate criminal tracking.
    """
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    accused_list = [p for p in case.persons if p.person_type == "ACCUSED"]
    if not accused_list:
        raise HTTPException(status_code=400, detail="No accused persons registered in this case to push to BharatPol.")

    pushed_records = []
    for acc in accused_list:
        bureau_ref = _rand_code("BHARATPOL/GJ/AHM", 5)
        fp_ref = f"FP-GJ-{_rand_code('NCRB', 7)}"
        pushed_records.append({
            "accused_name": acc.name,
            "bureau_ref_id": bureau_ref,
            "fingerprint_record_id": fp_ref,
            "photo_upload_status": "UPLOADED",
            "red_corner_notice": "NOT_REQUIRED",
            "interpol_flag": False,
            "interstate_crime_flag": False,
            "history_sheeter_status": "PENDING_VERIFICATION",
            "prior_cases_linked": random.randint(0, 3),
            "biometric_status": "PENDING_PHYSICAL_CAPTURE",
            "ncrb_state_code": "GJ",
            "ncrb_district_code": "AHM-CITY"
        })

    # Audit log
    audit = AuditLog(
        case_id=case_id,
        action="BHARATPOL_MOCK_PUSH",
        officer_name=case.investigating_officer_name,
        role="IO",
        details=f"Pushed {len(pushed_records)} accused record(s) to BharatPol ICJS mock. Refs: {', '.join(r['bureau_ref_id'] for r in pushed_records)}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "system": "BharatPol National Law Enforcement Portal (ICJS / Interpol Gateway)",
        "status": "RECORDS_PUSHED",
        "pushed_at_ist": _ist_now(),
        "pushed_by": f"{case.investigating_officer_name} [{case.investigating_officer_badge}]",
        "case_fir": case.fir_number,
        "total_records": len(pushed_records),
        "records": pushed_records,
        "note": "BharatPol sync integrates with CCTNS CAS 5.0, ICJS Judiciary Bus, NCRB Criminal Database, and Interpol NCB-India Gateway."
    }


@router.get("/bharatpol/record/{accused_name}")
def query_bharatpol(accused_name: str):
    """
    Simulate querying BharatPol for an accused person's national criminal history.
    Returns simulated prior records, warrants, and interstate crime links.
    """
    # Deterministic seed from name for consistent results
    import hashlib
    seed = int(hashlib.md5(accused_name.lower().encode()).hexdigest(), 16) % 10000
    random.seed(seed)

    prior_count = random.randint(0, 4)
    has_warrant = random.random() > 0.6
    interstate = random.random() > 0.7

    prior_firs = [
        {
            "fir_number": f"FIR-00{random.randint(10,99)}/202{random.randint(2,5)}",
            "police_station": random.choice(["Shahibaug PS, Ahmedabad", "Kalupur PS, Ahmedabad", "Surat Rural PS", "Vadodara City PS"]),
            "offence": random.choice(["BNS Sec 303(2) Theft", "BNS Sec 309 Robbery", "BNS Sec 115(2) Assault", "BNS Sec 318 Cheating"]),
            "year": random.randint(2020, 2025),
            "status": random.choice(["CHARGESHEET_FILED", "UNDER_INVESTIGATION", "ACQUITTED"])
        }
        for _ in range(prior_count)
    ]

    # Reset seed for production predictability
    random.seed()

    return {
        "system": "BharatPol National Criminal Database / NCRB Criminal Tracking",
        "query_name": accused_name,
        "query_timestamp_ist": _ist_now(),
        "record_found": prior_count > 0,
        "history_sheeter": prior_count >= 2,
        "open_warrant": has_warrant,
        "interstate_crime_links": interstate,
        "state_code": "GJ",
        "ncrb_crd_id": _rand_code("NCRB-CRD", 8) if prior_count > 0 else None,
        "prior_firs_count": prior_count,
        "prior_firs": prior_firs,
        "red_corner_notice": False,
        "interpol_flag": False,
        "lookout_notice": has_warrant,
        "remark": (
            "HISTORY SHEETER — Exercise caution during arrest. Additional forces recommended."
            if prior_count >= 2 else
            "No significant prior criminal history found in national database."
        )
    }


# ─────────────────────────────────────────────────────────────────────────────
# Task 3 — HTML Document Preview (PDF via browser Ctrl+P)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/documents/preview/{case_id}/{doc_type}", response_class=HTMLResponse)
def preview_document_as_html(
    case_id: str,
    doc_type: str,
    db: Session = Depends(get_db)
):
    """
    Render a fully-formatted, print-ready HTML preview of a legal document.
    User can save as PDF using browser Ctrl+P → Save as PDF.
    This avoids any server-side PDF library dependency.
    """
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if doc_type not in DOCUMENT_METADATA:
        raise HTTPException(status_code=400, detail=f"Unknown document type: {doc_type}")

    payload = DocumentService.prepare_document_payload(case, doc_type)
    html_content = generate_html_preview(payload)
    return HTMLResponse(content=html_content, status_code=200)

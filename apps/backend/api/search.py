from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Case, AuditLog
from services.legal_intel_service import BNS_CORPUS, BNSS_CORPUS, BSA_CORPUS, LANDMARK_JUDGMENTS

router = APIRouter(prefix="/search", tags=["Full-Text & Legal Search"])

@router.get("/")
def global_search(
    q: str = Query(..., min_length=2, description="Search query across cases, statutes, and judgments"),
    db: Session = Depends(get_db)
):
    query_str = q.lower().strip()
    
    # 1. Search Cases
    matched_cases = []
    cases = db.query(Case).all()
    for c in cases:
        c_text = f"{c.fir_number} {c.police_station} {c.incident_summary} {c.investigating_officer_name}".lower()
        if query_str in c_text:
            matched_cases.append({
                "id": c.id,
                "fir_number": c.fir_number,
                "police_station": c.police_station,
                "status": c.status,
                "summary_snippet": c.incident_summary[:160] + "...",
                "fir_date": c.fir_date.strftime("%d/%m/%Y") if c.fir_date else ""
            })

    # 2. Search BNS Corpus
    matched_bns = []
    for s in BNS_CORPUS:
        s_text = f"{s['section']} {s['title']} {s.get('description', '')} {s.get('ipc_equivalent', '')} {' '.join(s.get('keywords', []))}".lower()
        if query_str in s_text:
            matched_bns.append(s)

    # 3. Search BNSS Corpus
    matched_bnss = []
    for bnss in BNSS_CORPUS:
        bnss_text = f"{bnss['section']} {bnss['title']} {bnss.get('summary', '')} {' '.join(bnss.get('keywords', []))}".lower()
        if query_str in bnss_text:
            matched_bnss.append(bnss)

    # 4. Search Landmark Judgments
    matched_judgments = []
    for j in LANDMARK_JUDGMENTS:
        j_text = f"{j['case_name']} {j['citation']} {j['subject']} {j['principle']} {' '.join(j.get('keywords', []))}".lower()
        if query_str in j_text:
            matched_judgments.append(j)

    return {
        "query": q,
        "results_count": len(matched_cases) + len(matched_bns) + len(matched_bnss) + len(matched_judgments),
        "cases": matched_cases,
        "bns_statutes": matched_bns[:8],
        "bnss_procedural_rules": matched_bnss[:5],
        "landmark_precedents": matched_judgments[:5]
    }

@router.get("/audit-logs")
def get_audit_trail(case_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AuditLog)
    if case_id:
        query = query.filter(AuditLog.case_id == case_id)
    logs = query.order_by(AuditLog.timestamp.desc()).limit(100).all()
    return logs

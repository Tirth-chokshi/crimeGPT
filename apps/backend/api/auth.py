"""
CrimeGPT Authentication API
============================
Issues role-based session tokens for IO, SHO, and LEGAL_ADVISOR roles.
Tokens are enforced across protected endpoints via auth_deps.py.
"""

from fastapi import APIRouter, HTTPException
from schemas import UserLogin, AuthResponse
from api.auth_deps import register_session

router = APIRouter(prefix="/auth", tags=["Authentication"])

MOCK_USERS = {
    "IO": {
        "officer_name": "Inspector R. K. Jadeja",
        "badge_number": "GJ-AHM-4421",
        "role": "IO",
        "police_station": "Navrangpura Police Station, Ahmedabad City",
        "permissions": ["create_case", "generate_document", "add_seizure", "add_person", "record_diary"]
    },
    "SHO": {
        "officer_name": "ACP Harshwardhan Varma",
        "badge_number": "GJ-IPS-1092",
        "role": "SHO",
        "police_station": "Ahmedabad City Police HQ / Zone 1",
        "permissions": ["create_case", "generate_document", "add_seizure", "add_person",
                        "record_diary", "approve_chargesheet", "view_audit_logs", "sync_cctns"]
    },
    "LEGAL_ADVISOR": {
        "officer_name": "Adv. Sneha Trivedi (Public Prosecutor)",
        "badge_number": "BAR-GUJ-8819",
        "role": "LEGAL_ADVISOR",
        "police_station": "Directorate of Prosecution, Sessions Court Ahmedabad",
        "permissions": ["create_case", "generate_document", "add_seizure", "add_person",
                        "record_diary", "approve_chargesheet", "view_audit_logs", "sync_cctns",
                        "legal_intel_override", "landmark_search"]
    }
}

@router.post("/login", response_model=AuthResponse)
def login(user_data: UserLogin):
    role = user_data.role.upper() if user_data.role else "IO"
    if role not in MOCK_USERS:
        role = "IO"

    user_info = MOCK_USERS[role]

    # Issue a deterministic but role-specific session token
    token = f"crimegpt-{role.lower()}-{user_info['badge_number']}-2026"

    # Register in session store so auth_deps can resolve it
    register_session(token, user_info)

    return AuthResponse(
        token=token,
        officer_name=user_info["officer_name"],
        badge_number=user_info["badge_number"],
        role=user_info["role"],
        police_station=user_info["police_station"]
    )


@router.get("/roles")
def get_available_roles():
    return [
        {
            "role": "IO",
            "title": "Investigating Officer (IO)",
            "desc": "Field investigation, FIR recording, Seizure panchanama, Remand filing",
            "permissions": MOCK_USERS["IO"]["permissions"]
        },
        {
            "role": "SHO",
            "title": "Station House Officer (SHO / ACP)",
            "desc": "Station oversight, approval of Chargesheets, Section 35 non-arrest approvals",
            "permissions": MOCK_USERS["SHO"]["permissions"]
        },
        {
            "role": "LEGAL_ADVISOR",
            "title": "Legal Advisor / Public Prosecutor",
            "desc": "Statutory scrutiny under BNS/BNSS, High Court / Supreme Court citations",
            "permissions": MOCK_USERS["LEGAL_ADVISOR"]["permissions"]
        }
    ]


@router.get("/me")
def get_current_user_info(authorization: str = None):
    """
    Returns current officer info from session token.
    Frontend should call this on app startup to verify token is still valid.
    """
    from api.auth_deps import require_auth
    from fastapi import Header
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header provided.")
    from api.auth_deps import _SESSION_STORE
    parts = (authorization or "").split()
    token = parts[1] if len(parts) == 2 else ""
    officer = _SESSION_STORE.get(token)
    if not officer:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return officer

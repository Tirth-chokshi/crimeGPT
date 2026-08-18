"""
CrimeGPT RBAC — Token-Based Role Enforcement
=============================================
Provides FastAPI Depends() guards for:
  - require_auth()  → Any authenticated officer (IO / SHO / LEGAL_ADVISOR)
  - require_sho()   → SHO or LEGAL_ADVISOR only
  - require_legal() → LEGAL_ADVISOR only

Tokens are issued by POST /api/auth/login and stored in an in-memory
session store (resets on server restart — sufficient for hackathon demo).
"""

from fastapi import Header, HTTPException, status
from typing import Optional, Dict, Any

# ── In-memory session store ──────────────────────────────────────────────────
# Maps  token (str) → officer info dict
_SESSION_STORE: Dict[str, Dict[str, Any]] = {}

ROLE_HIERARCHY = {"IO": 1, "SHO": 2, "LEGAL_ADVISOR": 3}


def register_session(token: str, officer_info: Dict[str, Any]) -> None:
    """Called by auth.login() to register a new session token."""
    _SESSION_STORE[token] = officer_info


def _get_officer_from_token(authorization: Optional[str]) -> Dict[str, Any]:
    """
    Parse 'Authorization: Bearer <token>' header and resolve to officer info.
    Raises HTTP 401 if missing/invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Please login via POST /api/auth/login",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    officer = _SESSION_STORE.get(token)
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return officer


def require_auth(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency: requires any authenticated officer (IO / SHO / LEGAL_ADVISOR)."""
    return _get_officer_from_token(authorization)


def require_sho(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency: requires SHO or LEGAL_ADVISOR role."""
    officer = _get_officer_from_token(authorization)
    role = officer.get("role", "IO")
    if ROLE_HIERARCHY.get(role, 0) < ROLE_HIERARCHY["SHO"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. SHO or LEGAL_ADVISOR role required. Your role: {role}"
        )
    return officer


def require_legal(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency: requires LEGAL_ADVISOR role."""
    officer = _get_officer_from_token(authorization)
    role = officer.get("role", "IO")
    if ROLE_HIERARCHY.get(role, 0) < ROLE_HIERARCHY["LEGAL_ADVISOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. LEGAL_ADVISOR role required. Your role: {role}"
        )
    return officer

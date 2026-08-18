"""
cctns_sync_service.py
Provides mock sync adapters for:
1. CCTNS (Crime and Criminal Tracking Network & Systems - National Interoperable Criminal Justice System / ICJS)
2. e-Sakshya (National Digital Evidence Repository under BSA 2023)
"""
import random
import string
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from models import Case, Seizure, AuditLog

# Indian Standard Time
IST = timezone(timedelta(hours=5, minutes=30))


def _to_ist_str(dt: Optional[datetime] = None) -> str:
    if dt is None:
        dt = datetime.now(timezone.utc)
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).strftime("%d/%m/%Y %H:%M:%S IST")


def _random_code(prefix: str, length: int = 6) -> str:
    digits = "".join(random.choices(string.digits, k=length))
    return f"{prefix}-{digits}"


class CCTNSSyncService:

    @staticmethod
    def push_to_cctns(
        db: Session,
        case: Case,
        officer_name: str = "Inspector R. K. Jadeja",
        officer_badge: str = "GJ-AHM-4421"
    ) -> Dict[str, Any]:
        """
        Simulates pushing FIR, accused, and sections to CCTNS Core Application Software (CAS).
        """
        random_suffix = _random_code("SYNC", 4)
        cctns_ack = f"CCTNS/GJ-AHM/2026/{case.fir_number.replace('/', '-')}-{random_suffix}"
        icjs_token = f"ICJS-MHA-GJ-{_random_code('ACK', 6)}"

        sections_list = [f"BNS {s.section_number}" for s in case.sections]
        persons_list = [f"{p.name} ({p.person_type})" for p in case.persons]

        payload_summary = {
            "fir_number": case.fir_number,
            "police_station": case.police_station,
            "district": case.district,
            "state": case.state,
            "incident_date": case.fir_date.strftime("%d/%m/%Y") if case.fir_date else "—",
            "sections_registered": sections_list,
            "persons_recorded": persons_list,
            "seizures_count": len(case.seizures),
            "investigating_officer": f"{officer_name} [{officer_badge}]"
        }

        # Log audit entry
        audit = AuditLog(
            case_id=case.id,
            action="CCTNS_MOCK_SYNC",
            officer_name=officer_name,
            role="IO",
            details=f"Pushed case data to CCTNS CAS / ICJS. Acknowledgment Ref: {cctns_ack}"
        )
        db.add(audit)
        db.commit()

        # Build CAS 5.0 XML field preview (representative structure)
        sections_xml = "\n".join(
            f'        <Section act="{s.split()[0]}" number="{s.split()[1] if len(s.split())>1 else s}"/>'
            for s in sections_list[:5]
        )
        persons_xml = "\n".join(
            f'        <Person name="{p.split("(")[0].strip()}" role="{p.split("(")[1].rstrip(")") if "(" in p else "IO"}"/>'
            for p in persons_list[:5]
        )
        cas_payload_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<CAS_FIR_RECORD version="5.0" gateway="ICJS_MHA">
    <Header>
        <AckNo>{cctns_ack}</AckNo>
        <SyncTimestamp>{_to_ist_str()}</SyncTimestamp>
        <StateCode>GJ</StateCode>
        <DistrictCode>AHM-CITY</DistrictCode>
        <PSCode>NAVRANGPURA-001</PSCode>
    </Header>
    <FIR>
        <FIRNumber>{case.fir_number}</FIRNumber>
        <RegistrationDate>{case.fir_date.strftime("%Y-%m-%d") if case.fir_date else "2026-08-13"}</RegistrationDate>
        <IncidentDate>{case.incident_date_time or "2026-08-13"}</IncidentDate>
        <IncidentPlace>{(case.incident_place or "")[:80]}</IncidentPlace>
        <Sections>
{sections_xml}
        </Sections>
    </FIR>
    <Persons>
{persons_xml}
    </Persons>
    <IO badge="{officer_badge}" name="{officer_name}" rank="PI"/>
    <SyncMeta token="{icjs_token}" status="ACK_RECEIVED"/>
</CAS_FIR_RECORD>"""

        return {
            "success": True,
            "system": "CCTNS Core Application Software (CAS 5.0) / ICJS Interoperable Gateway",
            "status": "SYNCED_ACKNOWLEDGED",
            "cctns_ack_no": cctns_ack,
            "icjs_transaction_token": icjs_token,
            "synced_at_ist": _to_ist_str(),
            "synced_by": f"{officer_name} ({officer_badge})",
            "payload_summary": payload_summary,
            "cas_payload_preview": cas_payload_xml,
            "icjs_gateway_fields": {
                "state_code": "GJ",
                "district_code": "AHM-CITY",
                "ps_code": "NAVRANGPURA-001",
                "ncrb_crime_code": "04A/2026" if sections_list else "GEN/2026",
                "biometric_capture_pending": True,
                "judiciary_bus_notified": True,
                "forensic_lab_bus_notified": False
            },
            "sync_message": "Case data successfully synced to National CCTNS Central Repository and ICJS Judiciary/Forensics Bus."
        }


    @staticmethod
    def push_to_esakshya(
        db: Session,
        case: Case,
        seizure: Seizure,
        hash_value: Optional[str] = None,
        officer_name: str = "Inspector R. K. Jadeja",
        officer_badge: str = "GJ-AHM-4421"
    ) -> Dict[str, Any]:
        """
        Simulates registering an electronic evidence item in the national e-Sakshya portal under BSA 2023.
        """
        sha256_hash = hash_value or seizure.hash_value_or_serial or "NO_HASH_ATTACHED"
        token = _random_code("ESAKSHYA-GJ", 6)
        esakshya_reg_no = f"ESAKSHYA/2026/GJ-AHM/{token}"
        vault_uri = f"esakshya://evidence.nic.in/vault/gj/ahm/{case.fir_number.replace('/', '-')}/{seizure.id[:8]}"

        audit = AuditLog(
            case_id=case.id,
            action="ESAKSHYA_MOCK_SYNC",
            officer_name=officer_name,
            role="IO",
            details=f"Registered evidence '{seizure.item_name}' into e-Sakshya vault with Token: {esakshya_reg_no} (SHA-256: {sha256_hash[:16]}...)"
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "system": "e-Sakshya Digital Evidence Vault (BSA Sec 63 Compliance Gateway)",
            "status": "EVIDENCE_REGISTERED",
            "esakshya_reg_no": esakshya_reg_no,
            "vault_uri": vault_uri,
            "item_name": seizure.item_name,
            "sha256_hash": sha256_hash,
            "storage_location": seizure.storage_location,
            "synced_at_ist": _to_ist_str(),
            "synced_by": f"{officer_name} ({officer_badge})",
            "sync_message": f"Digital evidence '{seizure.item_name}' registered in national e-Sakshya repository with immutable SHA-256 hash stamp."
        }

    @staticmethod
    def get_sync_status(db: Session, case_id: str) -> Dict[str, Any]:
        """
        Retrieves all sync transaction logs for CCTNS and e-Sakshya.
        """
        logs = db.query(AuditLog).filter(
            AuditLog.case_id == case_id,
            AuditLog.action.in_(["CCTNS_MOCK_SYNC", "ESAKSHYA_MOCK_SYNC"])
        ).order_by(AuditLog.timestamp.desc()).all()

        cctns_synced = any(l.action == "CCTNS_MOCK_SYNC" for l in logs)
        esakshya_sync_count = sum(1 for l in logs if l.action == "ESAKSHYA_MOCK_SYNC")

        history = []
        for l in logs:
            history.append({
                "id": l.id,
                "action": l.action,
                "system": "CCTNS / ICJS" if l.action == "CCTNS_MOCK_SYNC" else "e-Sakshya Evidence Vault",
                "officer_name": l.officer_name,
                "role": l.role,
                "details": l.details,
                "timestamp_ist": _to_ist_str(l.timestamp)
            })

        return {
            "case_id": case_id,
            "cctns_synced": cctns_synced,
            "cctns_status": "SYNCED" if cctns_synced else "PENDING_SYNC",
            "esakshya_registered_count": esakshya_sync_count,
            "total_sync_events": len(logs),
            "history": history
        }

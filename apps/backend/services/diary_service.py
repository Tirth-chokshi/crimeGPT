from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models import Case, CaseDiaryEvent, AuditLog, Person

# IST offset
IST = timezone(timedelta(hours=5, minutes=30))


def _to_ist(dt: datetime) -> datetime:
    """Convert a naive UTC datetime to IST-aware datetime."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)


def _parse_datetime(dt_str: str) -> Optional[datetime]:
    """Parse an arrest datetime string stored as ISO or Indian date format."""
    if not dt_str:
        return None
    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%d/%m/%Y %H:%M",
        "%d-%m-%Y %H:%M",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(dt_str.strip(), fmt)
        except ValueError:
            continue
    return None


def _hours_remaining(deadline_utc: datetime) -> float:
    now = datetime.utcnow()
    delta = (deadline_utc - now).total_seconds() / 3600
    return round(delta, 2)


def _days_remaining(deadline_utc: datetime) -> int:
    now = datetime.utcnow()
    return max(0, (deadline_utc - now).days)


def _severity(value: float, unit: str = "hours") -> str:
    """
    Compute urgency level.
    hours:  CRITICAL < 2h, WARNING < 6h, CAUTION < 12h, SAFE otherwise
    days:   CRITICAL < 3d, WARNING < 7d, CAUTION < 15d, SAFE otherwise
    """
    if unit == "hours":
        if value <= 0:
            return "OVERDUE"
        elif value < 2:
            return "CRITICAL"
        elif value < 6:
            return "WARNING"
        elif value < 12:
            return "CAUTION"
        else:
            return "SAFE"
    else:
        if value <= 0:
            return "OVERDUE"
        elif value < 3:
            return "CRITICAL"
        elif value < 7:
            return "WARNING"
        elif value < 15:
            return "CAUTION"
        else:
            return "SAFE"


class DiaryService:

    @staticmethod
    def _is_major_offence(case: Case) -> bool:
        """Returns True if any BNS section implies punishment >= 10 years / life / death."""
        major_sections = {"103", "70", "111", "310", "140", "113", "64", "109"}
        for sec in case.sections:
            if sec.section_number in major_sections:
                return True
        return False

    @staticmethod
    def calculate_per_accused_clocks(case: Case) -> List[Dict[str, Any]]:
        """
        Returns one compliance clock dict per arrested accused.
        Covers:
          - 24-hour Magistrate Production clock (BNSS Sec 187(1))
          - 15-day Police Remand cap (BNSS Sec 187(2))
          - 60/90-day Default Bail tracker (BNSS Sec 187(3) + 479)
        """
        now_utc = datetime.utcnow()
        chargesheet_filed = case.status == "CHARGESHEET_FILED"
        is_major = DiaryService._is_major_offence(case)
        chargesheet_days = 90 if is_major else 60
        fir_dt = case.fir_date or case.created_at
        chargesheet_deadline_utc = fir_dt + timedelta(days=chargesheet_days)
        chargesheet_days_left = _days_remaining(chargesheet_deadline_utc)
        chargesheet_status = "COMPLIED" if chargesheet_filed else _severity(chargesheet_days_left, "days")

        arrested_persons = [
            p for p in case.persons
            if p.person_type == "ACCUSED" and p.arrest_date_time
        ]

        if not arrested_persons:
            return [{
                "accused_id": None,
                "accused_name": None,
                "no_arrests_yet": True,
                "chargesheet_clock": {
                    "chargesheet_days_allowed": chargesheet_days,
                    "deadline_utc": chargesheet_deadline_utc.isoformat() + "Z",
                    "deadline_ist": _to_ist(chargesheet_deadline_utc).strftime("%d/%m/%Y %H:%M IST"),
                    "days_remaining": chargesheet_days_left,
                    "status": chargesheet_status,
                    "bail_right_triggered": chargesheet_days_left <= 0 and not chargesheet_filed
                }
            }]

        clocks = []
        for person in arrested_persons:
            arrest_dt = _parse_datetime(person.arrest_date_time)
            if not arrest_dt:
                continue

            # 24-hour Magistrate Production Clock
            production_deadline = arrest_dt + timedelta(hours=24)
            prod_hrs = _hours_remaining(production_deadline)
            prod_complied = person.custody_status in ("POLICE_CUSTODY", "JUDICIAL_CUSTODY", "ON_BAIL")
            prod_status = "COMPLIED" if prod_complied else _severity(prod_hrs, "hours")

            # 15-day Police Remand Cap
            police_custody_days = (now_utc - arrest_dt).days if person.custody_status == "POLICE_CUSTODY" else 0
            remand_days_remaining = max(0, 15 - police_custody_days)
            remand_status = (
                "N/A" if person.custody_status not in ("POLICE_CUSTODY", "JUDICIAL_CUSTODY")
                else _severity(remand_days_remaining, "days")
            )

            bail_right_triggered = chargesheet_days_left <= 0 and not chargesheet_filed

            clocks.append({
                "accused_id": person.id,
                "accused_name": person.name,
                "no_arrests_yet": False,
                "arrest_datetime_utc": arrest_dt.isoformat() + "Z",
                "arrest_datetime_ist": _to_ist(arrest_dt).strftime("%d/%m/%Y %H:%M IST"),
                "custody_status": person.custody_status,
                "magistrate_production_24h": {
                    "deadline_utc": production_deadline.isoformat() + "Z",
                    "deadline_ist": _to_ist(production_deadline).strftime("%d/%m/%Y %H:%M IST"),
                    "hours_remaining": max(0.0, prod_hrs),
                    "status": prod_status,
                    "complied": prod_complied,
                    "mandate": "Section 187 BNSS: Produce accused before nearest Magistrate within 24 hours of arrest (excluding journey time)."
                },
                "police_remand_15d": {
                    "days_in_police_custody": police_custody_days,
                    "days_remaining": remand_days_remaining,
                    "status": remand_status,
                    "max_days": 15,
                    "mandate": "Section 187(2) BNSS: Total police custody must not exceed 15 days in first 40/60 days of investigation."
                },
                "chargesheet_clock": {
                    "chargesheet_days_allowed": chargesheet_days,
                    "deadline_utc": chargesheet_deadline_utc.isoformat() + "Z",
                    "deadline_ist": _to_ist(chargesheet_deadline_utc).strftime("%d/%m/%Y %H:%M IST"),
                    "days_remaining": chargesheet_days_left,
                    "status": chargesheet_status,
                    "bail_right_triggered": bail_right_triggered,
                    "mandate": (
                        f"Section 187(3) BNSS: File chargesheet within {chargesheet_days} days "
                        "or accused gains indefeasible right to default bail under Sec 479 BNSS."
                    )
                }
            })

        return clocks

    @staticmethod
    def get_compliance_alerts(case: Case) -> List[Dict[str, Any]]:
        """Scans all accused clocks and returns alerts for critical/warning/overdue conditions."""
        alerts = []
        clocks = DiaryService.calculate_per_accused_clocks(case)

        for clock in clocks:
            name = clock.get("accused_name") or "Unknown Accused"

            if clock.get("no_arrests_yet"):
                cs = clock.get("chargesheet_clock", {})
                if cs.get("status") in ("CRITICAL", "WARNING", "OVERDUE", "CAUTION"):
                    alerts.append({
                        "level": cs["status"],
                        "type": "CHARGESHEET_DEADLINE",
                        "accused": None,
                        "message": (
                            f"Chargesheet deadline in {cs.get('days_remaining', 0)} days "
                            f"({cs.get('deadline_ist', '')}). File Police Report under Sec 193 BNSS."
                        ),
                        "mandate": cs.get("mandate", "")
                    })
                continue

            prod = clock.get("magistrate_production_24h", {})
            if prod.get("status") in ("CRITICAL", "WARNING", "OVERDUE") and not prod.get("complied"):
                alerts.append({
                    "level": prod["status"],
                    "type": "PRODUCTION_24H",
                    "accused": name,
                    "message": (
                        f"🚨 {name} must be produced before Magistrate in "
                        f"{prod.get('hours_remaining', 0):.1f}h! Deadline: {prod.get('deadline_ist', '')}."
                    ),
                    "mandate": prod.get("mandate", "")
                })

            rem = clock.get("police_remand_15d", {})
            if rem.get("status") in ("CRITICAL", "WARNING") and clock.get("custody_status") == "POLICE_CUSTODY":
                alerts.append({
                    "level": rem["status"],
                    "type": "REMAND_15D_CAP",
                    "accused": name,
                    "message": (
                        f"⏰ {name} has {rem.get('days_remaining', 0)} days of police remand "
                        "left out of 15-day cap. Move to judicial custody or release."
                    ),
                    "mandate": rem.get("mandate", "")
                })

            cs = clock.get("chargesheet_clock", {})
            if cs.get("bail_right_triggered"):
                alerts.append({
                    "level": "CRITICAL",
                    "type": "DEFAULT_BAIL_TRIGGERED",
                    "accused": name,
                    "message": (
                        f"🔴 DEFAULT BAIL RIGHT TRIGGERED for {name}! "
                        "Chargesheet not filed within the statutory period. File immediately."
                    ),
                    "mandate": cs.get("mandate", "")
                })
            elif cs.get("status") in ("CRITICAL", "WARNING", "CAUTION"):
                alerts.append({
                    "level": cs["status"],
                    "type": "CHARGESHEET_DEADLINE",
                    "accused": name,
                    "message": (
                        f"📋 Chargesheet due in {cs.get('days_remaining', 0)} days. "
                        f"Deadline: {cs.get('deadline_ist', '')}."
                    ),
                    "mandate": cs.get("mandate", "")
                })

        priority = {"OVERDUE": 0, "CRITICAL": 1, "WARNING": 2, "CAUTION": 3, "SAFE": 4}
        alerts.sort(key=lambda a: priority.get(a["level"], 99))
        return alerts

    @staticmethod
    def get_diary_summary(case: Case) -> Dict[str, Any]:
        """Returns structured diary summary for .docx export."""
        events = sorted(case.diary_events, key=lambda e: e.event_timestamp)
        return {
            "fir_number": case.fir_number,
            "police_station": case.police_station,
            "district": case.district,
            "state": case.state,
            "fir_date": case.fir_date.strftime("%d/%m/%Y") if case.fir_date else "—",
            "io_name": case.investigating_officer_name,
            "io_badge": case.investigating_officer_badge,
            "io_rank": case.investigating_officer_rank,
            "case_status": case.status,
            "events": [
                {
                    "serial": idx + 1,
                    "timestamp_ist": _to_ist(e.event_timestamp).strftime("%d/%m/%Y %H:%M IST"),
                    "step_type": e.step_type,
                    "step_title": e.step_title,
                    "location": e.location or "—",
                    "description": e.description,
                    "officer_name": e.officer_name,
                    "officer_badge": e.officer_badge or "—",
                    "statutory_reference": e.statutory_deadline_reference or "—"
                }
                for idx, e in enumerate(events)
            ]
        }

    @staticmethod
    def calculate_bnss_deadlines(case: Case) -> Dict[str, Any]:
        """Legacy method kept for backward compatibility."""
        is_major = DiaryService._is_major_offence(case)
        chargesheet_days = 90 if is_major else 60
        fir_dt = case.fir_date or case.created_at
        chargesheet_deadline = fir_dt + timedelta(days=chargesheet_days)
        now = datetime.utcnow()

        return {
            "fir_date": fir_dt.strftime("%d/%m/%Y"),
            "is_major_offence": is_major,
            "chargesheet_statutory_limit_days": chargesheet_days,
            "chargesheet_due_date": chargesheet_deadline.strftime("%d/%m/%Y"),
            "days_remaining_for_chargesheet": max(0, (chargesheet_deadline - now).days),
            "is_chargesheet_overdue": now > chargesheet_deadline and case.status != "CHARGESHEET_FILED",
            "per_accused_clocks": DiaryService.calculate_per_accused_clocks(case),
            "bnss_rules_active": [
                f"Sec 193 BNSS: Maximum {chargesheet_days} days to file Police Report.",
                "Sec 105 BNSS: Mandatory audio-video recording of search/seizure.",
                "Sec 53 BNSS: Mandatory medico-legal examination of arrested accused.",
                "Sec 187 BNSS: Production before Magistrate within 24 hours of arrest."
            ]
        }

    @staticmethod
    def add_diary_event(
        db: Session,
        case_id: str,
        step_title: str,
        step_type: str,
        description: str,
        location: Optional[str] = None,
        officer_name: str = "Inspector R. K. Jadeja",
        officer_badge: str = "GJ-AHM-4421",
        statutory_ref: Optional[str] = None
    ) -> CaseDiaryEvent:
        event = CaseDiaryEvent(
            case_id=case_id,
            step_title=step_title,
            step_type=step_type,
            location=location,
            description=description,
            officer_name=officer_name,
            officer_badge=officer_badge,
            statutory_deadline_reference=statutory_ref,
            event_timestamp=datetime.utcnow()
        )
        db.add(event)

        audit = AuditLog(
            case_id=case_id,
            action="DIARY_EVENT_ADDED",
            officer_name=officer_name,
            role="IO",
            details=f"Added Case Diary Step: {step_title} [{step_type}]"
        )
        db.add(audit)
        db.commit()
        db.refresh(event)
        return event


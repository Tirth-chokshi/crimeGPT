"""
diary_export_service.py
Generates the official BNSS Case Diary .docx document for a given case.
Called by api/diary.py on the /export endpoint.
"""
import io
from datetime import datetime
from typing import Dict, Any

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


# ── Style helpers ─────────────────────────────────────────────────────────────

def _set_cell_bg(cell, hex_color: str):
    """Fill a table cell with a solid background colour (e.g. '1e3a5f')."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def _bold_run(para, text: str, size_pt: int = 10, color_hex: str = "000000"):
    run = para.add_run(text)
    run.bold = True
    run.font.size = Pt(size_pt)
    run.font.color.rgb = RGBColor.from_string(color_hex)
    return run


def _normal_run(para, text: str, size_pt: int = 10):
    run = para.add_run(text)
    run.font.size = Pt(size_pt)
    return run


def _step_type_icon(step_type: str) -> str:
    icons = {
        "FIR": "📋",
        "CRIME_SCENE_VISIT": "🔍",
        "WITNESS_EXAMINATION": "👤",
        "SEIZURE": "🔒",
        "ARREST": "🚔",
        "MEDICAL_EXAM": "🏥",
        "REMAND_PRODUCED": "⚖️",
        "CUSTODY_EXTENDED": "🔗",
        "FORENSIC_DISPATCH": "🧪",
        "CHARGESHEET": "📄",
    }
    return icons.get(step_type, "📌")


# ── Main export function ──────────────────────────────────────────────────────

def generate_case_diary_docx(summary: Dict[str, Any], clocks: list, alerts: list) -> bytes:
    """
    Generates a BNSS-compliant Case Diary .docx from structured data.

    Args:
        summary: Output of DiaryService.get_diary_summary(case)
        clocks:  Output of DiaryService.calculate_per_accused_clocks(case)
        alerts:  Output of DiaryService.get_compliance_alerts(case)

    Returns:
        Raw bytes of the generated .docx document.
    """
    doc = Document()

    # ── Page margins (narrow) ─────────────────────────────────────────────────
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # ── Cover / Header ────────────────────────────────────────────────────────
    heading = doc.add_paragraph()
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = heading.add_run("CASE DIARY")
    r.bold = True
    r.font.size = Pt(18)
    r.font.color.rgb = RGBColor(0x1A, 0x3A, 0x6B)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    _bold_run(sub, "(Under Section 187 read with Section 193 BNSS — Bharatiya Nagarik Suraksha Sanhita, 2023)", 9, "555555")

    doc.add_paragraph()

    # ── Case Metadata Table ───────────────────────────────────────────────────
    meta_table = doc.add_table(rows=5, cols=4)
    meta_table.style = "Table Grid"
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER

    def _meta_cell(row_idx, col_idx, label: str, value: str):
        cell = meta_table.rows[row_idx].cells[col_idx]
        p = cell.paragraphs[0]
        _bold_run(p, f"{label}:  ", 9)
        _normal_run(p, value or "—", 9)

    _meta_cell(0, 0, "FIR Number", summary.get("fir_number", "—"))
    _meta_cell(0, 2, "FIR Date", summary.get("fir_date", "—"))
    _meta_cell(1, 0, "Police Station", summary.get("police_station", "—"))
    _meta_cell(1, 2, "District / State", f"{summary.get('district', '—')}, {summary.get('state', '—')}")
    _meta_cell(2, 0, "IO Name", summary.get("io_name", "—"))
    _meta_cell(2, 2, "Badge / Rank", f"{summary.get('io_badge', '—')} | {summary.get('io_rank', '—')}")
    _meta_cell(3, 0, "Case Status", summary.get("case_status", "—").replace("_", " "))
    _meta_cell(3, 2, "Generated On", datetime.now().strftime("%d/%m/%Y %H:%M IST"))
    _meta_cell(4, 0, "Total Diary Entries", str(len(summary.get("events", []))))
    _meta_cell(4, 2, "Authority", "BNSS 2023 (Act No. 46 of 2023)")

    doc.add_paragraph()

    # ── Compliance Clock Summary ──────────────────────────────────────────────
    cs_heading = doc.add_paragraph()
    _bold_run(cs_heading, "⏱  STATUTORY COMPLIANCE CLOCKS (BNSS Sec 187 & 479)", 11, "1A3A6B")

    if not clocks or (len(clocks) == 1 and clocks[0].get("no_arrests_yet")):
        # No arrests — show chargesheet deadline only
        cs_table = doc.add_table(rows=2, cols=3)
        cs_table.style = "Table Grid"
        hdr = cs_table.rows[0].cells
        for cell, txt in zip(hdr, ["Clock Type", "Deadline (IST)", "Status"]):
            _set_cell_bg(cell, "1e3a5f")
            p = cell.paragraphs[0]
            _bold_run(p, txt, 9, "FFFFFF")

        if clocks:
            cs_clock = clocks[0].get("chargesheet_clock", {})
            row = cs_table.rows[1].cells
            row[0].paragraphs[0].add_run("📋 Chargesheet Deadline (Sec 193 BNSS)").font.size = Pt(9)
            row[1].paragraphs[0].add_run(cs_clock.get("deadline_ist", "—")).font.size = Pt(9)
            row[2].paragraphs[0].add_run(
                f"{cs_clock.get('status', '—')} — {cs_clock.get('days_remaining', '?')} days left"
            ).font.size = Pt(9)

        no_arr_p = doc.add_paragraph()
        no_arr_p.add_run("  ⚠ No arrests recorded yet in this case.").font.size = Pt(9)
    else:
        for clock in clocks:
            if clock.get("no_arrests_yet"):
                continue
            acc_name = clock.get("accused_name", "Unknown")
            acc_para = doc.add_paragraph()
            _bold_run(acc_para, f"Accused: {acc_name}  |  Arrested: {clock.get('arrest_datetime_ist', '—')}  |  Custody: {clock.get('custody_status', '—')}", 9, "333333")

            ct = doc.add_table(rows=4, cols=4)
            ct.style = "Table Grid"
            for cell, txt in zip(ct.rows[0].cells, ["Clock", "Deadline / Limit", "Remaining", "Status"]):
                _set_cell_bg(cell, "1e3a5f")
                _bold_run(cell.paragraphs[0], txt, 9, "FFFFFF")

            prod = clock.get("magistrate_production_24h", {})
            row = ct.rows[1].cells
            row[0].paragraphs[0].add_run("🚨 24-Hour Magistrate Production").font.size = Pt(9)
            row[1].paragraphs[0].add_run(prod.get("deadline_ist", "—")).font.size = Pt(9)
            row[2].paragraphs[0].add_run(
                f"{prod.get('hours_remaining', 0):.1f} hours" if not prod.get("complied") else "COMPLIED"
            ).font.size = Pt(9)
            row[3].paragraphs[0].add_run(prod.get("status", "—")).font.size = Pt(9)

            rem = clock.get("police_remand_15d", {})
            row = ct.rows[2].cells
            row[0].paragraphs[0].add_run("⏰ 15-Day Police Remand Cap").font.size = Pt(9)
            row[1].paragraphs[0].add_run("Max 15 days (Sec 187(2) BNSS)").font.size = Pt(9)
            row[2].paragraphs[0].add_run(f"{rem.get('days_remaining', '—')} days left").font.size = Pt(9)
            row[3].paragraphs[0].add_run(rem.get("status", "—")).font.size = Pt(9)

            cs = clock.get("chargesheet_clock", {})
            row = ct.rows[3].cells
            row[0].paragraphs[0].add_run(f"📋 {cs.get('chargesheet_days_allowed', 60)}-Day Chargesheet Deadline").font.size = Pt(9)
            row[1].paragraphs[0].add_run(cs.get("deadline_ist", "—")).font.size = Pt(9)
            row[2].paragraphs[0].add_run(f"{cs.get('days_remaining', '?')} days left").font.size = Pt(9)
            bail_flag = " ⚠ BAIL RIGHT TRIGGERED" if cs.get("bail_right_triggered") else ""
            row[3].paragraphs[0].add_run(cs.get("status", "—") + bail_flag).font.size = Pt(9)

            doc.add_paragraph()

    # ── Compliance Alerts ─────────────────────────────────────────────────────
    if alerts:
        doc.add_paragraph()
        alert_heading = doc.add_paragraph()
        _bold_run(alert_heading, "🔔  COMPLIANCE ALERTS", 11, "B91C1C")

        for alert in alerts:
            ap = doc.add_paragraph()
            level_colors = {"CRITICAL": "B91C1C", "OVERDUE": "7C3AED", "WARNING": "D97706", "CAUTION": "2563EB"}
            color = level_colors.get(alert.get("level", ""), "333333")
            _bold_run(ap, f"[{alert.get('level', '?')}]  ", 9, color)
            _normal_run(ap, alert.get("message", ""), 9)

    # ── Case Diary Events Table ───────────────────────────────────────────────
    doc.add_paragraph()
    diary_heading = doc.add_paragraph()
    _bold_run(diary_heading, "📓  CASE DIARY ENTRIES (Chronological)", 12, "1A3A6B")

    events = summary.get("events", [])
    if not events:
        doc.add_paragraph().add_run("  No diary entries recorded yet.")
    else:
        events_table = doc.add_table(rows=len(events) + 1, cols=6)
        events_table.style = "Table Grid"

        headers = ["Sr.", "Date / Time", "Step Type", "Step Title", "Location", "Statutory Reference"]
        for cell, txt in zip(events_table.rows[0].cells, headers):
            _set_cell_bg(cell, "1e3a5f")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            _bold_run(p, txt, 9, "FFFFFF")

        for i, event in enumerate(events):
            row_cells = events_table.rows[i + 1].cells
            row_cells[0].paragraphs[0].add_run(str(event.get("serial", i + 1))).font.size = Pt(9)
            row_cells[1].paragraphs[0].add_run(event.get("timestamp_ist", "—")).font.size = Pt(9)
            icon = _step_type_icon(event.get("step_type", ""))
            row_cells[2].paragraphs[0].add_run(f"{icon} {event.get('step_type', '—')}").font.size = Pt(8)
            row_cells[3].paragraphs[0].add_run(event.get("step_title", "—")).font.size = Pt(9)
            row_cells[4].paragraphs[0].add_run(event.get("location", "—")).font.size = Pt(9)
            row_cells[5].paragraphs[0].add_run(event.get("statutory_reference", "—")).font.size = Pt(8)

        # Description block below the main table
        doc.add_paragraph()
        _bold_run(doc.add_paragraph(), "Entry Details:", 10, "1A3A6B")
        for event in events:
            ep = doc.add_paragraph(style="List Bullet")
            _bold_run(ep, f"[{event.get('serial', '')}] {event.get('step_title', '')} — {event.get('timestamp_ist', '')}:  ", 9, "1A3A6B")
            _normal_run(ep, event.get("description", "—"), 9)
            officer_p = doc.add_paragraph()
            officer_p.paragraph_format.left_indent = Inches(0.3)
            _normal_run(officer_p, f"Officer: {event.get('officer_name', '—')} ({event.get('officer_badge', '—')})", 8)

    # ── Footer / Signature Block ──────────────────────────────────────────────
    doc.add_paragraph()
    doc.add_paragraph()
    sig_table = doc.add_table(rows=3, cols=2)
    sig_table.style = "Table Grid"
    sig_table.rows[0].cells[0].paragraphs[0].add_run("Prepared by (IO):").font.size = Pt(9)
    sig_table.rows[0].cells[1].paragraphs[0].add_run("Verified by (SHO / DySP):").font.size = Pt(9)
    sig_table.rows[1].cells[0].paragraphs[0].add_run(
        f"{summary.get('io_name', '—')} | {summary.get('io_badge', '—')}"
    ).font.size = Pt(9)
    sig_table.rows[1].cells[1].paragraphs[0].add_run("Name & Badge: ___________________").font.size = Pt(9)
    sig_table.rows[2].cells[0].paragraphs[0].add_run("Date & Sign: ___________________").font.size = Pt(9)
    sig_table.rows[2].cells[1].paragraphs[0].add_run("Seal & Sign: ___________________").font.size = Pt(9)

    disclaimer = doc.add_paragraph()
    disclaimer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    _normal_run(
        disclaimer,
        "This Case Diary is generated by CrimeGPT. The contents are based on data entered by the Investigating Officer. "
        "This document is confidential and for official police use only.",
        8
    )

    # ── Serialize to bytes ────────────────────────────────────────────────────
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()

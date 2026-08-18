"""
evidence_vault_service.py
Provides cryptographic hashing (SHA-256 / MD5), Section 63 BSA Digital Evidence Certificate (.docx)
generation, Malkhana QR code tagging, and electronic evidence tamper-detection.
"""
import io
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple

import qrcode
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from models import Case, Seizure, AuditLog

# Indian Standard Time
IST = timezone(timedelta(hours=5, minutes=30))


def _to_ist_str(dt: Optional[datetime] = None) -> str:
    if dt is None:
        dt = datetime.now(timezone.utc)
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).strftime("%d/%m/%Y %H:%M:%S IST")


def _set_cell_bg(cell, hex_color: str):
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


class EvidenceVaultService:

    @staticmethod
    def compute_hashes(file_bytes: bytes) -> Dict[str, Any]:
        """
        Computes SHA-256 and MD5 cryptographic digests in 64KB chunks.
        """
        sha256 = hashlib.sha256()
        md5 = hashlib.md5()
        chunk_size = 65536

        bio = io.BytesIO(file_bytes)
        while True:
            chunk = bio.read(chunk_size)
            if not chunk:
                break
            sha256.update(chunk)
            md5.update(chunk)

        return {
            "sha256": sha256.hexdigest().upper(),
            "md5": md5.hexdigest().upper(),
            "size_bytes": len(file_bytes),
            "size_formatted": f"{len(file_bytes) / 1024:.2f} KB" if len(file_bytes) < 1048576 else f"{len(file_bytes) / 1048576:.2f} MB",
            "computed_at_ist": _to_ist_str()
        }

    @staticmethod
    def generate_qr_code(
        seizure_id: str,
        case_fir: str,
        item_name: str,
        hash_value: str,
        storage_location: str = "Malkhana Locker Rack #B4"
    ) -> bytes:
        """
        Generates a high-contrast Malkhana QR code containing a structured verification payload.
        """
        payload = {
            "system": "CrimeGPT-Malkhana-Vault",
            "statute": "BSA 2023 Sec 63 & BNSS 2023 Sec 105",
            "fir": case_fir,
            "seizure_id": seizure_id,
            "item": item_name,
            "sha256": hash_value or "PENDING",
            "malkhana": storage_location or "Malkhana Locker Rack #B4",
            "generated_at": _to_ist_str()
        }

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(json.dumps(payload, ensure_ascii=False))
        qr.make(fit=True)

        img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf.read()

    @staticmethod
    def generate_bsa_section63_certificate(
        case: Case,
        seizure: Seizure,
        hash_value: str,
        officer_name: str = "Inspector R. K. Jadeja",
        officer_badge: str = "GJ-AHM-4421",
        device_details: Optional[Dict[str, str]] = None
    ) -> bytes:
        """
        Generates the official Certificate under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA).
        Replaces legacy Section 65B Indian Evidence Act certificates.
        """
        doc = Document()

        for section in doc.sections:
            section.top_margin = Inches(0.75)
            section.bottom_margin = Inches(0.75)
            section.left_margin = Inches(1.0)
            section.right_margin = Inches(1.0)

        # ── Document Header ───────────────────────────────────────────────────
        hdr = doc.add_paragraph()
        hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = hdr.add_run("SCHEDULE — FORM OF CERTIFICATE")
        r.bold = True
        r.font.size = Pt(11)
        r.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

        title = doc.add_paragraph()
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_title = title.add_run("CERTIFICATE UNDER SECTION 63(4) OF THE\nBHARATIYA SAKSHYA ADHINIYAM, 2023 (BSA)")
        r_title.bold = True
        r_title.font.size = Pt(15)
        r_title.font.color.rgb = RGBColor(0x1A, 0x3A, 0x6B)

        sub = doc.add_paragraph()
        sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _bold_run(
            sub,
            "(Statutory Condition Precedent for Admissibility of Electronic/Digital Records in Judicial Proceedings)",
            9,
            "666666"
        )
        _normal_run(sub, "\n[Replaces Certificate under Section 65B of the Indian Evidence Act, 1872]", 8)

        doc.add_paragraph()

        # ── Case & Evidence Metadata Table ───────────────────────────────────
        meta_table = doc.add_table(rows=5, cols=4)
        meta_table.style = "Table Grid"
        meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER

        def _cell(r_i, c_i, lbl, val):
            c = meta_table.rows[r_i].cells[c_i]
            p = c.paragraphs[0]
            _bold_run(p, f"{lbl}:  ", 9)
            _normal_run(p, val or "—", 9)

        _cell(0, 0, "FIR Number", case.fir_number)
        _cell(0, 2, "FIR Date", case.fir_date.strftime("%d/%m/%Y") if case.fir_date else "—")
        _cell(1, 0, "Police Station", case.police_station)
        _cell(1, 2, "District / State", f"{case.district}, {case.state}")
        _cell(2, 0, "Seizure Item", seizure.item_name)
        _cell(2, 2, "Category / Type", seizure.category or "Electronic Device / Media")
        _cell(3, 0, "Seized From", seizure.seized_from_person_name or "Accused / Scene of Crime")
        _cell(3, 2, "Seizure Date/Time", seizure.seizure_date_time or _to_ist_str())
        _cell(4, 0, "Malkhana Rack", seizure.storage_location or "Malkhana Locker #B4")
        _cell(4, 2, "Videography Ref", seizure.videography_ref_id or "BNSS-105-REC-001")

        doc.add_paragraph()

        # ── Cryptographic Hash Digest Section ─────────────────────────────────
        p_hash = doc.add_paragraph()
        _bold_run(p_hash, "🔐  CRYPTOGRAPHIC HASH INTEGRITY VERIFICATION (Sec 63(4)(c) BSA)", 11, "1A3A6B")

        hash_table = doc.add_table(rows=4, cols=2)
        hash_table.style = "Table Grid"
        for c, txt in zip(hash_table.rows[0].cells, ["Parameter / Metric", "Cryptographic Value"]):
            _set_cell_bg(c, "1e3a5f")
            _bold_run(c.paragraphs[0], txt, 9, "FFFFFF")

        row1 = hash_table.rows[1].cells
        row1[0].paragraphs[0].add_run("Cryptographic Algorithm").font.size = Pt(9)
        row1[1].paragraphs[0].add_run("SHA-256 (FIPS 180-4 Secure Hash Standard)").font.size = Pt(9)

        row2 = hash_table.rows[2].cells
        row2[0].paragraphs[0].add_run("SHA-256 Hex Digest").font.size = Pt(9)
        r_sha = row2[1].paragraphs[0].add_run(hash_value or "PENDING HASH COMPUTATION")
        r_sha.font.size = Pt(9)
        r_sha.font.bold = True
        r_sha.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

        row3 = hash_table.rows[3].cells
        row3[0].paragraphs[0].add_run("Extraction / Verification Timestamp").font.size = Pt(9)
        row3[1].paragraphs[0].add_run(_to_ist_str()).font.size = Pt(9)

        doc.add_paragraph()

        # ── PART A: Declaration by Custodian / Device Owner (Sec 63(4)(a)) ───
        p_part_a = doc.add_paragraph()
        _bold_run(p_part_a, "PART A — DECLARATION BY PERSON IN LAWFUL CONTROL OF DEVICE (Sec 63(4)(a))", 11, "1A3A6B")

        pa_text = doc.add_paragraph()
        _normal_run(
            pa_text,
            f"I hereby state and solemnly declare that I have been in lawful control and custody of the computer system, "
            f"device, or electronic medium identified as '{seizure.item_name}' during the relevant period of operation.\n\n"
            f"1. The electronic record/output was produced by the computer/device during the period over which the device was used regularly to store or process information.\n"
            f"2. Throughout the said material part of the period, the computer/device was operating properly, or if not, any period during which it was not operating properly did not affect the electronic record or the accuracy of its contents.\n"
            f"3. The information contained in the electronic record reproduces or is derived from such information fed into the computer/device in the ordinary course of the said activities."
        )

        doc.add_paragraph()

        # ── PART B: Certification by IO / Forensic Expert (Sec 63(4)(b)) ─────
        p_part_b = doc.add_paragraph()
        _bold_run(p_part_b, "PART B — CERTIFICATION BY INVESTIGATING OFFICER / EXPERT (Sec 63(4)(b))", 11, "1A3A6B")

        pb_text = doc.add_paragraph()
        _normal_run(
            pb_text,
            f"I, {officer_name}, {case.investigating_officer_rank or 'Police Inspector'}, Badge No: {officer_badge}, "
            f"Police Station {case.police_station}, District {case.district}, do hereby certify and affirm that:\n\n"
            f"1. On {_to_ist_str()}, I have supervised the extraction and cryptographic verification of the electronic record from '{seizure.item_name}'.\n"
            f"2. The electronic record was extracted using validated forensic imaging methodology without alteration of bitstream data.\n"
            f"3. The SHA-256 hash value computed at the time of extraction is:\n   {hash_value or 'PENDING'}\n"
            f"4. The original device/media has been sealed in tamper-evident packaging under Panchanama in presence of independent panch witnesses and deposited in the Malkhana under register entry: {seizure.storage_location}."
        )

        doc.add_paragraph()

        # ── Statutory Penal Warning (BNS Sec 229 & 230) ──────────────────────
        p_warn = doc.add_paragraph()
        _bold_run(p_warn, "⚠ STATUTORY WARNING UNDER BHARATIYA NYAYA SANHITA, 2023:", 9, "B91C1C")
        _normal_run(
            p_warn,
            " Giving false evidence or fabricating false evidence in a certificate under Section 63 BSA is a punishable "
            "offence under Section 229 and Section 230 of the Bharatiya Nyaya Sanhita, 2023 (BNS), punishable with imprisonment up to 7 years and fine.",
            8
        )

        doc.add_paragraph()
        doc.add_paragraph()

        # ── Signature Blocks ──────────────────────────────────────────────────
        sig_table = doc.add_table(rows=3, cols=2)
        sig_table.style = "Table Grid"

        sig_table.rows[0].cells[0].paragraphs[0].add_run("Signature of Device Custodian / Person (Part A):").font.size = Pt(9)
        sig_table.rows[0].cells[1].paragraphs[0].add_run("Signature & Seal of Certifying Officer / IO (Part B):").font.size = Pt(9)

        sig_table.rows[1].cells[0].paragraphs[0].add_run(f"Name: {seizure.seized_from_person_name or '________________'}\nDate: {_to_ist_str()}").font.size = Pt(9)
        sig_table.rows[1].cells[1].paragraphs[0].add_run(f"Name: {officer_name}\nRank/Badge: {case.investigating_officer_rank} | {officer_badge}\nDate: {_to_ist_str()}").font.size = Pt(9)

        sig_table.rows[2].cells[0].paragraphs[0].add_run("Panch Witness 1: ___________________").font.size = Pt(9)
        sig_table.rows[2].cells[1].paragraphs[0].add_run("Panch Witness 2: ___________________").font.size = Pt(9)

        doc.add_paragraph()

        footer_p = doc.add_paragraph()
        footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _normal_run(
            footer_p,
            "Generated by CrimeGPT Electronic Evidence Vault Module. Compliant with BSA Section 63 & Rule 6 of Supreme Court Electronic Evidence Guidelines.",
            8
        )

        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf.read()

    @staticmethod
    def verify_evidence_integrity(seizure: Seizure, current_file_bytes: bytes) -> Dict[str, Any]:
        """
        Verifies whether an uploaded evidence file matches the recorded SHA-256 hash.
        Detects tampering or bit-rot in digital evidence.
        """
        computed = EvidenceVaultService.compute_hashes(current_file_bytes)
        recorded_hash = (seizure.hash_value_or_serial or "").strip().upper()
        current_hash = computed["sha256"]

        if not recorded_hash:
            return {
                "status": "NO_PREVIOUS_HASH",
                "match": False,
                "tamper_detected": False,
                "recorded_hash": None,
                "current_hash": current_hash,
                "message": "No previous hash recorded for this seizure item. You can set this as the baseline hash.",
                "computed_details": computed
            }

        is_match = recorded_hash == current_hash
        return {
            "status": "VERIFIED" if is_match else "TAMPERED",
            "match": is_match,
            "tamper_detected": not is_match,
            "recorded_hash": recorded_hash,
            "current_hash": current_hash,
            "message": (
                "✅ Cryptographic Integrity Verified: SHA-256 hash matches the baseline recorded at time of seizure."
                if is_match
                else "🚨 TAMPER ALERT: Cryptographic hash mismatch! The digital evidence has been altered or corrupted."
            ),
            "computed_details": computed
        }

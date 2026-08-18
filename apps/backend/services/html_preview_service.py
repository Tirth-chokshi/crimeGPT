"""
CrimeGPT Document HTML Preview Service
=======================================
Generates a fully-formatted, print-ready HTML version of any generated document.
The user can open this in a browser and use Ctrl+P → Save as PDF for a perfect PDF output.
No external PDF libraries required — pure HTML/CSS with @media print rules.
"""

import os
from datetime import datetime

DOCS_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated_docs")


def generate_html_preview(payload: dict) -> str:
    """
    Render a payload dict into a print-ready HTML string.
    """
    sections_text = ", ".join(
        f"{s['act']} Sec {s['section_number']} ({s['title']})"
        for s in payload.get("sections_applied", [])
    ) or "Under Investigation"

    victims_html = ""
    for v in payload.get("victims", []):
        victims_html += f"""
        <tr>
          <td><b>Complainant / Victim</b></td>
          <td>{v['name']}, S/o W/o {v['father_name']}, Age: {v['age']}, {v['gender']}</td>
        </tr>
        <tr><td>Address</td><td>{v['address']}</td></tr>
        <tr><td>Phone</td><td>{v['phone']}</td></tr>
        """

    accused_html = ""
    for i, a in enumerate(payload.get("accused", []), 1):
        pf = a.get("physical_features") or {}
        accused_html += f"""
        <tr><td><b>Accused #{i}</b></td><td>{a['name']}, S/o {a['father_name']}, Age: {a['age']}, {a['gender']}</td></tr>
        <tr><td>Address</td><td>{a['address']}</td></tr>
        <tr><td>Custody Status</td><td>{a['custody_status']}</td></tr>
        <tr><td>Arrest Date/Time</td><td>{a['arrest_date_time']}</td></tr>
        <tr><td>Identification Marks</td><td>{pf.get('identification_marks', 'N/A') if isinstance(pf, dict) else 'N/A'}</td></tr>
        """

    seizures_html = ""
    for sz in payload.get("seizures", []):
        seizures_html += f"""
        <tr>
          <td>{sz['item_name']}</td>
          <td>{sz.get('category','OTHER')}</td>
          <td>{sz.get('quantity_or_value','1 unit')}</td>
          <td>{sz.get('seized_from', 'Spot')}</td>
          <td style="font-family:monospace;font-size:10px">{sz.get('hash_or_serial','N/A')[:20]}...</td>
        </tr>
        """

    # Doc-type-specific section
    specific_html = ""
    doc_type = payload.get("doc_type", "")

    if doc_type == "PURVANI_CHARGESHEET":
        cd = payload.get("charge_details", {})
        specific_html = f"""
        <h3>3. FINAL INVESTIGATION FINDINGS &amp; CHARGESHEET OPINION</h3>
        <p>{cd.get('final_opinion', '')}</p>
        <p><b>Malkhana Status:</b> {cd.get('malkhana_deposit_status', '')}</p>
        <p><b>FSL Status:</b> {cd.get('fsl_report_status', '')}</p>
        """
    elif doc_type == "MEDICAL_LETTER":
        md = payload.get("medical_details", {})
        queries = "".join(f"<li>{q}</li>" for q in md.get("specific_queries", []))
        specific_html = f"""
        <h3>3. MEDICAL EXAMINATION MANDATE</h3>
        <p><b>To:</b> {md.get('addressed_to', '')}</p>
        <p><b>Purpose:</b> {md.get('examination_purpose', '')}</p>
        <ol>{queries}</ol>
        """
    elif doc_type == "REMAND_REQUEST":
        rd = payload.get("remand_details", {})
        grounds = "".join(f"<li>{g}</li>" for g in rd.get("grounds_for_remand", []))
        specific_html = f"""
        <h3>3. GROUNDS FOR POLICE CUSTODY REMAND (SEC 187 BNSS)</h3>
        <p><b>To:</b> {rd.get('court_name', '')}</p>
        <p><b>Remand Sought:</b> {rd.get('remand_days_sought', '')}</p>
        <ol>{grounds}</ol>
        """
    elif doc_type == "SEIZURE_RECEIPT":
        sd = payload.get("seizure_details", {})
        panch_html = "".join(
            f"<li>{p['name']} | {p['address']}</li>" for p in sd.get("panchas", [])
        )
        specific_html = f"""
        <h3>3. PANCHANAMA DETAILS</h3>
        <p><b>Independent Panchas:</b></p><ul>{panch_html}</ul>
        <p>{sd.get('videography_compliance', '')}</p>
        <p>{sd.get('hash_certificate', '')}</p>
        """
    elif doc_type == "COURT_CUSTODY_LETTER":
        cc = payload.get("custody_details", {})
        specific_html = f"""
        <h3>3. JUDICIAL CUSTODY FORWARDING MEMO</h3>
        <p><b>To:</b> {cc.get('addressed_to', '')}</p>
        <p><b>Subject:</b> {cc.get('subject', '')}</p>
        <p><b>Destination Jail:</b> {cc.get('jail_destination', '')}</p>
        """
    elif doc_type == "ACCUSED_PANCHANAMA":
        ap = payload.get("panchanama_details", {})
        panch_html = "".join(
            f"<li>{p['name']} | {p['address']}</li>" for p in ap.get("panchas", [])
        )
        specific_html = f"""
        <h3>3. BODY INSPECTION &amp; PERSONAL SEARCH</h3>
        <ul>{panch_html}</ul>
        <p>{ap.get('arrest_compliance', '')}</p>
        """
    elif doc_type == "FACE_IDENTIFICATION_FORM":
        fi = payload.get("tip_details", {})
        specific_html = f"""
        <h3>3. TIP PROTOCOL</h3>
        <p><b>To:</b> {fi.get('magistrate_requisition', '')}</p>
        <p>{fi.get('suspect_consent', '')}</p>
        """

    io = payload.get("investigating_officer", {})

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{payload.get('title','Legal Document')} — CrimeGPT</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Source Serif 4', Georgia, serif; font-size: 13px; color: #111; background: #fff; padding: 30px 40px; max-width: 900px; margin: auto; }}
  .header {{ text-align: center; border-bottom: 3px double #0a2856; padding-bottom: 16px; margin-bottom: 20px; }}
  .header .dept {{ font-size: 18px; font-weight: 700; letter-spacing: 2px; color: #0a2856; }}
  .header .station {{ font-size: 13px; font-weight: 600; color: #333; margin-top: 4px; }}
  .header .doc-title {{ font-size: 15px; font-weight: 700; text-transform: uppercase; color: #0a2856; margin-top: 12px; letter-spacing: 1px; }}
  .header .form-code {{ font-size: 11px; color: #666; font-style: italic; }}
  .meta-table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
  .meta-table td {{ padding: 6px 10px; border: 1px solid #ccc; font-size: 12px; vertical-align: top; }}
  .meta-table td:first-child {{ font-weight: 600; width: 38%; background: #f7f8fa; }}
  h3 {{ font-size: 13px; font-weight: 700; text-transform: uppercase; color: #0a2856; border-bottom: 1px solid #0a2856; padding-bottom: 4px; margin: 20px 0 12px; letter-spacing: 0.5px; }}
  .seizure-table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
  .seizure-table th {{ background: #0a2856; color: #fff; font-size: 11px; padding: 6px; text-align: left; }}
  .seizure-table td {{ border: 1px solid #ccc; padding: 6px; font-size: 11px; }}
  .sig-block {{ display: flex; justify-content: space-between; margin-top: 60px; }}
  .sig-box {{ width: 45%; }}
  .sig-line {{ border-top: 1px solid #333; margin-top: 48px; padding-top: 6px; font-size: 12px; }}
  .crimegpt-stamp {{ text-align: center; margin-top: 30px; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; }}
  ol li, ul li {{ margin-bottom: 6px; line-height: 1.6; }}
  p {{ line-height: 1.7; margin-bottom: 10px; }}
  @media print {{
    body {{ padding: 10px 20px; }}
    .no-print {{ display: none; }}
    @page {{ margin: 1.5cm; }}
  }}
</style>
</head>
<body>

<div class="no-print" style="background:#1a3a6b;color:#fff;padding:12px 20px;border-radius:6px;margin-bottom:20px;font-family:Inter,sans-serif;display:flex;justify-content:space-between;align-items:center;">
  <span>🖨️ <b>CrimeGPT Document Preview</b> — Press <kbd style="background:#fff;color:#000;padding:2px 6px;border-radius:3px;">Ctrl+P</kbd> then <b>Save as PDF</b></span>
  <button onclick="window.print()" style="background:#fff;color:#1a3a6b;border:none;padding:8px 18px;border-radius:4px;font-weight:600;cursor:pointer;">Print / Save PDF</button>
</div>

<div class="header">
  <div class="dept">GUJARAT POLICE DEPARTMENT</div>
  <div class="station">{payload.get('police_station','').upper()}, {payload.get('district','').upper()}</div>
  <div style="color:#999;font-size:12px;margin:8px 0;">{'― ' * 30}</div>
  <div class="doc-title">{payload.get('title','')}</div>
  <div class="form-code">[{payload.get('sub_title','')}] &nbsp;|&nbsp; Form Code: {payload.get('form_code','')}</div>
</div>

<table class="meta-table">
  <tr><td>FIR / Case Number</td><td>{payload.get('fir_number','')} &nbsp; (Dated: {payload.get('fir_date','')})</td></tr>
  <tr><td>Police Station / District</td><td>{payload.get('police_station','')}, {payload.get('district','')}</td></tr>
  <tr><td>Generated At</td><td>{payload.get('generated_at','')}</td></tr>
  <tr><td>Investigating Officer</td><td>{io.get('name','')} [{io.get('badge','')}], {io.get('rank','')}</td></tr>
  <tr><td>Sections of Law</td><td>{sections_text}</td></tr>
</table>

<h3>1. Details of Parties &amp; Accused</h3>
<table class="meta-table">
  {victims_html}
  {accused_html}
</table>

<h3>2. Brief Facts of the Case &amp; Incident Narrative</h3>
<p>{payload.get('incident_summary','')}</p>

{specific_html}

{"<h3>Seizures / Mudamal Inventory</h3><table class='seizure-table'><thead><tr><th>Item</th><th>Category</th><th>Qty/Value</th><th>Seized From</th><th>SHA-256 Hash</th></tr></thead><tbody>" + seizures_html + "</tbody></table>" if payload.get("seizures") else ""}

<div class="sig-block">
  <div class="sig-box">
    <div class="sig-line">
      Signature of Complainant / Panch / Accused<br>
      Date: {payload.get('date_today','')}
    </div>
  </div>
  <div class="sig-box" style="text-align:right;">
    <div class="sig-line">
      Signature &amp; Seal of Investigating Officer (IO)<br>
      <b>({io.get('name','')})</b><br>
      {io.get('rank','')}<br>
      Badge No: {io.get('badge','')}
    </div>
  </div>
</div>

<div class="crimegpt-stamp">
  Generated by CrimeGPT AI Legal Automation System &nbsp;|&nbsp; BNS / BNSS / BSA 2023 Compliant
  &nbsp;|&nbsp; {datetime.utcnow().strftime('%d-%m-%Y %H:%M HRS UTC')}
</div>

</body>
</html>"""
    return html

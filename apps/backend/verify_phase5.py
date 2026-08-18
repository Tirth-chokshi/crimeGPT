"""
verify_phase5.py
Automated Verification Suite for Phase 5:
- Statutory Compliance Clocks (/api/diary/{id}/compliance-clocks)
- Active Compliance Alerts (/api/diary/{id}/alerts)
- Case Diary Event Logging (/api/diary/{id}/event)
- BNSS Case Diary .docx Export (/api/diary/{id}/export)
"""
import requests
import json
import io

BASE_URL = "http://localhost:8000/api"

def run_phase5_verification():
    print("=" * 60)
    print("CRIMEGPT PHASE 5 VERIFICATION: BNSS CASE DIARY & COMPLIANCE CLOCKS")
    print("=" * 60)

    # Step 1: Fetch list of cases or get first case
    print("\n--- STEP 1: Fetching Active Test Case ---")
    res = requests.get(f"{BASE_URL}/cases/")
    assert res.status_code == 200, f"Failed to list cases: {res.status_code}"
    cases = res.json()
    assert len(cases) > 0, "No cases found in DB. Run seed first."
    test_case = cases[0]
    case_id = test_case["id"]
    fir_number = test_case["fir_number"]
    print(f"Target Case: {fir_number} (ID: {case_id})")

    # Step 2: Test /api/diary/{case_id}/compliance-clocks
    print("\n--- STEP 2: Testing /api/diary/{case_id}/compliance-clocks ---")
    clock_res = requests.get(f"{BASE_URL}/diary/{case_id}/compliance-clocks")
    assert clock_res.status_code == 200, f"Failed to get compliance clocks: {clock_res.status_code} {clock_res.text}"
    clock_data = clock_res.json()
    print("Compliance Clocks Response:")
    print(json.dumps(clock_data, indent=2))
    assert "per_accused_clocks" in clock_data, "Missing 'per_accused_clocks' key"
    assert "active_alerts" in clock_data, "Missing 'active_alerts' key"
    print("✅ Compliance Clocks endpoint validated.")

    # Step 3: Test /api/diary/{case_id}/alerts
    print("\n--- STEP 3: Testing /api/diary/{case_id}/alerts ---")
    alert_res = requests.get(f"{BASE_URL}/diary/{case_id}/alerts")
    assert alert_res.status_code == 200, f"Failed to get alerts: {alert_res.status_code} {alert_res.text}"
    alert_data = alert_res.json()
    print("Alerts Data:", json.dumps(alert_data, indent=2))
    assert "alerts" in alert_data, "Missing 'alerts' key"
    print("✅ Compliance Alerts endpoint validated.")

    # Step 4: Test /api/diary/{case_id}/event (Add a new investigation step)
    print("\n--- STEP 4: Testing /api/diary/{case_id}/event ---")
    new_event_payload = {
        "step_title": "Automated Phase 5 Verification Diary Step",
        "step_type": "WITNESS_EXAMINATION",
        "description": "Examined key eye-witness under Section 180 BNSS at Navrangpura circle. Video recording preserved under Sec 105 BNSS.",
        "location": "Navrangpura Police Chowki",
        "officer_name": "Inspector R. K. Jadeja",
        "officer_badge": "GJ-AHM-4421",
        "statutory_deadline_reference": "Sec 180 BNSS"
    }
    event_res = requests.post(f"{BASE_URL}/diary/{case_id}/event", json=new_event_payload)
    assert event_res.status_code == 200, f"Failed to post diary event: {event_res.status_code} {event_res.text}"
    event_data = event_res.json()
    print("Recorded Event Response:", json.dumps(event_data, indent=2))
    assert event_data["step_title"] == new_event_payload["step_title"], "Step title mismatch"
    print("✅ Case Diary Event Logging endpoint validated.")

    # Step 5: Test /api/diary/{case_id}/export (.docx download)
    print("\n--- STEP 5: Testing /api/diary/{case_id}/export (.docx) ---")
    export_res = requests.get(f"{BASE_URL}/diary/{case_id}/export")
    assert export_res.status_code == 200, f"Failed to export diary .docx: {export_res.status_code} {export_res.text}"
    content_type = export_res.headers.get("content-type", "")
    assert "openxmlformats" in content_type or "word" in content_type, f"Unexpected content-type: {content_type}"
    docx_bytes = export_res.content
    print(f"Received DOCX file ({len(docx_bytes)} bytes)")
    # Check PK zip header
    assert docx_bytes.startswith(b"PK\x03\x04"), "Exported file does not have valid DOCX ZIP header!"
    print("✅ BNSS Case Diary .docx Export verified successfully (Valid DOCX PK header).")

    print("\n" + "=" * 60)
    print("🎉 ALL PHASE 5 BACKEND INTEGRATION TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_phase5_verification()

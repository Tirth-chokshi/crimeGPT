"""
verify_phase6.py
Automated Verification Suite for Phase 6:
- Cryptographic SHA-256 / MD5 evidence hashing (/api/evidence/{id}/compute-hash)
- Section 63 BSA Digital Evidence Certificate generation (/api/evidence/{id}/certificate)
- Malkhana Evidence QR Code generation (/api/evidence/{id}/qr)
- Tamper Detection / Bitstream match verification (/api/evidence/{id}/verify-hash)
- Mock CCTNS National Registry sync (/api/sync/cctns/{id})
- Mock e-Sakshya Digital Repository sync (/api/sync/esakshya/{id})
- Sync Audit Trail status (/api/sync/{id}/status)
"""
import requests
import json
import io

BASE_URL = "http://localhost:8000/api"

def run_phase6_verification():
    print("=" * 70)
    print("CRIMEGPT PHASE 6 VERIFICATION: BSA EVIDENCE VAULT & CCTNS/ICJS SYNC")
    print("=" * 70)

    # Step 1: Fetch active test case
    print("\n--- STEP 1: Fetching Test Case & Seizure Items ---")
    res = requests.get(f"{BASE_URL}/cases/")
    assert res.status_code == 200, f"Failed to list cases: {res.status_code}"
    cases = res.json()
    assert len(cases) > 0, "No cases found in DB."
    test_case = cases[0]
    case_id = test_case["id"]
    fir_number = test_case["fir_number"]
    print(f"Target Case: {fir_number} (ID: {case_id})")

    # Fetch full case details to get seizures
    case_detail_res = requests.get(f"{BASE_URL}/cases/{case_id}")
    assert case_detail_res.status_code == 200
    case_detail = case_detail_res.json()
    seizures = case_detail.get("seizures", [])
    assert len(seizures) > 0, "No seizures found on test case."
    test_seizure = seizures[0]
    seizure_id = test_seizure["id"]
    print(f"Target Seizure: '{test_seizure['item_name']}' (ID: {seizure_id})")

    # Step 2: Test /api/evidence/{seizure_id}/compute-hash
    print("\n--- STEP 2: Testing /api/evidence/{seizure_id}/compute-hash ---")
    sample_content = b"CrimeGPT Digital Forensics Sample CCTV Footage Stream 2026-08-19"
    files = {"file": ("cctv_ch4_dump.mp4", sample_content, "video/mp4")}
    data = {"officer_name": "Inspector R. K. Jadeja", "officer_badge": "GJ-AHM-4421"}

    hash_res = requests.post(f"{BASE_URL}/evidence/{seizure_id}/compute-hash", files=files, data=data)
    assert hash_res.status_code == 200, f"Failed to compute hash: {hash_res.status_code} {hash_res.text}"
    hash_data = hash_res.json()
    print("Hash Response:", json.dumps(hash_data, indent=2))
    assert len(hash_data["sha256"]) == 64, f"Invalid SHA-256 length: {len(hash_data['sha256'])}"
    assert len(hash_data["md5"]) == 32, f"Invalid MD5 length: {len(hash_data['md5'])}"
    recorded_sha256 = hash_data["sha256"]
    print("✅ Cryptographic SHA-256 & MD5 evidence hashing validated.")

    # Step 3: Test /api/evidence/{seizure_id}/certificate (BSA Section 63 .docx)
    print("\n--- STEP 3: Testing /api/evidence/{seizure_id}/certificate (BSA Sec 63 .docx) ---")
    cert_res = requests.get(f"{BASE_URL}/evidence/{seizure_id}/certificate")
    assert cert_res.status_code == 200, f"Failed to get certificate: {cert_res.status_code} {cert_res.text}"
    content_type = cert_res.headers.get("content-type", "")
    assert "openxmlformats" in content_type or "word" in content_type
    docx_bytes = cert_res.content
    print(f"Received Certificate DOCX ({len(docx_bytes)} bytes)")
    assert docx_bytes.startswith(b"PK\x03\x04"), "Certificate is not a valid DOCX zip archive!"
    print("✅ BSA Section 63 Digital Evidence Certificate .docx verified.")

    # Step 4: Test /api/evidence/{seizure_id}/qr (Malkhana QR Code PNG)
    print("\n--- STEP 4: Testing /api/evidence/{seizure_id}/qr (Malkhana QR Code) ---")
    qr_res = requests.get(f"{BASE_URL}/evidence/{seizure_id}/qr")
    assert qr_res.status_code == 200, f"Failed to get QR code: {qr_res.status_code}"
    assert qr_res.headers.get("content-type") == "image/png"
    qr_bytes = qr_res.content
    print(f"Received QR Image ({len(qr_bytes)} bytes)")
    assert qr_bytes.startswith(b"\x89PNG\r\n\x1a\n"), "QR is not a valid PNG image!"
    print("✅ Malkhana QR Code PNG generator verified.")

    # Step 5: Test /api/evidence/{seizure_id}/verify-hash (Tamper Detection)
    print("\n--- STEP 5: Testing /api/evidence/{seizure_id}/verify-hash (Tamper Detection) ---")
    # Test A: Unmodified file (should match)
    good_files = {"file": ("cctv_ch4_dump.mp4", sample_content, "video/mp4")}
    verify_good_res = requests.post(f"{BASE_URL}/evidence/{seizure_id}/verify-hash", files=good_files)
    assert verify_good_res.status_code == 200
    good_result = verify_good_res.json()
    print("Good File Verification:", json.dumps(good_result, indent=2))
    assert good_result["match"] is True
    assert good_result["status"] == "VERIFIED"
    assert good_result["tamper_detected"] is False

    # Test B: Altered file (should detect tampering)
    tampered_content = b"CrimeGPT Tampered File Content With Altered Bitstream"
    tampered_files = {"file": ("cctv_ch4_dump.mp4", tampered_content, "video/mp4")}
    verify_bad_res = requests.post(f"{BASE_URL}/evidence/{seizure_id}/verify-hash", files=tampered_files)
    assert verify_bad_res.status_code == 200
    bad_result = verify_bad_res.json()
    print("Tampered File Verification:", json.dumps(bad_result, indent=2))
    assert bad_result["match"] is False
    assert bad_result["status"] == "TAMPERED"
    assert bad_result["tamper_detected"] is True
    print("✅ Tamper Detection & Bitstream integrity verification validated.")

    # Step 6: Test /api/sync/cctns/{case_id}
    print("\n--- STEP 6: Testing /api/sync/cctns/{case_id} (CCTNS / ICJS Mock Sync) ---")
    cctns_res = requests.post(f"{BASE_URL}/sync/cctns/{case_id}")
    assert cctns_res.status_code == 200, f"Failed to sync to CCTNS: {cctns_res.status_code} {cctns_res.text}"
    cctns_data = cctns_res.json()
    print("CCTNS Sync Response:", json.dumps(cctns_data, indent=2))
    assert cctns_data["success"] is True
    assert "cctns_ack_no" in cctns_data
    assert "icjs_transaction_token" in cctns_data
    print("✅ CCTNS CAS / ICJS Interoperability Gateway Sync validated.")

    # Step 7: Test /api/sync/esakshya/{seizure_id}
    print("\n--- STEP 7: Testing /api/sync/esakshya/{seizure_id} (e-Sakshya Evidence Vault Sync) ---")
    esakshya_res = requests.post(f"{BASE_URL}/sync/esakshya/{seizure_id}")
    assert esakshya_res.status_code == 200, f"Failed to sync to e-Sakshya: {esakshya_res.status_code} {esakshya_res.text}"
    esakshya_data = esakshya_res.json()
    print("e-Sakshya Sync Response:", json.dumps(esakshya_data, indent=2))
    assert esakshya_data["success"] is True
    assert "esakshya_reg_no" in esakshya_data
    assert "vault_uri" in esakshya_data
    print("✅ e-Sakshya Digital Evidence Vault Registration validated.")

    # Step 8: Test /api/sync/{case_id}/status
    print("\n--- STEP 8: Testing /api/sync/{case_id}/status (Sync Audit History) ---")
    status_res = requests.get(f"{BASE_URL}/sync/{case_id}/status")
    assert status_res.status_code == 200, f"Failed to get sync status: {status_res.status_code}"
    status_data = status_res.json()
    print("Sync Status & Audit Trail:", json.dumps(status_data, indent=2))
    assert status_data["cctns_synced"] is True
    assert status_data["esakshya_registered_count"] >= 1
    assert len(status_data["history"]) >= 2
    print("✅ Sync Audit Trail and Status reporting validated.")

    print("\n" + "=" * 70)
    print("🎉 ALL PHASE 6 BACKEND INTEGRATION TESTS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_phase6_verification()

import urllib.request
import json

def test_api():
    base = "http://localhost:8000/api"
    
    # 1. Health
    res = urllib.request.urlopen(f"{base}/health")
    print("1. Health Check:", res.read().decode())
    
    # 2. List cases
    res = urllib.request.urlopen(f"{base}/cases/")
    cases = json.loads(res.read().decode())
    print(f"2. Loaded {len(cases)} cases. First case FIR: {cases[0]['fir_number']}")
    case_id = cases[0]["id"]
    
    # 3. Test Legal Intel
    data = json.dumps({
        "narrative": "Accused threatened complainant with knife and snatched gold chain on road.",
        "language": "en"
    }).encode("utf-8")
    req = urllib.request.Request(f"{base}/legal-intel/suggest", data=data, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    intel = json.loads(res.read().decode())
    suggested = [f"{s['act']} {s['section_number']}" for s in intel["bns_sections"]]
    print(f"3. Legal Intel Sections Suggested: {suggested}")
    
    # 4. Generate all 7 documents
    doc_types = [
        "PURVANI_CHARGESHEET", 
        "MEDICAL_LETTER", 
        "REMAND_REQUEST", 
        "SEIZURE_RECEIPT", 
        "COURT_CUSTODY_LETTER", 
        "ACCUSED_PANCHANAMA", 
        "FACE_IDENTIFICATION_FORM"
    ]
    print("4. Generating all 7 legal documents...")
    for dt in doc_types:
        d_data = json.dumps({"doc_type": dt, "language": "en"}).encode("utf-8")
        d_req = urllib.request.Request(
            f"{base}/documents/generate/{case_id}?officer_name=Inspector%20Jadeja",
            data=d_data,
            headers={"Content-Type": "application/json"}
        )
        d_res = urllib.request.urlopen(d_req)
        d_json = json.loads(d_res.read().decode())
        print(f"   [OK] {dt}: {d_json['file_name']} (Status: {d_json['status']})")
        
    # 5. Check Case Diary & BNSS timeline
    res = urllib.request.urlopen(f"{base}/diary/{case_id}")
    diary = json.loads(res.read().decode())
    print(f"5. Case Diary Events Count: {len(diary['events'])}")
    print(f"   BNSS Clocks: {diary['bnss_compliance_clocks']['days_remaining_for_chargesheet']} days remaining for chargesheet")

    # 6. Global Search
    res = urllib.request.urlopen(f"{base}/search/?q=robbery")
    search_res = json.loads(res.read().decode())
    print(f"6. Global Search Results Count: {search_res['results_count']}")
    print("\nALL BACKEND & SYSTEM VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()

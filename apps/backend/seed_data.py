from datetime import datetime, timedelta
from database import SessionLocal, init_db
from models import Case, Person, CaseSection, Seizure, CaseDiaryEvent, GeneratedDocument, AuditLog
from services.document_service import DocumentService

def seed_database():
    init_db()
    db = SessionLocal()

    # Check if cases already exist
    if db.query(Case).count() > 0:
        db.close()
        return

    print("Seeding CrimeGPT database with realistic police cases...")

    # Case 1: Armed Robbery and Snatching at CG Road, Ahmedabad
    fir_date_1 = datetime.utcnow() - timedelta(days=4)
    case1 = Case(
        fir_number="FIR-0089/2026",
        police_station="Navrangpura Police Station, Ahmedabad",
        district="Ahmedabad City",
        state="Gujarat",
        fir_date=fir_date_1,
        incident_date_time="13-08-2026 at 21:45 HRS",
        incident_place="Near Municipal Market, CG Road, Navrangpura, Ahmedabad",
        incident_summary=(
            "Complainant Smt. Meenaben Patel was returning from CG Road market on her two-wheeler when two unidentified men "
            "on a black motorcycle intercepted her. The pillion rider wielded a sharp knife, threatened to kill her, and forcibly "
            "snatched her 22-karat gold chain weighing 24 grams and an iPhone 15 Pro, causing lacerations on her neck before fleeing."
        ),
        incident_summary_original="ફરિયાદી મીનાબેન પટેલ સી.જી. રોડ પરથી ઘરે જઈ રહ્યા હતા ત્યારે મોટરસાયકલ પર આવેલા બે અજાણ્યા શખ્સોએ ચપ્પુ બતાવી સોનાની ચેઇન અને મોબાઇલ લૂંટી લીધા.",
        original_language="gu",
        status="REMAND_GRANTED",
        investigating_officer_name="Inspector R. K. Jadeja",
        investigating_officer_badge="GJ-AHM-4421",
        investigating_officer_rank="Police Inspector (IO)"
    )
    db.add(case1)
    db.flush()

    # Persons for Case 1
    v1 = Person(
        case_id=case1.id,
        person_type="VICTIM",
        name="Smt. Meenaben Pravinchandra Patel",
        father_or_husband_name="Pravinchandra Patel",
        age=44,
        gender="Female",
        phone="+91 98250 11234",
        aadhaar_or_id="XXXX-XXXX-8921",
        address="Flat 402, Shivalik Heights, Navrangpura, Ahmedabad",
        occupation="School Teacher",
        role_description="Complainant / Victim whose gold ornament and mobile were snatched at knife-point.",
        statement="Detailed statement recorded under Section 180 BNSS. Identified motorcycle color and physical build of accused.",
        medical_examination_status="COMPLETED"
    )
    a1 = Person(
        case_id=case1.id,
        person_type="ACCUSED",
        name="Vikram alias Vicky Shantilal Solanki",
        father_or_husband_name="Shantilal Solanki",
        age=27,
        gender="Male",
        phone="+91 97120 44590",
        aadhaar_or_id="XXXX-XXXX-3341",
        address="Chawl No. 12, Near Gomtipur Railway Crossing, Ahmedabad",
        occupation="Unemployed / History Sheeter",
        role_description="Pillion rider who threatened victim with sharp knife and snatched the gold chain.",
        statement="Confessed during interrogation under Section 23 BSA. Disclosed location where snatched gold chain and knife were concealed.",
        arrest_date_time="14-08-2026 14:30 HRS",
        custody_status="POLICE_CUSTODY",
        physical_features={
            "height": "5 ft 9 in",
            "complexion": "Dark",
            "build": "Athletic / Lean",
            "identification_marks": "Linear surgical scar 3 inches long on right forearm, cross tattoo on left wrist"
        },
        medical_examination_status="COMPLETED"
    )
    w1 = Person(
        case_id=case1.id,
        person_type="WITNESS",
        name="Rakeshbhai Jayantilal Dave",
        father_or_husband_name="Jayantilal Dave",
        age=39,
        gender="Male",
        phone="+91 94260 88219",
        address="Shop No. 7, CG Road Complex, Ahmedabad",
        occupation="Tea Stall Owner",
        role_description="Eye witness who heard screams and saw black pulsar motorcycle speeding towards Stadium circle.",
        statement="Corroborated time and direction of accused fleeing."
    )
    db.add_all([v1, a1, w1])

    # Sections for Case 1
    s1 = CaseSection(
        case_id=case1.id,
        act="BNS",
        section_number="309(4)",
        section_title="Robbery (Voluntarily Causing Hurt/Fear of Death)",
        ipc_crpc_equivalent="Section 392 IPC",
        is_ai_recommended=True,
        ai_confidence=0.96,
        ai_rationale="Incident facts show theft accomplished by threatening victim with deadly knife and causing injury.",
        status="ACCEPTED"
    )
    s2 = CaseSection(
        case_id=case1.id,
        act="BNS",
        section_number="304(1)",
        section_title="Snatching (Forcible seizure of movable property)",
        ipc_crpc_equivalent="Newly codified under BNS",
        is_ai_recommended=True,
        ai_confidence=0.94,
        ai_rationale="Physical snatching of gold chain from victim's neck while riding two-wheeler.",
        status="ACCEPTED"
    )
    s3 = CaseSection(
        case_id=case1.id,
        act="BNS",
        section_number="118(1)",
        section_title="Voluntarily Causing Hurt by Dangerous Weapons",
        ipc_crpc_equivalent="Section 324 IPC",
        is_ai_recommended=True,
        ai_confidence=0.88,
        ai_rationale="Sharp weapon (knife) used to intimidate and inflict neck abrasions.",
        status="ACCEPTED"
    )
    db.add_all([s1, s2, s3])

    # Seizures for Case 1
    sz1 = Seizure(
        case_id=case1.id,
        item_name="24K Yellow Gold Chain (Weight: 23.8 grams)",
        category="CASH_OR_VALUABLE",
        description="Twisted link gold chain with minor hook damage, recovered from hidden attic in accused residence.",
        quantity_or_value="Rs. 1,75,000/-",
        seized_from_person_name="Vikram alias Vicky Solanki",
        seizure_place="Chawl No. 12, Gomtipur, Ahmedabad",
        seizure_date_time="15-08-2026 11:00 HRS",
        hash_value_or_serial="SHA256: 8a7c9f...e421",
        videography_ref_id="VID-BNSS-105-AHM-091",
        storage_location="Malkhana Locker Rack #A1"
    )
    sz2 = Seizure(
        case_id=case1.id,
        item_name="Single-edged Steel Rampuri Knife (6 inch blade)",
        category="WEAPON",
        description="Sharp folding knife used during commission of crime to threaten victim.",
        quantity_or_value="Weapon of Offence",
        seized_from_person_name="Vikram alias Vicky Solanki",
        seizure_place="Underneath brick pile, Gomtipur",
        seizure_date_time="15-08-2026 11:30 HRS",
        hash_value_or_serial="SHA256: 3b1e2a...77cd",
        videography_ref_id="VID-BNSS-105-AHM-092",
        storage_location="Malkhana Weapon Rack #W3"
    )
    db.add_all([sz1, sz2])

    # Diary Events for Case 1
    d1 = CaseDiaryEvent(
        case_id=case1.id,
        event_timestamp=fir_date_1,
        step_title="Registration of FIR & Crime Scene Inspection",
        step_type="FIR",
        location="Navrangpura Police Station & CG Road",
        description="Registered FIR-0089/2026 under Section 173 BNSS. IO along with team visited spot on CG Road, recorded spot panchanama, and collected CCTV footage from municipal cameras.",
        officer_name="Inspector R. K. Jadeja",
        statutory_deadline_reference="Section 173 BNSS: Immediate FIR Registration & Free Copy Furnished"
    )
    d2 = CaseDiaryEvent(
        case_id=case1.id,
        event_timestamp=fir_date_1 + timedelta(hours=18),
        step_title="Apprehension and Arrest of Accused",
        step_type="ARREST",
        location="Gomtipur Naka, Ahmedabad",
        description="Accused Vikram Solanki intercepted on basis of motorcycle registration number. Arrest memo prepared as per D.K. Basu guidelines. Family intimation given to brother.",
        officer_name="Inspector R. K. Jadeja",
        statutory_deadline_reference="Section 35 BNSS & D.K. Basu Supreme Court Guidelines"
    )
    d3 = CaseDiaryEvent(
        case_id=case1.id,
        event_timestamp=fir_date_1 + timedelta(hours=22),
        step_title="Mandatory Medico-Legal Examination (Sec 53 BNSS)",
        step_type="MEDICAL_EXAM",
        location="Civil Hospital, Ahmedabad",
        description="Accused examined by Medical Officer Dr. K. M. Joshi. Certificate of physical fitness obtained prior to Magistrate production. No custodial trauma observed.",
        officer_name="Inspector R. K. Jadeja",
        statutory_deadline_reference="Section 53 BNSS: Mandatory Medical Examination within 24 Hours"
    )
    d4 = CaseDiaryEvent(
        case_id=case1.id,
        event_timestamp=fir_date_1 + timedelta(hours=23),
        step_title="Production before Judicial Magistrate & 5 Days Remand Granted",
        step_type="REMAND_PRODUCED",
        location="Hon'ble 4th ACJM Court, Ahmedabad",
        description="Produced within 24 hours of arrest. Remand application submitted under Sec 187 BNSS. Hon'ble Court granted 5 days police custody remand till 19-08-2026 for mudamal recovery.",
        officer_name="Inspector R. K. Jadeja",
        statutory_deadline_reference="Section 187 BNSS: 24-Hour Production Mandate Complied"
    )
    d5 = CaseDiaryEvent(
        case_id=case1.id,
        event_timestamp=fir_date_1 + timedelta(days=2),
        step_title="Recovery of Stolen Gold Chain & Weapon under Sec 23 BSA",
        step_type="SEIZURE",
        location="Gomtipur Chawl, Ahmedabad",
        description="Pursuant to voluntary disclosure statement of accused, gold chain and knife recovered in presence of 2 independent panchas. Video recorded under Sec 105 BNSS.",
        officer_name="Inspector R. K. Jadeja",
        statutory_deadline_reference="Section 105 BNSS (Mandatory Videography) & Sec 23 BSA (Recovery)"
    )
    db.add_all([d1, d2, d3, d4, d5])

    # Case 2: Investment Cyber Fraud / Cheating
    fir_date_2 = datetime.utcnow() - timedelta(days=12)
    case2 = Case(
        fir_number="FIR-0074/2026",
        police_station="Cyber Crime Police Station, Ahmedabad",
        district="Ahmedabad City",
        state="Gujarat",
        fir_date=fir_date_2,
        incident_date_time="02-08-2026 to 05-08-2026",
        incident_place="Online / Cyber Space & Banking Channels",
        incident_summary=(
            "Complainant Shri Ankit Sharma was duped of Rs. 14,50,000/- by cyber fraudsters posing as institutional stock market "
            "trading advisors on Telegram and WhatsApp. Victim was induced to transfer money into multiple mule bank accounts "
            "on the false promise of 400% guaranteed returns with fabricated digital trading certificates."
        ),
        original_language="en",
        status="INVESTIGATION",
        investigating_officer_name="Inspector R. K. Jadeja",
        investigating_officer_badge="GJ-AHM-4421",
        investigating_officer_rank="Cyber Cell IO"
    )
    db.add(case2)
    db.flush()

    v2 = Person(
        case_id=case2.id,
        person_type="VICTIM",
        name="Shri Ankit V. Sharma",
        father_or_husband_name="Vijay Sharma",
        age=36,
        gender="Male",
        phone="+91 98980 55432",
        aadhaar_or_id="XXXX-XXXX-1902",
        address="102 Riviera Greens, SG Highway, Ahmedabad",
        occupation="Software Architect",
        role_description="Victim cheated of Rs 14.5 Lakhs through bogus trading platform.",
        statement="Provided bank account statements, transaction UTR numbers, and WhatsApp chat exports."
    )
    a2 = Person(
        case_id=case2.id,
        person_type="ACCUSED",
        name="Sameer alias Kabir Mohammed Ansari",
        father_or_husband_name="Mohammed Ansari",
        age=31,
        gender="Male",
        phone="+91 70112 99881",
        address="House 44, Jamia Nagar, New Delhi",
        occupation="Mule Account Provider",
        role_description="Account holder and beneficiary of mule bank account in ICICI Bank.",
        custody_status="NOTICE_SERVED",
        physical_features={"height": "5 ft 11 in", "complexion": "Fair", "build": "Medium"}
    )
    db.add_all([v2, a2])

    s_c1 = CaseSection(
        case_id=case2.id,
        act="BNS",
        section_number="318(4)",
        section_title="Cheating and Dishonestly Inducing Delivery of Property",
        ipc_crpc_equivalent="Section 420 IPC",
        is_ai_recommended=True,
        ai_confidence=0.98,
        ai_rationale="Dishonest inducement causing victim to transfer Rs 14.5 Lakhs into fraudulent accounts.",
        status="ACCEPTED"
    )
    s_c2 = CaseSection(
        case_id=case2.id,
        act="BNS",
        section_number="336(3)",
        section_title="Forgery for Purpose of Cheating",
        ipc_crpc_equivalent="Section 468 IPC",
        is_ai_recommended=True,
        ai_confidence=0.92,
        ai_rationale="Creation of fabricated digital trading profit statements and fake SEBI certificates.",
        status="ACCEPTED"
    )
    s_c3 = CaseSection(
        case_id=case2.id,
        act="BNS",
        section_number="61(2)",
        section_title="Criminal Conspiracy",
        ipc_crpc_equivalent="Section 120B IPC",
        is_ai_recommended=True,
        ai_confidence=0.85,
        ai_rationale="Organized network of mule account providers and syndicate operators conspiring together.",
        status="ACCEPTED"
    )
    db.add_all([s_c1, s_c2, s_c3])

    sz_cyber = Seizure(
        case_id=case2.id,
        item_name="OnePlus 11 5G Smartphone & 2 SIM Cards",
        category="ELECTRONIC_DEVICE",
        description="Mobile device used for managing mule bank account and OTP forwarding.",
        quantity_or_value="Device Value Rs 55,000/-",
        seized_from_person_name="Sameer Ansari",
        seizure_place="Delhi Airport Transit",
        seizure_date_time="08-08-2026 16:00 HRS",
        hash_value_or_serial="SHA256: 4e99f1...001b",
        videography_ref_id="VID-BNSS-105-CYBER-12",
        storage_location="Cyber Forensics Locker #C1"
    )
    db.add(sz_cyber)

    d_c1 = CaseDiaryEvent(
        case_id=case2.id,
        event_timestamp=fir_date_2,
        step_title="Registration of Cyber Crime FIR & Notice to Banks",
        step_type="FIR",
        location="Cyber Crime PS, Ahmedabad",
        description="FIR registered under Sec 173 BNSS. Urgent freeze requests under Section 106 BNSS dispatched to 4 beneficiary banks; Rs 4.2 Lakhs lien marked.",
        officer_name="Inspector R. K. Jadeja",
        statutory_deadline_reference="Section 173 BNSS"
    )
    d_c2 = CaseDiaryEvent(
        case_id=case2.id,
        event_timestamp=fir_date_2 + timedelta(days=3),
        step_title="Service of Notice under Section 35(3) BNSS",
        step_type="WITNESS_EXAMINATION",
        location="Cyber Cell Office",
        description="Notice of Appearance under Section 35(3) BNSS served upon account holder in compliance with Arnesh Kumar / Satender Kumar Antil guidelines.",
        officer_name="Inspector R. K. Jadeja",
        statutory_deadline_reference="Section 35(3) BNSS (Arnesh Kumar Compliance)"
    )
    db.add_all([d_c1, d_c2])

    # Pre-generate 2 initial official documents for Case 1
    p1 = DocumentService.prepare_document_payload(case1, "REMAND_REQUEST")
    f1 = DocumentService.generate_docx(p1)
    doc1 = GeneratedDocument(
        case_id=case1.id,
        doc_type="REMAND_REQUEST",
        title="Police Custody Remand Application",
        language="en",
        status="FINAL",
        structured_content=p1,
        file_name=f1,
        generated_by_officer="Inspector R. K. Jadeja"
    )

    p2 = DocumentService.prepare_document_payload(case1, "SEIZURE_RECEIPT")
    f2 = DocumentService.generate_docx(p2)
    doc2 = GeneratedDocument(
        case_id=case1.id,
        doc_type="SEIZURE_RECEIPT",
        title="Seizure Receipt & Mudamal Panchanama",
        language="en",
        status="FINAL",
        structured_content=p2,
        file_name=f2,
        generated_by_officer="Inspector R. K. Jadeja"
    )
    db.add_all([doc1, doc2])

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()

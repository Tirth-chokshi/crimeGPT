# CrimeGPT

AI‑powered automation for Indian crime documentation and legal intelligence under BNS, BNSS, and BSA.

CrimeGPT helps law enforcement officers in India generate structured crime‑related documents, maintain
a BNSS‑compliant case diary from FIR to arrest and chargesheet, and receive grounded suggestions of
relevant legal sections and landmark judgments from Indian law.

## Why this project?

India has overhauled its criminal codes: the Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha
Sanhita (BNSS), and Bharatiya Sakshya Act (BSA) have replaced IPC, CrPC and the Evidence Act and are
now in force nationwide.[cite:20] Police officers must adapt documentation and procedure to these codes
while managing high workload and redundant data entry across FIRs, remand requests, seizure memos,
custody letters, and charge‑sheets.

CrimeGPT aims to:

- Reduce duplicate data entry by keeping a **single shared case data pool** and generating multiple
  documents from it.[cite:51][cite:108]
- Encode **BNSS timelines and custody caps** directly into workflows so case diaries and remand
  requests respect statutory deadlines.[cite:14][cite:20]
- Use **Retrieval‑Augmented Generation (RAG)** over Indian legal corpora (InLegalBERT + NyayaRAG‑style
  pipeline) to suggest relevant sections and judgments without hallucination.[cite:9][cite:13][cite:19][cite:81][cite:85][cite:84]
- Support **Gujarati/Hindi/English** input via IndicTrans2 and OCR/ASR, reflecting actual police
  station realities.[cite:22][cite:30][cite:33][cite:32][cite:38]

The project is research‑grade (you can publish on legal NLP, document automation, and BNSS compliance)
and deployable (modular backend, Docassemble document engine, and a React officer UI).

---

## Features

- Unified case data model: victims, accused, witnesses, seizures, sections, events.
- Auto‑generated documents (via Docassemble):
  - Chargesheet
  - Remand request (police/judicial custody)
  - Seizure receipt
  - Medical treatment letter
  - Court custody letter
  - Accused panchanama
  - Face identification form[cite:51][cite:68][cite:69]
- Case diary as a **BNSS‑aligned state machine** from complaint to chargesheet, with deadline tracking.[cite:14][cite:20]
- Legal intelligence:
  - InLegalBERT embeddings over statutes and judgments.[cite:9][cite:13][cite:19][cite:71]
  - NyayaRAG‑style RAG pipeline combining facts + statutes + precedents.[cite:81][cite:85][cite:84][cite:91]
- Multilingual IO:
  - IndicTrans2 for Gujarati/Hindi/English translation.[cite:22][cite:30][cite:33][cite:34][cite:39]
  - Optional Indic ASR and PaddleOCR for speech and scanned police forms.[cite:32][cite:36][cite:38][cite:41][cite:39]
- Search & audit:
  - Full‑text and semantic search over cases and diary.
  - Append‑only audit log for all edits and legal‑intel choices.

---

## Architecture overview

This repository follows a monorepo structure:

```text
crimegpt/
├── apps/
│   ├── backend/        # FastAPI/Django API (case DB, RAG, diary, auth)
│   ├── frontend/       # React officer UI
│   └── docassemble/    # Docassemble package (interviews + templates)
├── packages/
│   ├── legal-intel/    # InLegalBERT + RAG over statutes/judgments
│   ├── nlp-io/         # IndicTrans2, ASR, OCR adapters
│   ├── data-pipelines/ # Bare acts, judgments, IPC→BNS crosswalk ingestion
│   └── shared/         # Shared types, utilities
├── docs/
│   ├── architecture.md
│   ├── legal-baseline.md
│   ├── evaluation.md
│   └── setup-deployment.md
├── datasets/           # Configs/scripts for public corpora (no sensitive data)
├── docker/             # Docker Compose, env samples
├── .github/workflows/  # CI for lint/test/build
└── README.md
```

Key components:

- **Backend (apps/backend)**  
  - PostgreSQL + pgvector schema for cases, persons, sections, seizures, documents, diary events,
    legal chunks, and audit log.  
  - REST APIs for case management, document generation, legal‑intel suggestions, diary, search.  
  - Integrates Keycloak for IO/SHO/Legal Advisor roles.

- **Docassemble (apps/docassemble)**  
  - YAML interviews and DOCX templates for each document type.  
  - Headless API session that takes a case JSON and returns rendered DOCX/PDF.[cite:51][cite:68][cite:103][cite:108]

- **Legal‑intel (packages/legal-intel)**  
  - Preprocessing scripts for BNS/BNSS/BSA + IPC/CrPC/Evidence Act sections.[cite:14][cite:20]  
  - InLegalBERT embedding pipeline to populate `legal_chunks`.[cite:9][cite:13][cite:19][cite:71]  
  - NyayaRAG‑style RAG API that returns candidate sections and judgments with explanations.[cite:81][cite:85][cite:84][cite:91][cite:94]

- **NLP IO (packages/nlp-io)**  
  - IndicTrans2 translation services.[cite:22][cite:30][cite:33][cite:34]  
  - Optional ASR integration (IndicConformer/IndicWhisper, Bhashini adapters).[cite:39][cite:31][cite:43]  
  - PaddleOCR integration for scanned police forms.[cite:32][cite:36][cite:38][cite:41]

---

## Getting started

### Prerequisites

- Git and Docker
- Python 3.10+ and Node.js (if you develop outside Docker)
- PostgreSQL 15+ with pgvector extension enabled[cite:9]
- Optional: Keycloak for auth, a running Docassemble instance

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/crimegpt.git
cd crimegpt
```

### 2. Configure environment

Create a `.env` file or copy `docker/.env.example`:

- `DATABASE_URL` – Postgres connection string
- `PGVECTOR_ENABLED` – `true`
- `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` – if using Keycloak
- `DOCASSEMBLE_URL` – base URL for Docassemble API
- `HF_TOKEN` – Hugging Face token (for InLegalBERT if required)[cite:13][cite:71]
- `INDICTRANS_MODEL_PATH` – local path or HF model id for IndicTrans2[cite:30][cite:33]
- `PADDLEOCR_CONFIG` – PaddleOCR model configuration[cite:32][cite:36]

### 3. Bring up core services with Docker

```bash
docker compose up -d
```

A typical `docker-compose.yml` will start:

- Postgres (with pgvector)
- Backend API
- Frontend app
- Docassemble (if bundled) or connect to an external instance[cite:103][cite:108]

### 4. Initialize database and corpus

From `apps/backend`:

```bash
poetry install  # or pip install -r requirements.txt
python -m crimegpt_backend.init_db      # create tables
python -m crimegpt_backend.load_corpus  # ingest BNS/BNSS/BSA + crosswalks
python -m crimegpt_backend.embed_legal  # run InLegalBERT embeddings
```

These scripts:

- Create the core schema.  
- Ingest bare acts and IPC→BNS crosswalk data from `packages/data-pipelines`.[cite:93][cite:83][cite:87][cite:90]  
- Populate `legal_chunks` with InLegalBERT embeddings.[cite:9][cite:13][cite:19][cite:71]

### 5. Open the UI

Visit:

- Backend: `http://localhost:8000/docs` (API docs).  
- Frontend: `http://localhost:3000` (officer interface).

You should be able to:

- Create a test case with basic FIR details.  
- Request legal‑intel suggestions for the case.  
- Generate at least one document (e.g., seizure receipt) via Docassemble.

---

## Usage: typical workflow

1. Officer logs in (IO/SHO/Legal Advisor).  
2. Officer creates a case:
   - Enters narrative in Gujarati/Hindi/English.  
   - CrimeGPT normalizes and translates as needed via IndicTrans2.[cite:22][cite:30][cite:33][cite:39]  
   - Case saved with shared entities (victims, accused, sections, seizures).

3. Officer triggers “Suggest sections and judgments”:
   - Backend runs NyayaRAG‑style RAG over InLegalBERT embeddings.[cite:81][cite:85][cite:84][cite:9][cite:13][cite:19]  
   - UI shows candidate sections (BNS/BNSS/BSA) and judgments with citations.  
   - Officer accepts/edits; selections are stored and logged.

4. Officer generates documents:
   - Chargesheet, remand request, etc. via Docassemble interviews.  
   - Documents use the shared case data and include BNSS‑compliant clauses and timing.[cite:51][cite:68][cite:103][cite:108]

5. Case diary:
   - Case diary events auto‑log FIR registration, arrests, remand hearings, seizures, document generation.  
   - BNSS deadlines are tracked and shown in the UI.[cite:14][cite:20]

---

## Documentation

- `docs/architecture.md` – full module‑level architecture, data flows.  
- `docs/legal-baseline.md` – explains IPC/CrPC/Evidence Act vs BNS/BNSS/BSA and section mapping.  
- `docs/evaluation.md` – metrics and scripts for legal‑intel, MT/ASR/OCR, and BNSS compliance.  
- `docs/setup-deployment.md` – detailed installation and deployment instructions.

---

## Roadmap

- Phase 0–2: DB + legal‑intel + 4 core Docassemble documents.  
- Phase 3–4: Multilingual IO (IndicTrans2, ASR, OCR).  
- Phase 5: BNSS case diary analytics.  
- Phase 6–7: ICJS/e‑Sakshya mock integration and NIC‑style alignment.[cite:89][cite:82]

---

## Contributing

Contributions are welcome. Please:

- Open an issue describing proposed changes.  
- Follow code style and testing guidelines in `CONTRIBUTING.md` (to be added).  
- Respect data‑privacy and licensing constraints on legal texts and models.

---

## License

To be decided. For now, treat CrimeGPT as **research and prototype software**; do not deploy it in production without appropriate legal and security review.

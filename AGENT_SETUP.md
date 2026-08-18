# 🤖 CrimeGPT – AI Agent Automated Installation & Setup Guide

> **System Prompt for AI Assistants (Antigravity, Claude Code, Cursor, Windsurf, Copilot, ChatGPT)**:  
> When given this file or instructed to *"Set up CrimeGPT on this machine"*, follow the steps below sequentially, execute the terminal commands, verify each step with the provided assertions, and start both the backend and frontend services.

---

## 📋 System Prerequisites

| Component | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Python** | `3.10+` | `3.11` or `3.12` | Required for FastAPI backend |
| **Node.js** | `18.0.0+` | `20.x LTS` | Required for Vite frontend |
| **npm** | `9.0.0+` | `10.x` | Included with Node.js |
| **Git** | `2.x` | Latest | For repository clone & tracking |
| **Tesseract OCR** *(Optional)* | `4.x+` | Latest | For physical document complaint scanning |

---

## ⚡ Agent Execution Instructions (Step-by-Step)

### Step 1: Repository Root Verification
Ensure the current working directory is inside the `crimegpt` root:
```bash
# Verify working directory structure
# You should see 'apps/backend', 'apps/frontend', 'README.md'
ls -la
```

---

### Step 2: Backend Setup & Dependency Installation

1. Navigate to the backend directory:
   ```bash
   cd apps/backend
   ```

2. *(Recommended)* Create and activate a Python virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS (Bash)**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install all required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the environment variables:
   * Copy `.env.example` to `.env`:
     * **Windows**: `copy .env.example .env`
     * **Linux/macOS**: `cp .env.example .env`
   * *(Optional)* If the user provides a Groq API key, update `GROQ_API_KEY=your_key` in `apps/backend/.env`. (If no key is provided, the backend automatically uses its built-in offline TF-IDF NLP statutory mapper).

5. Initialize the database and populate seed data:
   ```bash
   python seed_data.py
   ```
   **Expected Output**:
   ```
   [OK] Database seeded successfully!
   - 5 Registered FIR Cases with full parties, seized items, and compliance deadlines
   - 57 Bharatiya Nyaya Sanhita (BNS 2023) Statutory Sections
   - 13 Supreme Court Landmark Precedents & Principles
   - 6 BNSS Statutory Compliance Rules & Timelines
   - 4 BSA Evidentiary & Forensics Mandates
   ```

6. Run backend test verification suites:
   ```bash
   python verify_test.py
   python verify_phase3.py
   python verify_phase4.py
   python verify_phase5.py
   python verify_phase6.py
   ```
   **Verification Assertion**: All verification scripts should output `ALL TESTS PASSED [OK]`.

---

### Step 3: Frontend Setup & Build Verification

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Validate production build:
   ```bash
   npm run build
   ```
   **Verification Assertion**: Vite builds cleanly without syntax or bundle errors (`✓ built in ...ms`).

---

### Step 4: Launching Dev Servers

#### Option A: Dedicated Terminals (Standard Development)

* **Terminal 1 (Backend)**:
  ```bash
  cd apps/backend
  # Activate venv if used
  python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```
  * Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
  * OpenAPI JSON: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

* **Terminal 2 (Frontend)**:
  ```bash
  cd apps/frontend
  npm run dev
  ```
  * Web Application: [http://localhost:3000](http://localhost:3000)

---

#### Option B: 1-Click Launch Scripts

* **Windows**:
  Run `start.bat` from repository root.
* **Linux / macOS**:
  Run `chmod +x start.sh && ./start.sh` from repository root.

---

## 🔍 Automated Health Checks & Validation Suite

Run these commands to verify that both services are fully healthy:

```bash
# 1. Check Backend Health
curl -s http://localhost:8000/docs | grep -i "swagger"

# 2. Check Case Registry API
curl -s http://localhost:8000/api/cases | grep -i "FIR-"

# 3. Check Legal Intelligence Engine API
curl -s -X POST http://localhost:8000/api/legal-intel/recommend \
  -H "Content-Type: application/json" \
  -d '{"incident_text":"Accused threatened shopkeeper with knife and stole cash"}'

# 4. Check Frontend Web Server
curl -s -I http://localhost:3000 | grep "200 OK"
```

---

## 🛠️ Troubleshooting & Recovery Matrix

| Issue | Cause | Solution |
|---|---|---|
| **Port `8000` already in use** | Stray background Uvicorn process | **Windows**: `Get-NetTCPConnection -LocalPort 8000 \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`<br>**Linux/Mac**: `kill -9 $(lsof -t -i:8000)` |
| **Port `3000` already in use** | Stray Vite process | **Windows**: `Get-NetTCPConnection -LocalPort 3000 \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`<br>**Linux/Mac**: `kill -9 $(lsof -t -i:3000)` |
| **SQLite DB missing or locked** | Uninitialized DB | Run `cd apps/backend && python seed_data.py` |
| **Groq AI key missing/quota exceeded** | No API Key in `.env` | No action needed; CrimeGPT automatically falls back to its built-in offline TF-IDF cosine-similarity legal engine. |
| **Tesseract OCR not installed** | System package missing | Optional; install `tesseract-ocr` via `winget install UB-Mannheim.TesseractOCR` (Windows) or `sudo apt install tesseract-ocr` (Ubuntu). |

---

## 📂 Core Architecture Map

```
crimegpt/
├── apps/
│   ├── backend/
│   │   ├── api/                  # FastAPI REST endpoints
│   │   │   ├── cases.py          # FIR CRUD & lifecycle state machine
│   │   │   ├── documents.py      # 7 official legal document generators
│   │   │   ├── legal_intel.py    # Hybrid RAG legal mapping engine
│   │   │   ├── lers_bharatpol.py # WhatsApp LERS & NCRB BharatPol API
│   │   │   ├── diary.py          # BNSS Sec 187 Case Diary timeline
│   │   │   ├── evidence.py       # BSA Sec 63 Hash-sealed evidence vault
│   │   │   ├── cctns_sync.py     # CCTNS IIF-1/IIF-5 XML gateway
│   │   │   └── multilingual_io.py# Voice statement & OCR complaint scanner
│   │   ├── data/                 # Statutory bare acts & precedents JSON
│   │   ├── services/             # Core business logic & AI orchestration
│   │   ├── database.py           # SQLite connection & session management
│   │   ├── models.py             # SQLAlchemy relational database models
│   │   ├── requirements.txt      # Python dependencies list
│   │   ├── seed_data.py          # Synthetic dataset seeder
│   │   └── main.py               # FastAPI application entry point
│   └── frontend/
│       ├── src/
│       │   ├── components/       # Reusable components (Navbar, Sidebar, Timelines)
│       │   ├── pages/            # 7 views (Dashboard, Explorer, Detail, Codex, Intel)
│       │   ├── api.js            # Axios client with backend endpoints
│       │   ├── translations.js   # Tri-lingual UI dictionary (EN, HI, GU)
│       │   └── index.css         # Responsive police dark design system
│       ├── package.json          # Node dependencies & scripts
│       └── vite.config.js        # Vite build & dev proxy configuration
├── AGENT_SETUP.md                # 🤖 AI Agent installation instructions (This file)
├── start.bat                     # 1-Click Windows launch script
├── start.sh                      # 1-Click Linux/macOS launch script
└── README.md                     # Project overview & architectural whitepaper
```

# CrimeGPT – AI Assistant Build Instructions

This repository is being built with AI assistance. Use this document as your
system prompt when you ask an AI to help you write code, design schemas, or
extend documentation.

## Project intent

CrimeGPT is a **BNSS/BNS/BSA‑aware legal‑tech system** for Indian criminal
procedure. It is **not** a generic chatbot. Every design choice must respect:

- Indian legal jurisdiction (India only).
- New criminal codes (BNS, BNSS, BSA) and legacy IPC/CrPC/Evidence Act.[cite:14][cite:20]
- Law‑enforcement workflows (FIR, arrest, remand, seizure, medico‑legal reports).

The core user is a police officer or legal advisor, not an end‑user citizen.

## Architectural constraints

When generating code or designs:

1. **Backend**
   - Use Python (FastAPI preferred) with PostgreSQL and pgvector.[cite:9]
   - Organize endpoints around:
     - `/cases` – case CRUD
     - `/legal-intel` – RAG suggestions
     - `/documents` – Docassemble integration
     - `/diary` – BNSS case diary events
     - `/search` – keyword + semantic search
   - Enforce separation of concerns:
     - DB models in `apps/backend/models`
     - Business logic in `apps/backend/services`
     - API routes in `apps/backend/api`

2. **Legal‑intel**
   - Use `law-ai/InLegalBERT` for embeddings.[cite:13][cite:9][cite:19][cite:71]
   - Follow a NyayaRAG‑style pattern:
     - Accept facts / summary.
     - Retrieve statute and judgment chunks via pgvector.[cite:81][cite:85][cite:84]
     - Call an LLM only with retrieved context; never rely on LLM alone for law.
   - Outputs must be **structured JSON** with:
     - `candidate_sections` – code, section_number, confidence, rationale, citations.
     - `candidate_judgments` – case_name, citation, summary.

3. **Docassemble**
   - All legal documents are generated via Docassemble, not manually:
     - YAML interviews in `apps/docassemble/data/questions/`.
     - DOCX templates in `apps/docassemble/data/templates/`.[cite:51][cite:68][cite:103][cite:108]
   - Headless usage pattern:
     - Backend posts case JSON to Docassemble.
     - Receives DOCX/PDF, stores metadata in `documents` table.

4. **Multilingual IO**
   - Use IndicTrans2 for Gujarati/Hindi/English translation.[cite:22][cite:30][cite:33][cite:34][cite:39]
   - Keep all **canonical legal processing** in English internally.
   - Provide translated views for UI convenience; do not base law selection on MT output alone.

5. **Case diary & BNSS**
   - Model case status as a finite state machine:
     - `complaint → fir → investigation → arrest → custody → chargesheet_filed`.[cite:14][cite:20]
   - Every status change or document generation triggers a `diary_event`.
   - BNSS deadlines (charge‑sheet windows, custody limits) must be computed using
     offence type and FIR date, not hardcoded constants alone.[cite:20]

6. **Security and audit**
   - Implement row‑level restrictions (IO sees assigned cases only).
   - All data mutations must be written to `audit_log` with before/after snapshots.

## Coding style

- Prefer explicit types (Pydantic models, Python type hints).
- Avoid complex, monolithic functions; keep modules small and composable.
- Write integration points as clearly separated adapters (e.g., `docassemble_client`,
  `indictrans_client`, `paddleocr_client`).

Whenever the AI suggests big changes, check that they still respect:

- BNSS/BNS/BSA domain assumptions.
- Modular architecture (backend / legal-intel / docassemble / nlp-io).
- Indian jurisdiction.

## What the AI **must not** do

- Do not invent section numbers or case law names. All legal references must
  come from the ingested corpus or IPC↔BNS crosswalk data.[cite:93][cite:83][cite:87][cite:90]
- Do not treat generic GPT answers as ground truth on Indian law.
- Do not remove Docassemble from the stack or replace it with ad‑hoc templating
  unless explicitly instructed.
- Do not collapse multilingual support into “English only” for convenience.

## Example tasks for AI

- Define SQLAlchemy models for `cases`, `persons`, `sections`, `seizures`,
  `documents`, `diary_events`, `legal_chunks`, `audit_log`.
- Implement a FastAPI route for `/legal-intel/suggest` that integrates InLegalBERT
  embeddings and pgvector retrieval.
- Generate a Docassemble interview YAML and DOCX template for a seizure receipt.
- Write a React component for:
  - Case creation form.
  - Legal suggestions panel showing candidate sections and judgments.
  - Case diary timeline view.

When you ask an AI to perform any of these tasks, paste or reference this
`agent.md` so it understands the constraints.

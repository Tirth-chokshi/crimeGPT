import os
from dotenv import load_dotenv

# Load .env BEFORE any other imports (so services see the env vars)
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from seed_data import seed_database
from api.auth import router as auth_router
from api.cases import router as cases_router
from api.legal_intel import router as legal_intel_router
from api.documents import router as documents_router
from api.diary import router as diary_router
from api.search import router as search_router
from api.multilingual_io import router as io_router
from api.evidence import router as evidence_router
from api.cctns_sync import router as cctns_sync_router
from api.lers_bharatpol import router as lers_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed
    init_db()
    seed_database()
    yield

app = FastAPI(
    title="CrimeGPT API",
    description="AI-Powered Automation for Crime Documentation and BNSS/BNS Legal Intelligence",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(cases_router, prefix="/api")
app.include_router(legal_intel_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(diary_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(io_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(cctns_sync_router, prefix="/api")
app.include_router(lers_router, prefix="/api")



@app.get("/")
def root():
    from services.llm_service import LLMService
    llm_status = LLMService.get_status()
    return {
        "app": "CrimeGPT Backend Engine",
        "version": "2.0.0",
        "status": "ONLINE",
        "jurisdiction": "Indian Criminal Jurisprudence (BNS, BNSS, BSA)",
        "legal_engine": {
            "offline": "TF-IDF + Keyword NLP Matcher (Always Active)",
            "online": f"{llm_status['provider']} {llm_status['model']} ({'Connected' if llm_status['available'] else 'Not Configured'})"
        },
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    from services.llm_service import LLMService
    llm_status = LLMService.get_status()
    return {
        "status": "healthy",
        "database": "SQLite (Connected)",
        "legal_engine_offline": "TF-IDF + Keyword NLP Matcher (Active)",
        "legal_engine_online": llm_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

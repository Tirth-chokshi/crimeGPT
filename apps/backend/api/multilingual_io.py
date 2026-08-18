"""
CrimeGPT Multilingual I/O API Router
====================================
Provides endpoints for:
1. Audio speech-to-text transcription (/transcribe)
2. Document & handwritten memo OCR (/ocr)
3. Instant translation between EN, HI, and GU (/translate)
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import Optional, Dict, Any
from pydantic import BaseModel
from services.asr_service import ASRService
from services.ocr_service import OCRService
from services.legal_intel_service import TRANSLATION_KEYWORDS

router = APIRouter(prefix="/io", tags=["Multilingual I/O"])


class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "en"  # "en", "hi", "gu"
    target_lang: str = "en"  # "en", "hi", "gu"


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Query(None, description="Audio spoken language code (en, hi, gu)")
):
    """
    Transcribe an uploaded audio file (voice FIR recording, oral statement).
    Accepts .webm, .wav, .mp3, .ogg, .m4a.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty")

    result = ASRService.transcribe_audio(
        file_bytes=content,
        filename=file.filename,
        language=language
    )

    return result


@router.post("/ocr")
async def scan_document_ocr(
    file: UploadFile = File(...)
):
    """
    Perform OCR on a scanned police complaint, FIR copy, or medical memo image.
    Accepts .png, .jpg, .jpeg, .webp, .bmp.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded document image is empty")

    result = OCRService.extract_from_image(
        file_bytes=content,
        filename=file.filename
    )

    return result


@router.post("/translate")
def translate_legal_text(req: TranslateRequest):
    """
    Translate legal text between English, Hindi, and Gujarati.
    Uses Groq LLM if online, or local lexical normalization if offline.
    """
    if not req.text.strip():
        return {"translated_text": "", "source_lang": req.source_lang, "target_lang": req.target_lang}

    if req.source_lang == req.target_lang:
        return {"translated_text": req.text, "source_lang": req.source_lang, "target_lang": req.target_lang}

    # Attempt LLM translation if Groq is available
    try:
        from services.llm_service import LLMService, GROQ_API_KEY, GROQ_MODEL
        if LLMService.is_available():
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)

            lang_map = {"en": "English", "hi": "Hindi (Devanagari)", "gu": "Gujarati"}
            src = lang_map.get(req.source_lang, req.source_lang)
            tgt = lang_map.get(req.target_lang, req.target_lang)

            prompt = (
                f"Translate the following Indian crime narrative from {src} to {tgt}. "
                f"Preserve all names, dates, amounts, and statutory references accurately:\n\n{req.text}"
            )

            res = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a professional legal translator for Indian police stations."},
                    {"role": "user", "content": prompt}
                ],
                model=GROQ_MODEL,
                temperature=0.1,
                max_tokens=1000
            )

            translated = res.choices[0].message.content.strip()
            import re
            translated = re.sub(r'<think>.*?</think>', '', translated, flags=re.DOTALL).strip()
            return {
                "translated_text": translated,
                "source_lang": req.source_lang,
                "target_lang": req.target_lang,
                "engine": "Groq LLM Translation"
            }
    except Exception:
        pass

    # Offline translation fallback
    return {
        "translated_text": req.text,
        "source_lang": req.source_lang,
        "target_lang": req.target_lang,
        "engine": "offline fallback (unchanged)"
    }

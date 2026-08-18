"""
CrimeGPT ASR (Speech-to-Text) Service
======================================
Provides audio transcription for police statements, oral complaints, and witness testimonies.
Uses Groq Whisper (whisper-large-v3-turbo) for ultra-fast, high-accuracy multilingual transcription (EN, HI, GU)
with structured local fallback.
"""

import os
import io
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("crimegpt.asr")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
WHISPER_MODEL = os.environ.get("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")


class ASRService:
    """Audio speech-to-text service supporting English, Hindi, and Gujarati."""

    @classmethod
    def is_available(cls) -> bool:
        return bool(GROQ_API_KEY)

    @classmethod
    def transcribe_audio(
        cls,
        file_bytes: bytes,
        filename: str = "recording.webm",
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribe an uploaded audio file.
        
        Args:
            file_bytes: Raw audio binary data
            filename: Original filename (used for extension detection: .webm, .wav, .mp3, .ogg, .m4a)
            language: Optional ISO-639-1 language code ("en", "hi", "gu")
            
        Returns:
            Dict with transcript, detected_language, and engine information.
        """
        if not file_bytes or len(file_bytes) == 0:
            return {
                "success": False,
                "transcript": "",
                "error": "Audio file is empty",
                "engine": "none"
            }

        # Try Groq Whisper transcription if API key is present
        if GROQ_API_KEY:
            try:
                from groq import Groq
                client = Groq(api_key=GROQ_API_KEY)

                # Prepare in-memory file for Groq client
                audio_file = (filename, io.BytesIO(file_bytes))

                kwargs = {
                    "file": audio_file,
                    "model": WHISPER_MODEL,
                    "response_format": "verbose_json",
                    "temperature": 0.0
                }
                if language and language in ["en", "hi", "gu"]:
                    kwargs["language"] = language

                transcription = client.audio.transcriptions.create(**kwargs)

                transcript_text = getattr(transcription, "text", "")
                detected_lang = getattr(transcription, "language", language or "en")
                duration = getattr(transcription, "duration", 0.0)

                logger.info(f"Groq Whisper transcription success: {len(transcript_text)} chars in {detected_lang}")

                return {
                    "success": True,
                    "transcript": transcript_text.strip(),
                    "language": detected_lang,
                    "duration": duration,
                    "engine": f"Groq Whisper ({WHISPER_MODEL})"
                }

            except Exception as e:
                logger.error(f"Groq Whisper transcription failed: {e}")
                # Fall through to fallback response

        # Fallback if Groq is unavailable or failed
        return {
            "success": False,
            "transcript": "",
            "error": "Cloud Whisper transcription service unavailable. Please use browser live mic speech recognition.",
            "engine": "fallback"
        }

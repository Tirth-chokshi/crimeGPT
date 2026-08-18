"""
CrimeGPT Phase 4 Verification Suite
===================================
Tests multilingual I/O endpoints:
1. Document OCR endpoint (/api/io/ocr)
2. Audio speech-to-text endpoint (/api/io/transcribe)
3. Legal text translation endpoint (/api/io/translate)
"""

import io
import requests
import json
from PIL import Image, ImageDraw, ImageFont

BASE = "http://localhost:8000/api"


def create_test_complaint_image() -> bytes:
    """Create an in-memory test police complaint image."""
    img = Image.new("RGB", (800, 400), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    lines = [
        "POLICE COMPLAINT STATEMENT / FIRST INFORMATION MEMO",
        "Complainant: Rajeshbhai K. Patel (Mobile: 9876543210)",
        "Date of Occurrence: 14-Aug-2026 Time: 21:30 Hrs",
        "Place of Occurrence: Ashram Road, Navrangpura, Ahmedabad",
        "Accused: 2 Unknown Males on Black Pulsar Motorcycle",
        "Stolen Property / Mudamal: 20g Gold Chain, One Apple iPhone 15",
        "Incident Summary: The accused intercepted complainant, threatened with knife, and snatched gold chain."
    ]

    y = 20
    for line in lines:
        draw.text((30, y), line, fill=(0, 0, 0))
        y += 45

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_ocr_endpoint():
    print("=" * 60)
    print("TEST 1: Document OCR Endpoint (/api/io/ocr)")
    print("=" * 60)
    image_bytes = create_test_complaint_image()
    files = {"file": ("test_complaint.jpg", image_bytes, "image/jpeg")}
    r = requests.post(f"{BASE}/io/ocr", files=files)
    print(f"Status Code: {r.status_code}")
    data = r.json()
    print("Response JSON:")
    print(json.dumps(data, indent=2))
    assert r.status_code == 200
    assert data["success"] == True
    assert "structured_data" in data
    print("✅ Document OCR endpoint verified successfully")


def test_translation_endpoint():
    print("\n" + "=" * 60)
    print("TEST 2: Multilingual Legal Translation Endpoint (/api/io/translate)")
    print("=" * 60)
    payload = {
        "text": "The accused person threatened victim with sharp knife and snatched gold chain.",
        "source_lang": "en",
        "target_lang": "hi"
    }
    r = requests.post(f"{BASE}/io/translate", json=payload)
    print(f"Status Code: {r.status_code}")
    data = r.json()
    print(json.dumps(data, indent=2))
    assert r.status_code == 200
    assert "translated_text" in data
    print("✅ Translation endpoint verified successfully")


def test_transcribe_endpoint():
    print("\n" + "=" * 60)
    print("TEST 3: Audio Transcription Endpoint (/api/io/transcribe)")
    print("=" * 60)
    # Create empty mock audio payload
    mock_audio = b"\x00" * 1024
    files = {"file": ("recording.wav", mock_audio, "audio/wav")}
    r = requests.post(f"{BASE}/io/transcribe", files=files)
    print(f"Status Code: {r.status_code}")
    data = r.json()
    print(json.dumps(data, indent=2))
    assert r.status_code == 200
    print("✅ Audio transcription endpoint responds properly")


if __name__ == "__main__":
    print("🔍 Starting CrimeGPT Phase 4 Backend Verification\n")
    test_ocr_endpoint()
    test_translation_endpoint()
    test_transcribe_endpoint()
    print("\n" + "=" * 60)
    print("🎉 ALL PHASE 4 BACKEND TESTS PASSED!")
    print("=" * 60)

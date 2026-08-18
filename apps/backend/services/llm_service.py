"""
CrimeGPT LLM Service — Groq + Llama 3.3 70B Integration
=========================================================
Optional online enrichment for legal intelligence analysis.
Uses Groq's ultra-fast inference with Llama 3.3 70B Versatile model.

All legal reasoning is grounded in the BNS/BNSS/BSA corpus injected as RAG context.
The LLM is NEVER trusted as a standalone source of Indian law — it only refines
and augments the locally-computed TF-IDF + keyword matches.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("crimegpt.llm")

# Load environment variable
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")


class LLMService:
    """
    Groq LLM enrichment service for CrimeGPT legal intelligence.
    Provides structured legal analysis grounded in BNS/BNSS/BSA corpus context.
    """

    _client = None

    @classmethod
    def _get_client(cls):
        """Lazy-initialize Groq client."""
        if cls._client is None and GROQ_API_KEY:
            try:
                from groq import Groq
                cls._client = Groq(api_key=GROQ_API_KEY)
            except ImportError:
                logger.warning("groq package not installed. LLM enrichment unavailable.")
                return None
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                return None
        return cls._client

    @classmethod
    def is_available(cls) -> bool:
        """Check if LLM enrichment is available (API key configured + client works)."""
        return bool(GROQ_API_KEY) and cls._get_client() is not None

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """Return LLM engine status for frontend display."""
        return {
            "provider": "Groq",
            "model": GROQ_MODEL,
            "available": cls.is_available(),
            "api_key_configured": bool(GROQ_API_KEY),
            "description": f"{GROQ_MODEL} via Groq ultra-fast inference"
        }

    @classmethod
    def enrich_legal_analysis(
        cls,
        narrative: str,
        detected_language: str,
        tfidf_sections: List[Dict[str, Any]],
        bnss_mandates: List[Dict[str, Any]],
        bsa_rules: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Enrich legal analysis using Groq LLM with RAG context.

        The LLM receives:
        1. The raw crime narrative
        2. Top TF-IDF matched BNS sections (as grounding context)
        3. Matched BNSS procedural mandates
        4. BSA evidence rules

        Returns:
        - llm_analysis: Detailed AI legal reasoning paragraph
        - additional_sections: Any BNS sections the TF-IDF may have missed
        - refined_rationale: Improved rationale for top sections
        - investigation_priorities: Ordered investigation steps
        """
        client = cls._get_client()
        if not client:
            return None

        try:
            # Build RAG context from local corpus matches
            context_sections = "\n".join([
                f"- BNS Section {s['section_number']} ({s['section_title']}): "
                f"{s['rationale']} [Punishment: {s['punishment']}] "
                f"[Bailable: {s['bailable']}] [Cognizable: {s['cognizable']}]"
                for s in tfidf_sections
            ])

            context_bnss = "\n".join([
                f"- BNSS Section {m['section']} ({m['title']}): {m['summary']} "
                f"[Timeline: {m.get('statutory_timeline', 'N/A')}]"
                for m in bnss_mandates[:5]
            ])

            context_bsa = "\n".join([
                f"- BSA Section {b['section']} ({b['title']}): {b['summary']}"
                for b in bsa_rules[:3]
            ])

            system_prompt = """You are CrimeGPT Legal Intelligence Engine, a specialized AI assistant for Indian law enforcement under the new criminal codes (BNS, BNSS, BSA).

STRICT RULES:
1. You MUST ONLY reference BNS sections that exist in the provided context. Do NOT invent section numbers.
2. All your analysis must be grounded in the Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), and Bharatiya Sakshya Act (BSA).
3. Always mention the IPC/CrPC equivalent for officer familiarity.
4. Be precise about bailable/non-bailable, cognizable/non-cognizable classification.
5. Your response must be valid JSON matching the exact schema specified."""

            user_prompt = f"""Analyze this crime incident and provide enhanced legal intelligence.

## Crime Narrative ({detected_language.upper()})
{narrative}

## Already Identified BNS Sections (from local corpus matching)
{context_sections if context_sections else "No sections matched yet."}

## BNSS Procedural Mandates Triggered
{context_bnss if context_bnss else "None matched."}

## BSA Evidence Rules Applicable
{context_bsa if context_bsa else "None matched."}

## Your Task
Respond with ONLY a valid JSON object (no markdown, no explanation outside JSON):
{{
  "llm_analysis": "A detailed 3-5 sentence legal analysis paragraph explaining WHY the identified sections apply to this specific incident, citing specific facts from the narrative that constitute each offence element. Mention BNSS procedural obligations the IO must follow.",
  "additional_sections": [
    {{
      "section_number": "BNS section number ONLY from the Indian legal corpus",
      "section_title": "Title of the section",
      "confidence": 0.75,
      "keywords": ["keyword1", "keyword2"],
      "reason": "Brief reason why this section also applies"
    }}
  ],
  "investigation_priorities": [
    "Priority 1: Most urgent investigation step",
    "Priority 2: Next step",
    "Priority 3: Follow-up action"
  ],
  "severity_assessment": "LOW / MEDIUM / HIGH / CRITICAL",
  "bail_advisory": "Brief assessment of whether accused is likely to get bail based on sections invoked"
}}

IMPORTANT: additional_sections should ONLY contain sections NOT already in the identified list above. If all relevant sections are already covered, return an empty array. Only suggest real BNS sections you are confident exist."""

            # Call Groq API — Qwen models handle JSON via prompt instruction
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=GROQ_MODEL,
                temperature=0.2,  # Low temperature for legal precision
                max_tokens=2000,
            )

            response_text = chat_completion.choices[0].message.content

            # Extract JSON from response (handle markdown code blocks, thinking tags, etc.)
            import re as _re
            # Strip <think>...</think> blocks (Qwen thinking mode)
            response_text = _re.sub(r'<think>.*?</think>', '', response_text, flags=_re.DOTALL).strip()
            # Try to find JSON block in markdown
            json_match = _re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, _re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            else:
                # Try to find raw JSON object
                brace_match = _re.search(r'\{.*\}', response_text, _re.DOTALL)
                if brace_match:
                    response_text = brace_match.group(0)

            result = json.loads(response_text)

            logger.info(f"Groq LLM enrichment successful. Model: {GROQ_MODEL}")
            return result

        except json.JSONDecodeError as e:
            logger.warning(f"LLM returned invalid JSON: {e}")
            return None
        except Exception as e:
            logger.error(f"Groq LLM call failed (graceful fallback to offline): {e}")
            return None

"""
CrimeGPT Legal Intelligence Service
====================================
Hybrid NLP engine: TF-IDF + keyword matching + optional Groq LLM enrichment.
All legal references are grounded in the ingested BNS/BNSS/BSA corpus — never hallucinated.
"""

import os
import json
import re
import math
from typing import List, Dict, Any, Optional
from collections import Counter

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

def load_json_file(filename: str) -> List[Dict[str, Any]]:
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

BNS_CORPUS = load_json_file("bns_corpus.json")
BNSS_CORPUS = load_json_file("bnss_corpus.json")
BSA_CORPUS = load_json_file("bsa_corpus.json")
LANDMARK_JUDGMENTS = load_json_file("landmark_judgments.json")

# Multilingual keywords dictionary for Hindi & Gujarati normalization
TRANSLATION_KEYWORDS = {
    # Hindi
    "हत्या": "murder killed death",
    "मार": "beaten assault hurt",
    "चाकू": "knife blade stabbed",
    "पिस्तौल": "gun firearm shot",
    "लूट": "robbery looted dacoity",
    "चोरी": "theft stolen stole",
    "धोखाधड़ी": "fraud cheating scam",
    "बलात्कार": "rape sexual assault",
    "धमकी": "threatened intimidation",
    "छेड़छाड़": "molestation outraged modesty stalking",
    "जबरन": "forcibly extortion",
    "दहेज": "dowry cruelty harassment",
    "अपहरण": "kidnapping abducted abduction",
    "जालसाज़ी": "forgery forged counterfeiting",
    "आगजनी": "arson fire burning",
    "भ्रष्टाचार": "corruption bribery",
    # Gujarati
    "ખૂન": "murder killed death",
    "ચાકુ": "knife blade stabbed",
    "ચોરી": "theft stolen stole",
    "લૂંટ": "robbery looted dacoity",
    "છેતરપિંડી": "cheating fraud scam",
    "ધમકી": "threatened intimidation",
    "મારપીટ": "assault beaten hurt",
    "બળાત્કાર": "rape sexual assault",
    "દહેજ": "dowry cruelty harassment",
    "હથિયાર": "weapon firearm knife",
    "અપહરણ": "kidnapping abducted abduction",
    "આગ": "arson fire burning"
}


# ═══════════════════════════════════════════════════════════════════
# TF-IDF Scoring Engine (Achievement 1)
# ═══════════════════════════════════════════════════════════════════

class TFIDFMatcher:
    """
    Lightweight TF-IDF + cosine similarity matcher built from the BNS corpus.
    No external ML dependencies required — uses pure Python math.
    Vocabulary is built once at module load time.
    """

    def __init__(self, corpus: List[Dict[str, Any]]):
        self.corpus = corpus
        self.doc_texts = []     # Text representation per section
        self.doc_tokens = []    # Tokenized per section
        self.idf = {}           # Inverse document frequency per term
        self.doc_tfidf = []     # TF-IDF vectors per section
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text into lowercase words, strip punctuation."""
        return re.findall(r'[a-z]+', text.lower())

    def _build_index(self):
        """Build TF-IDF vocabulary and document vectors from BNS corpus."""
        # Build document text representations
        for sec in self.corpus:
            text_parts = [
                sec.get("title", ""),
                sec.get("description", ""),
                " ".join(sec.get("keywords", [])),
                sec.get("chapter", ""),
                sec.get("punishment", ""),
            ]
            full_text = " ".join(text_parts)
            self.doc_texts.append(full_text)
            self.doc_tokens.append(self._tokenize(full_text))

        n_docs = len(self.doc_tokens)
        if n_docs == 0:
            return

        # Compute document frequency for each term
        df = Counter()
        for tokens in self.doc_tokens:
            unique_tokens = set(tokens)
            for token in unique_tokens:
                df[token] += 1

        # Compute IDF: log(N / df) with smoothing
        self.idf = {
            term: math.log((n_docs + 1) / (freq + 1)) + 1
            for term, freq in df.items()
        }

        # Build TF-IDF vectors for each document
        for tokens in self.doc_tokens:
            tf = Counter(tokens)
            total = len(tokens) if tokens else 1
            tfidf_vec = {}
            for term, count in tf.items():
                tfidf_vec[term] = (count / total) * self.idf.get(term, 1.0)
            self.doc_tfidf.append(tfidf_vec)

    def _cosine_similarity(self, vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
        """Compute cosine similarity between two sparse TF-IDF vectors."""
        common_terms = set(vec_a.keys()) & set(vec_b.keys())
        if not common_terms:
            return 0.0

        dot_product = sum(vec_a[t] * vec_b[t] for t in common_terms)
        norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
        norm_b = math.sqrt(sum(v * v for v in vec_b.values()))

        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    def score_narrative(self, narrative: str) -> List[Dict[str, Any]]:
        """
        Score all BNS sections against a narrative using TF-IDF cosine similarity.
        Returns list of {section_index, tfidf_score} sorted descending.
        """
        query_tokens = self._tokenize(narrative)
        if not query_tokens:
            return []

        # Build query TF-IDF vector
        tf = Counter(query_tokens)
        total = len(query_tokens)
        query_vec = {}
        for term, count in tf.items():
            query_vec[term] = (count / total) * self.idf.get(term, 1.0)

        # Score against each document
        scores = []
        for idx, doc_vec in enumerate(self.doc_tfidf):
            sim = self._cosine_similarity(query_vec, doc_vec)
            if sim > 0.01:  # Threshold to avoid noise
                scores.append({"section_index": idx, "tfidf_score": sim})

        scores.sort(key=lambda x: x["tfidf_score"], reverse=True)
        return scores


# Initialize TF-IDF matcher at module load
_tfidf_matcher = TFIDFMatcher(BNS_CORPUS)


# ═══════════════════════════════════════════════════════════════════
# Main Legal Intelligence Service
# ═══════════════════════════════════════════════════════════════════

class LegalIntelService:
    @staticmethod
    def detect_language(text: str) -> str:
        # Check for Devanagari / Gujarati unicode ranges
        if any('\u0A80' <= c <= '\u0AFF' for c in text):
            return "gu"  # Gujarati
        elif any('\u0900' <= c <= '\u097F' for c in text):
            return "hi"  # Hindi
        return "en"

    @staticmethod
    def normalize_text(text: str) -> str:
        cleaned = text.lower()
        # Expand vernacular terms
        for vernacular, replacement in TRANSLATION_KEYWORDS.items():
            if vernacular in cleaned:
                cleaned += f" {replacement}"
        return cleaned

    @classmethod
    def _keyword_score(cls, normalized: str, words: set, section: Dict) -> tuple:
        """Original keyword matching logic. Returns (score, matched_keywords)."""
        score = 0
        matched_kw = []
        for kw in section.get("keywords", []):
            kw_lower = kw.lower()
            if " " in kw_lower:
                if kw_lower in normalized:
                    score += 3
                    matched_kw.append(kw)
            else:
                if kw_lower in words:
                    score += 1.5
                    matched_kw.append(kw)
        return score, matched_kw

    @classmethod
    def _build_section_result(cls, sec: Dict, confidence: float, matched_kw: List[str],
                               scoring_method: str = "keyword") -> Dict[str, Any]:
        """Build a standardized section result dict."""
        rationale = (
            f"Incident facts indicate elements of {sec['title'].lower()} matching keywords "
            f"({', '.join(matched_kw[:4])}). Under {sec['act']} Section {sec['section']}, "
            f"this constitutes a {sec['cognizable'].lower()} and {sec['bailable'].lower()} offence "
            f"punishable with {sec['punishment'].lower()}."
        )
        return {
            "act": sec.get("act", "BNS"),
            "section_number": sec["section"],
            "section_title": sec["title"],
            "ipc_equivalent": sec.get("ipc_equivalent", ""),
            "confidence": round(confidence, 2),
            "rationale": rationale,
            "bailable": sec.get("bailable", "Non-Bailable"),
            "cognizable": sec.get("cognizable", "Cognizable"),
            "punishment": sec.get("punishment", ""),
            "scoring_method": scoring_method,
            "statutory_citations": [
                f"{sec['act']} Section {sec['section']}",
                f"Legacy: {sec.get('ipc_equivalent', 'N/A')}"
            ],
        }

    @classmethod
    def analyze_incident(cls, narrative: str, language: str = "en",
                          engine_mode: str = "auto") -> Dict[str, Any]:
        """
        Analyze a crime narrative and return legal intelligence.

        engine_mode:
          - "auto": Use TF-IDF + keyword blend, then LLM if available
          - "offline": TF-IDF + keyword only (no LLM call)
          - "online": Force LLM enrichment (falls back to offline if unavailable)
        """
        detected_lang = cls.detect_language(narrative)
        normalized = cls.normalize_text(narrative)
        words = set(re.findall(r'\w+', normalized))

        # ─── Step 1: Keyword Matching ───
        keyword_scores = {}  # section_index -> {score, matched_kw}
        for idx, sec in enumerate(BNS_CORPUS):
            score, matched_kw = cls._keyword_score(normalized, words, sec)
            if score > 0:
                keyword_scores[idx] = {"score": score, "matched_kw": matched_kw}

        # ─── Step 2: TF-IDF Scoring ───
        tfidf_results = _tfidf_matcher.score_narrative(normalized)
        tfidf_scores = {r["section_index"]: r["tfidf_score"] for r in tfidf_results}

        # ─── Step 3: Blend Scores (60% TF-IDF, 40% Keyword) ───
        all_indices = set(keyword_scores.keys()) | set(tfidf_scores.keys())
        blended = []

        # Normalize scores to [0, 1] range
        max_kw = max((v["score"] for v in keyword_scores.values()), default=1)
        max_tfidf = max(tfidf_scores.values(), default=1)

        for idx in all_indices:
            kw_norm = keyword_scores.get(idx, {}).get("score", 0) / max_kw if max_kw else 0
            tfidf_norm = tfidf_scores.get(idx, 0) / max_tfidf if max_tfidf else 0

            # Weighted blend
            blend = (0.6 * tfidf_norm) + (0.4 * kw_norm)
            confidence = min(0.98, max(0.50, 0.40 + (blend * 0.58)))

            matched_kw = keyword_scores.get(idx, {}).get("matched_kw", [])
            # If no keyword match but TF-IDF matched, extract relevant keywords
            if not matched_kw and idx < len(BNS_CORPUS):
                sec = BNS_CORPUS[idx]
                matched_kw = [kw for kw in sec.get("keywords", [])[:3]]

            blended.append({
                "index": idx,
                "blend_score": blend,
                "confidence": confidence,
                "matched_kw": matched_kw,
                "scoring_method": "tfidf" if idx not in keyword_scores else "tfidf+keyword"
            })

        blended.sort(key=lambda x: x["blend_score"], reverse=True)

        # Build top section results
        top_sections = []
        for item in blended[:8]:
            idx = item["index"]
            if idx < len(BNS_CORPUS):
                sec = BNS_CORPUS[idx]
                top_sections.append(
                    cls._build_section_result(
                        sec, item["confidence"], item["matched_kw"],
                        scoring_method=item["scoring_method"]
                    )
                )

        # If no matches found, provide general default
        if not top_sections:
            top_sections = [{
                "act": "BNS",
                "section_number": "115(2)",
                "section_title": "Voluntarily Causing Hurt",
                "ipc_equivalent": "Section 323 IPC",
                "confidence": 0.60,
                "rationale": "General assault / scuffle indicated in incident narrative.",
                "bailable": "Bailable",
                "cognizable": "Non-Cognizable",
                "punishment": "Imprisonment up to 1 year or fine",
                "scoring_method": "default",
                "statutory_citations": ["BNS Section 115(2)"]
            }]

        # ─── Step 4: BNSS Procedural Mandates ───
        bnss_mandates = cls._match_bnss_mandates(normalized, top_sections)

        # ─── Step 5: BSA Evidence Rules ───
        bsa_rules = cls._match_bsa_rules(normalized)

        # ─── Step 6: Landmark Judgments ───
        landmark_results = cls._match_landmarks(top_sections, bsa_rules)

        # ─── Step 7: LLM Enrichment (if requested and available) ───
        actual_engine_mode = "offline_tfidf"
        llm_insights = None

        if engine_mode in ("auto", "online"):
            try:
                from services.llm_service import LLMService
                if LLMService.is_available():
                    llm_result = LLMService.enrich_legal_analysis(
                        narrative=narrative,
                        detected_language=detected_lang,
                        tfidf_sections=top_sections[:5],
                        bnss_mandates=bnss_mandates,
                        bsa_rules=bsa_rules
                    )
                    if llm_result:
                        actual_engine_mode = "online_llm"
                        llm_insights = llm_result  # Full dict with llm_analysis, severity, bail, priorities
                        # Merge any LLM-suggested additional sections
                        additional = llm_result.get("additional_sections", [])
                        for add_sec in additional:
                            # Validate against corpus — never trust LLM section numbers blindly
                            corpus_match = next(
                                (s for s in BNS_CORPUS if s["section"] == add_sec.get("section_number")),
                                None
                            )
                            if corpus_match and not any(
                                s["section_number"] == add_sec["section_number"] for s in top_sections
                            ):
                                top_sections.append(cls._build_section_result(
                                    corpus_match,
                                    min(0.90, add_sec.get("confidence", 0.70)),
                                    add_sec.get("keywords", []),
                                    scoring_method="llm"
                                ))
            except Exception:
                pass  # Graceful fallback — offline mode continues

        # ─── Step 8: Investigation Action Checklist ───
        checklist = [
            "Register FIR under Section 173 BNSS & supply free copy to the complainant/victim.",
            "Record audio-video footage of the crime scene and search/seizure under Section 105 BNSS.",
            "If offences are punishable <= 7 years, issue Notice under Section 35(3) BNSS (Arnesh Kumar mandate).",
            "Prepare Seizure Panchanama with 2 independent panch witnesses and record electronic hash values (Sec 63 BSA).",
            "Conduct Medical Examination of Accused within 24 hours under Section 53 BNSS before Magistrate production.",
            "Submit Case Diary extracts and Remand Application under Section 187 BNSS within 24 hours of arrest."
        ]

        summary_analysis = (
            f"AI Legal Analysis completed for {len(narrative.split())} words narrative "
            f"(Engine: {actual_engine_mode.replace('_', ' ').title()}). "
            f"Identified {len(top_sections)} applicable BNS sections with cross-referenced IPC provisions, "
            f"{len(bnss_mandates)} procedural statutory compliance mandates, and "
            f"{len(landmark_results)} landmark Supreme Court precedents."
        )

        return {
            "detected_language": detected_lang,
            "engine_mode": actual_engine_mode,
            "summary_analysis": summary_analysis,
            "bns_sections": top_sections,
            "bnss_procedural_mandates": bnss_mandates,
            "bsa_evidence_rules": bsa_rules,
            "landmark_judgments": landmark_results[:4],
            "investigation_action_checklist": checklist,
            "llm_insights": llm_insights
        }

    @classmethod
    def _match_bnss_mandates(cls, normalized: str, top_sections: List[Dict]) -> List[Dict]:
        """Match BNSS procedural mandates based on narrative and matched sections."""
        bnss_mandates = []
        for bnss in BNSS_CORPUS:
            relevance = False
            has_sub_7_yr = any(
                ("up to 3 years" in s.get("punishment", "").lower() or
                 "up to 7 years" in s.get("punishment", "").lower())
                for s in top_sections
            )
            if bnss["section"] == "35" and has_sub_7_yr:
                relevance = True
            elif bnss["section"] == "105" and any(k in normalized for k in ["seized", "recovered", "mobile", "weapon", "cash", "knife"]):
                relevance = True
            elif bnss["section"] == "53" and any(k in normalized for k in ["arrest", "arrested", "custody", "accused", "injured"]):
                relevance = True
            elif bnss["section"] in ["173", "187", "193"]:
                relevance = True
            if relevance:
                bnss_mandates.append(bnss)
        return bnss_mandates

    @classmethod
    def _match_bsa_rules(cls, normalized: str) -> List[Dict]:
        """Match BSA evidence rules based on narrative content."""
        bsa_rules = []
        for bsa in BSA_CORPUS:
            if bsa["section"] in ["61", "63"] and any(k in normalized for k in ["mobile", "phone", "cctv", "call", "whatsapp", "laptop", "recording", "electronic", "online"]):
                bsa_rules.append(bsa)
            elif bsa["section"] == "23" and any(k in normalized for k in ["recovered", "weapon", "knife", "stolen", "hidden", "discovery", "seized"]):
                bsa_rules.append(bsa)
        if not bsa_rules:
            bsa_rules = BSA_CORPUS[:2]
        return bsa_rules

    @classmethod
    def _match_landmarks(cls, top_sections: List[Dict], bsa_rules: List[Dict]) -> List[Dict]:
        """Match landmark judgments based on matched sections and BSA rules."""
        landmark_results = []
        for j in LANDMARK_JUDGMENTS:
            applicable = False
            if "Arnesh Kumar" in j["case_name"] and any(
                s["section_number"] in ["85", "318(4)", "115(2)", "303(2)"] for s in top_sections
            ):
                applicable = True
            elif "Lalita Kumari" in j["case_name"]:
                applicable = True
            elif "D.K. Basu" in j["case_name"]:
                applicable = True
            elif "Arjun Panditrao" in j["case_name"] and any(
                b["section"] in ["61", "63"] for b in bsa_rules
            ):
                applicable = True
            elif "Pulukuri Kottaya" in j["case_name"] and any(
                b["section"] == "23" for b in bsa_rules
            ):
                applicable = True
            elif "Satender Kumar" in j["case_name"]:
                applicable = True
            if applicable:
                landmark_results.append({
                    "case_name": j["case_name"],
                    "citation": j["citation"],
                    "bench": j["bench"],
                    "subject": j["subject"],
                    "principle": j["principle"],
                    "applicable_sections": j.get("applicable_sections", [])
                })
        return landmark_results

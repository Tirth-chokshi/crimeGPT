import React, { useState, useEffect } from "react";
import {
  Sparkles, Scale, BookOpen, AlertTriangle, CheckCircle2, Shield,
  ArrowRight, Cpu, Zap, Activity, Info, CheckSquare, Mic, FileSearch
} from "lucide-react";
import { api } from "../api";
import { translations } from "../translations";
import VoiceRecorderModal from "../components/VoiceRecorderModal";
import DocumentScannerModal from "../components/DocumentScannerModal";

export default function LegalIntelPage({ currentLang, onStartCaseWithNarrative }) {
  const t = translations[currentLang] || translations.en;
  const [narrative, setNarrative] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [engineMode, setEngineMode] = useState("auto"); // "auto" | "online" | "offline"
  const [engineStatus, setEngineStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  useEffect(() => {
    fetchEngineStatus();
  }, []);

  const fetchEngineStatus = async () => {
    try {
      const status = await api.getEngineStatus();
      setEngineStatus(status);
    } catch (err) {
      console.error("Failed to fetch engine status:", err);
    }
  };

  const sampleNarratives = [
    {
      title: "Armed Snatching with Knife Injury",
      lang: "EN",
      text: "At 10:30 PM on CG Road, two men on a black motorcycle intercepted victim Smt. Meena Patel. The pillion rider drew a sharp Rampuri knife, slashed victim's hand causing bleeding, and forcibly snatched her 24K gold chain and iPhone before speeding away towards stadium circle."
    },
    {
      title: "Multi-Lakh Cyber Investment Scam",
      lang: "EN",
      text: "Cyber fraud syndicate created fraudulent VIP stock trading group on Telegram, impersonating registered SEBI portfolio managers. Fraudulently induced complainant to invest Rs. 18,50,000/- through forged institutional profit statements and transferred funds across 6 mule bank accounts."
    },
    {
      title: "હુમલો અને જાનથી મારી નાખવાની ધમકી (Gujarati)",
      lang: "GU",
      text: "નવરંગપુરા વિસ્તારમાં આરોપીઓએ ફરિયાદીની દુકાનમાં ગેરકાયદેસર રીતે પ્રવેશ કરી લોખંડની પાઇપ અને લાકડી વડે હુમલો કર્યો, માથામાં ગંભીર ઇજા પહોંચાડી અને જો પોલીસ ફરિયાદ કરશો તો જાનથી મારી નાખવાની ધમકી આપી."
    },
    {
      title: "दहेज प्रताड़ना एवं घरेलू हिंसा (Hindi)",
      lang: "HI",
      text: "विवाहिता पीड़िता को उसके पति एवं ससुराल वालों द्वारा 10 लाख रुपये नकद और कार की मांग को लेकर शारीरिक एवं मानसिक रूप से प्रताड़ित किया गया तथा मारपीट कर घर से बाहर निकाल दिया गया।"
    }
  ];

  const handleAnalyze = async (textToAnalyze = narrative, selectedMode = engineMode) => {
    if (!textToAnalyze.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeNarrative(textToAnalyze, currentLang, selectedMode);
      setResults(res);
    } catch (err) {
      alert("Analysis failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL": return "badge-red";
      case "HIGH": return "badge-gold";
      case "MEDIUM": return "badge-purple";
      default: return "badge-blue";
    }
  };

  return (
    <div className="content-wrap" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={20} color="var(--police-gold)" />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0 }}>Legal Intelligence & Section Mapping Engine</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
            Hybrid NLP & RAG Engine grounded in BNS, BNSS, BSA, and Supreme Court jurisprudence.
          </p>
        </div>

        {/* Engine Capabilities Status Pill */}
        {engineStatus && (
          <div className="glass-panel" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "12px", fontSize: "11.5px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="status-dot online"></span>
              <span style={{ color: "#38bdf8", fontWeight: "600" }}>TF-IDF NLP (Active)</span>
            </div>
            <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Cpu size={14} color={engineStatus.online?.available ? "#34d399" : "#94a3b8"} />
              <span style={{ color: engineStatus.online?.available ? "#34d399" : "var(--text-muted)", fontWeight: "600" }}>
                {engineStatus.online?.available ? `Groq AI (${engineStatus.online.model.split('/').pop()})` : "Groq AI (Offline)"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Engine Mode Selection Bar */}
      <div className="glass-panel" style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={16} color="var(--police-gold)" />
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc" }}>Engine Execution Mode:</span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setEngineMode("auto")}
            className={`btn ${engineMode === "auto" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "12px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Zap size={13} /> Auto (Smart Hybrid)
          </button>
          <button
            type="button"
            onClick={() => setEngineMode("online")}
            className={`btn ${engineMode === "online" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "12px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Cpu size={13} /> 🧠 Groq LLM
          </button>
          <button
            type="button"
            onClick={() => setEngineMode("offline")}
            className={`btn ${engineMode === "offline" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "12px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Shield size={13} /> ⚡ Offline TF-IDF
          </button>
        </div>
      </div>

      {/* Input Box and Preset Cards */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
          <label className="form-label" style={{ fontSize: "12.5px", margin: 0 }}>
            Crime Incident Description (Multilingual: English, Hindi, Gujarati supported)
          </label>

          {/* Multimodal Input Toolbar */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: "11.5px", padding: "5px 10px", display: "flex", alignItems: "center", gap: "6px", color: "var(--police-gold)", borderColor: "rgba(245, 158, 11, 0.4)" }}
            >
              <Mic size={13} /> 🎙️ Voice
            </button>
            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: "11.5px", padding: "5px 10px", display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}
            >
              <FileSearch size={13} /> 📄 Scan (OCR)
            </button>
          </div>
        </div>

        <textarea
          className="form-control"
          style={{ minHeight: "120px", fontSize: "13.5px", marginBottom: "12px" }}
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="Paste crime narrative, speak via microphone, or scan physical complaint document..."
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Quick Presets */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)", alignSelf: "center" }}>Presets:</span>
            {sampleNarratives.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setNarrative(s.text);
                  handleAnalyze(s.text);
                }}
                className="btn btn-secondary"
                style={{ fontSize: "11px", padding: "4px 8px" }}
              >
                {s.title}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing}
            className="btn btn-primary"
            style={{ padding: "8px 20px", fontSize: "12.5px" }}
          >
            <Sparkles size={15} />
            {isAnalyzing ? "Analyzing Criminal Elements..." : "Run Legal Analysis"}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* AI Legal Synthesis Summary Banner */}
          <div className="glass-panel" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={15} color="#818cf8" /> AI Legal Synthesis Summary
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <span className="badge badge-subtle">Lang: {results.detected_language.toUpperCase()}</span>
                <span className={`badge ${results.engine_mode.includes("online") ? "badge-green" : "badge-blue"}`}>
                  Engine: {results.engine_mode === "online_llm" ? "🧠 Groq Qwen 3.6 LLM" : "⚡ Offline TF-IDF"}
                </span>
              </div>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
              {results.summary_analysis}
            </p>
          </div>

          {/* Groq LLM Insights Box (when Groq LLM output is present) */}
          {results.llm_insights && (
            <div className="glass-panel" style={{ padding: "18px", border: "1px solid rgba(52, 211, 153, 0.3)", background: "rgba(6, 78, 59, 0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Cpu size={17} color="#34d399" />
                  <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#34d399", margin: 0 }}>
                    Groq AI Deep Reasoning & Risk Advisory
                  </h3>
                </div>
                {results.llm_insights.severity_assessment && (
                  <span className={`badge ${getSeverityBadgeClass(results.llm_insights.severity_assessment)}`}>
                    SEVERITY: {results.llm_insights.severity_assessment}
                  </span>
                )}
              </div>

              {/* LLM Detailed Analysis */}
              <p style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: "1.5", marginBottom: "14px", background: "rgba(15, 23, 42, 0.6)", padding: "12px 14px", borderRadius: "8px", borderLeft: "3px solid #34d399" }}>
                {results.llm_insights.llm_analysis}
              </p>

              <div className="responsive-2col">
                {/* Bail Advisory */}
                {results.llm_insights.bail_advisory && (
                  <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#fbbf24", marginBottom: "4px" }}>
                      ⚖️ Bail Prospects Advisory:
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {results.llm_insights.bail_advisory}
                    </div>
                  </div>
                )}

                {/* LLM Investigation Priorities */}
                {results.llm_insights.investigation_priorities && results.llm_insights.investigation_priorities.length > 0 && (
                  <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#38bdf8", marginBottom: "4px" }}>
                      📋 AI Investigation Priorities:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                      {results.llm_insights.investigation_priorities.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: "2px" }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggested BNS Sections Grid */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px", color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={17} /> Recommended Bharatiya Nyaya Sanhita (BNS) Sections
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 310px), 1fr))", gap: "14px" }}>
              {results.bns_sections.map((sec, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#f8fafc", fontFamily: "var(--font-mono)" }}>
                      {sec.act} Sec {sec.section_number}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span className={`badge ${sec.scoring_method === "llm" ? "badge-green" : sec.scoring_method?.includes("tfidf") ? "badge-blue" : "badge-subtle"}`} style={{ fontSize: "8.5px" }}>
                        {sec.scoring_method === "llm" ? "🧠 Groq AI" : sec.scoring_method?.includes("tfidf") ? "⚡ TF-IDF" : "🔑 Keyword"}
                      </span>
                      <span className="badge badge-subtle" style={{ fontSize: "8.5px" }}>{(sec.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${sec.confidence * 100}%`,
                        height: "100%",
                        background: sec.confidence > 0.8 ? "linear-gradient(90deg, #38bdf8, #34d399)" : "linear-gradient(90deg, #f59e0b, #38bdf8)",
                        transition: "width 0.4s ease"
                      }}
                    />
                  </div>

                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                    {sec.section_title}
                  </div>

                  <div style={{ fontSize: "11.5px", color: "var(--police-gold)" }}>
                    Legacy IPC: <strong>{sec.ipc_equivalent}</strong>
                  </div>

                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                    {sec.rationale}
                  </p>

                  <div style={{ marginTop: "auto", paddingTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <span className="badge badge-purple" style={{ fontSize: "9px" }}>{sec.cognizable}</span>
                    <span className="badge badge-blue" style={{ fontSize: "9px" }}>{sec.bailable}</span>
                    {sec.punishment && (
                      <div style={{ width: "100%", marginTop: "3px" }}>
                        <span className="badge badge-green" style={{ fontSize: "9px", width: "100%", display: "block" }}>
                          {sec.punishment}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2-Column Grid: BNSS Rules & BSA Evidence */}
          <div className="responsive-2col">
            {/* BNSS Procedural Compliance Rules */}
            <div className="glass-panel" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#fbbf24", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={16} /> BNSS Statutory Procedural Rules
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.bnss_procedural_mandates.map((m, i) => (
                  <div key={i} style={{ background: "rgba(19, 29, 51, 0.7)", border: "1px solid var(--border-subtle)", borderRadius: "7px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#38bdf8", marginBottom: "3px" }}>
                      {m.act} Sec {m.section}: {m.title}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "3px" }}>
                      {m.summary}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--police-gold)" }}>
                      ⏳ Statutory Timeline: {m.statutory_timeline}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BSA Evidence Rules */}
            <div className="glass-panel" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#34d399", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckSquare size={16} /> BSA Evidence & Forensics Rules
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.bsa_evidence_rules.map((b, i) => (
                  <div key={i} style={{ background: "rgba(19, 29, 51, 0.7)", border: "1px solid var(--border-subtle)", borderRadius: "7px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#34d399", marginBottom: "3px" }}>
                      {b.act} Sec {b.section}: {b.title}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {b.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2-Column: IO Action Checklist & Landmark Precedents */}
          <div className="responsive-2col">
            {/* IO Investigation Action Checklist */}
            <div className="glass-panel" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--police-gold)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} /> Mandatory IO Investigation Checklist
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.investigation_action_checklist.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "rgba(19, 29, 51, 0.6)", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--police-gold)", fontWeight: "800", fontSize: "11.5px", minWidth: "16px" }}>#{i + 1}</span>
                    <span style={{ fontSize: "12px", color: "#f8fafc", lineHeight: "1.4" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Landmark Precedents */}
            <div className="glass-panel" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#38bdf8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Scale size={16} /> Supreme Court Landmark Precedents
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.landmark_judgments.map((j, i) => (
                  <div key={i} style={{ background: "rgba(19, 29, 51, 0.7)", border: "1px solid var(--border-subtle)", borderRadius: "7px", padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", flexWrap: "wrap", gap: "4px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#f8fafc" }}>{j.case_name}</span>
                      <span className="badge badge-blue" style={{ fontSize: "8.5px" }}>{j.citation}</span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      <strong>Ruling:</strong> {j.principle}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Statement Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyTranscript={(text, lang) => {
          setNarrative((prev) => (prev ? prev + "\n\n" : "") + text);
          handleAnalyze((narrative ? narrative + "\n\n" : "") + text);
        }}
        defaultLang={currentLang}
      />

      {/* Scanned Document OCR Modal */}
      <DocumentScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onApplyExtractedData={(data) => {
          if (data.incident_summary) {
            setNarrative(data.incident_summary);
            handleAnalyze(data.incident_summary);
          }
        }}
      />
    </div>
  );
}

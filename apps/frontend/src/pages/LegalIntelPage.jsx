import React, { useState, useEffect } from "react";
import {
  Scale, BookOpen, CheckCircle2, Shield,
  Cpu, Activity, CheckSquare, Mic, FileSearch, AlertCircle
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
  const [errorMsg, setErrorMsg] = useState("");
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
      title: "હુમલો અને ધમકી (Gujarati)",
      lang: "GU",
      text: "નવરંગપુરા વિસ્તારમાં આરોપીઓએ ફરિયાદીની દુકાનમાં ગેરકાયદેસર રીતે પ્રવેશ કરી લોખંડની પાઇપ અને લાકડી વડે હુમલો કર્યો, માથામાં ગંભીર ઇજા પહોંચાડી અને જો પોલીસ ફરિયાદ કરશો તો જાનથી મારી નાખવાની ધમકી આપી."
    },
    {
      title: "दहेज प्रताड़ना (Hindi)",
      lang: "HI",
      text: "विवाहिता पीड़िता को उसके पति एवं ससुराल वालों द्वारा 10 लाख रुपये नकद और कार की मांग को लेकर शारीरिक एवं मानसिक रूप से प्रताड़ित किया गया तथा मारपीट कर घर से बाहर निकाल दिया गया।"
    }
  ];

  const handleAnalyze = async (textToAnalyze = narrative, selectedMode = engineMode) => {
    if (!textToAnalyze.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg("");
    try {
      const res = await api.analyzeNarrative(textToAnalyze, currentLang, selectedMode);
      setResults(res);
    } catch (err) {
      setErrorMsg("Analysis failed: " + err.message);
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
    <div className="content-wrap" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "rgba(108, 21, 30, 0.22)", border: "1px solid rgba(108, 21, 30, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Scale size={18} color="#EFA2A7" />
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-heading)", margin: 0 }}>
              Legal Intelligence & Statutory Section Mapping
            </h1>
          </div>
        </div>

        {/* Engine Capabilities Status Pill */}
        {engineStatus && (
          <div className="glass-panel" style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2C7A74" }}></span>
              <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>Statutory NLP Matcher</span>
            </div>
            <div style={{ borderLeft: "1px solid var(--border-medium)", paddingLeft: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Cpu size={13} color={engineStatus.online?.available ? "#2C7A74" : "var(--text-muted)"} />
              <span style={{ color: engineStatus.online?.available ? "#2C7A74" : "var(--text-muted)", fontWeight: "600" }}>
                {engineStatus.online?.available ? `Cloud LLM (${engineStatus.online.model.split('/').pop()})` : "Cloud LLM (Offline)"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Engine Mode Selection Bar */}
      <div className="glass-panel" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={15} color="#6C151E" />
          <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-primary)" }}>Execution Mode:</span>
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setEngineMode("auto")}
            className={`btn ${engineMode === "auto" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "12px", padding: "5px 11px" }}
          >
            Auto (Hybrid)
          </button>
          <button
            type="button"
            onClick={() => setEngineMode("online")}
            className={`btn ${engineMode === "online" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "12px", padding: "5px 11px" }}
          >
            Cloud LLM (Groq)
          </button>
          <button
            type="button"
            onClick={() => setEngineMode("offline")}
            className={`btn ${engineMode === "offline" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "12px", padding: "5px 11px" }}
          >
            Local Corpus Matcher
          </button>
        </div>
      </div>

      {/* Input Box and Preset Cards */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
          <label className="form-label" style={{ fontSize: "12.5px", margin: 0 }}>
            Incident Narrative (Multilingual: English, Hindi, Gujarati supported)
          </label>

          {/* Multimodal Input Toolbar */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: "11.5px", padding: "4px 9px", display: "flex", alignItems: "center", gap: "5px" }}
            >
              <Mic size={13} color="var(--police-gold)" /> Voice Input
            </button>
            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: "11.5px", padding: "4px 9px", display: "flex", alignItems: "center", gap: "5px" }}
            >
              <FileSearch size={13} color="var(--police-blue)" /> Document Scan (OCR)
            </button>
          </div>
        </div>

        <textarea
          className="form-control"
          style={{ minHeight: "110px", fontSize: "13px", marginBottom: "12px" }}
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="Paste crime narrative, record voice complaint, or upload scanned complaint memo..."
        />

        {errorMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(248, 81, 73, 0.12)", border: "1px solid rgba(248, 81, 73, 0.35)", padding: "8px 12px", borderRadius: "6px", color: "var(--police-red)", fontSize: "12px", marginBottom: "12px" }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          {/* Quick Presets */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Sample Cases:</span>
            {sampleNarratives.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setNarrative(s.text);
                  handleAnalyze(s.text);
                }}
                className="btn btn-secondary"
                style={{ fontSize: "11.5px", padding: "4px 8px" }}
              >
                {s.title}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing}
            className="btn btn-primary"
            style={{ padding: "8px 18px", fontSize: "13px" }}
          >
            <Scale size={15} />
            {isAnalyzing ? "Mapping Statutory Sections..." : "Analyze Incident"}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Statutory Legal Synthesis Summary Banner */}
          <div className="glass-panel" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Scale size={15} color="var(--police-blue)" /> Statutory Legal Synthesis Summary
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <span className="badge badge-subtle">Lang: {results.detected_language.toUpperCase()}</span>
                <span className={`badge ${results.engine_mode.includes("online") ? "badge-green" : "badge-blue"}`}>
                  Engine: {results.engine_mode === "online_llm" ? "Cloud LLM (Groq)" : "Statutory NLP Matcher"}
                </span>
              </div>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
              {results.summary_analysis}
            </p>
          </div>

          {/* Reasoning & Risk Advisory Box */}
          {results.llm_insights && (
            <div className="glass-panel" style={{ padding: "16px", border: "1px solid var(--border-medium)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Cpu size={15} color="var(--police-blue)" />
                  <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                    Statutory Reasoning &amp; Risk Advisory
                  </h3>
                </div>
                {results.llm_insights.severity_assessment && (
                  <span className={`badge ${getSeverityBadgeClass(results.llm_insights.severity_assessment)}`}>
                    SEVERITY: {results.llm_insights.severity_assessment}
                  </span>
                )}
              </div>

              {/* LLM Detailed Analysis */}
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "12px", background: "var(--bg-surface-raised)", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid var(--police-blue)" }}>
                {results.llm_insights.llm_analysis}
              </p>

              <div className="responsive-2col">
                {/* Bail Advisory */}
                {results.llm_insights.bail_advisory && (
                  <div style={{ background: "var(--bg-surface-raised)", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--police-gold)", marginBottom: "4px" }}>
                      Bail Prospects Advisory:
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {results.llm_insights.bail_advisory}
                    </div>
                  </div>
                )}

                {/* LLM Investigation Priorities */}
                {results.llm_insights.investigation_priorities && results.llm_insights.investigation_priorities.length > 0 && (
                  <div style={{ background: "var(--bg-surface-raised)", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--police-blue)", marginBottom: "4px" }}>
                      Investigation Priorities:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
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
            <h2 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "10px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={16} color="var(--police-blue)" /> Recommended Bharatiya Nyaya Sanhita (BNS) Sections
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 310px), 1fr))", gap: "12px" }}>
              {results.bns_sections.map((sec, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "7px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                      {sec.act} Sec {sec.section_number}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span className={`badge ${sec.scoring_method === "llm" ? "badge-green" : "badge-blue"}`} style={{ fontSize: "9px" }}>
                        {sec.scoring_method === "llm" ? "Cloud LLM" : "TF-IDF"}
                      </span>
                      <span className="badge badge-subtle" style={{ fontSize: "9px" }}>{(sec.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div style={{ width: "100%", height: "3px", background: "var(--border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${sec.confidence * 100}%`,
                        height: "100%",
                        background: sec.confidence > 0.8 ? "var(--police-green)" : "var(--police-blue)",
                        transition: "width 0.3s ease"
                      }}
                    />
                  </div>

                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
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
                        <span className="badge badge-subtle" style={{ fontSize: "9px", width: "100%", display: "block" }}>
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
            <div className="glass-panel" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--police-gold)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield size={15} /> BNSS Statutory Procedural Rules
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.bnss_procedural_mandates.map((m, i) => (
                  <div key={i} style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--police-blue)", marginBottom: "3px" }}>
                      {m.act} Sec {m.section}: {m.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "3px" }}>
                      {m.summary}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--police-gold)" }}>
                      Statutory Timeline: {m.statutory_timeline}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BSA Evidence Rules */}
            <div className="glass-panel" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--police-green)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckSquare size={15} /> BSA Evidence &amp; Forensics Rules
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.bsa_evidence_rules.map((b, i) => (
                  <div key={i} style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--police-green)", marginBottom: "3px" }}>
                      {b.act} Sec {b.section}: {b.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
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
            <div className="glass-panel" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--police-gold)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={15} /> Mandatory IO Investigation Checklist
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.investigation_action_checklist.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "var(--bg-surface-raised)", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--police-gold)", fontWeight: "700", fontSize: "11.5px", minWidth: "16px" }}>#{i + 1}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.4" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Landmark Precedents */}
            <div className="glass-panel" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--police-blue)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Scale size={15} /> Supreme Court Landmark Precedents
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.landmark_judgments.map((j, i) => (
                  <div key={i} style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", flexWrap: "wrap", gap: "4px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)" }}>{j.case_name}</span>
                      <span className="badge badge-blue" style={{ fontSize: "9px" }}>{j.citation}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
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

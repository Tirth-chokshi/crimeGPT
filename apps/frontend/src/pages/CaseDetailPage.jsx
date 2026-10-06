import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, FileText, Download, Printer, Plus, Scale, Clock, 
  ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, 
  Eye, BookOpen, Layers, History, Package, UserCheck, ShieldAlert,
  MessageSquare, ExternalLink, Code, Copy, Check, Lock
} from "lucide-react";
import { api } from "../api";
import { translations } from "../translations";
import ComplianceClockPanel from "../components/ComplianceClockPanel";
import CaseDiaryTimeline from "../components/CaseDiaryTimeline";
import EvidenceVaultPanel from "../components/EvidenceVaultPanel";
import CCTNSSyncPanel from "../components/CCTNSSyncPanel";

export default function CaseDetailPage({ caseId, onBack, currentLang, currentRole }) {
  const t = translations[currentLang] || translations.en;
  const [caseData, setCaseData] = useState(null);
  const [diaryData, setDiaryData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [isExportingDiary, setIsExportingDiary] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [legalIntel, setLegalIntel] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("documents");
  const [loading, setLoading] = useState(true);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);
  const [successToast, setSuccessToast] = useState("");
  const [showAddDiaryModal, setShowAddDiaryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [copiedAuditId, setCopiedAuditId] = useState(null);

  const handleCopyAuditHash = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAuditId(id);
    setTimeout(() => setCopiedAuditId(null), 2000);
  };

  // New Sprint Feature Modals
  const [printPreviewDoc, setPrintPreviewDoc] = useState(null);
  const [lersModal, setLersModal] = useState(null); // { accused, data: null, lang: 'en', loading: false }
  const [bharatpolModal, setBharatpolModal] = useState(null); // { accused, data: null, loading: false }
  const [copiedLers, setCopiedLers] = useState(false);

  // New Diary Event Form
  const [diaryForm, setDiaryForm] = useState({
    step_title: "",
    step_type: "WITNESS_EXAMINATION",
    description: "",
    location: "",
    officer_name: "Inspector R. K. Jadeja",
    officer_badge: "GJ-AHM-4421",
    statutory_deadline_reference: ""
  });

  // Status Form
  const [statusForm, setStatusForm] = useState({
    newStatus: "INVESTIGATION",
    notes: ""
  });

  const loadCaseFull = async () => {
    setLoading(true);
    try {
      const [c, d, docs, intel, logs, comp] = await Promise.all([
        api.getCaseById(caseId),
        api.getCaseDiary(caseId).catch(() => null),
        api.getCaseDocuments(caseId).catch(() => []),
        api.getCaseLegalRecommendations(caseId).catch(() => null),
        api.getAuditLogs(caseId).catch(() => []),
        api.getComplianceClocks(caseId).catch(() => null)
      ]);
      setCaseData(c);
      setDiaryData(d);
      setDocuments(docs);
      setLegalIntel(intel);
      setAuditLogs(logs);
      setComplianceData(comp);

      if (docs && docs.length > 0) {
        setSelectedDocPreview(docs[0]);
      }
    } catch (err) {
      console.error("Error loading case:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      loadCaseFull();
    }
  }, [caseId]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  // Generate Document
  const handleGenerateDocument = async (docType) => {
    setGeneratingDoc(true);
    try {
      const docResp = await api.generateDocument(
        caseId,
        docType,
        currentLang,
        null,
        caseData.investigating_officer_name
      );
      showToast(`${t.docTypes[docType] || docType} generated and saved.`);
      // Reload documents and diary
      const [updatedDocs, updatedDiary, updatedLogs] = await Promise.all([
        api.getCaseDocuments(caseId),
        api.getCaseDiary(caseId),
        api.getAuditLogs(caseId)
      ]);
      setDocuments(updatedDocs);
      setDiaryData(updatedDiary);
      setAuditLogs(updatedLogs);
      setSelectedDocPreview(docResp);
    } catch (err) {
      alert("Failed to generate document: " + err.message);
    } finally {
      setGeneratingDoc(false);
    }
  };

  // Add Diary Event
  const handleAddDiaryEvent = async (e) => {
    e.preventDefault();
    try {
      await api.addDiaryEvent(caseId, diaryForm);
      setShowAddDiaryModal(false);
      setDiaryForm({
        step_title: "",
        step_type: "WITNESS_EXAMINATION",
        description: "",
        location: "",
        officer_name: caseData.investigating_officer_name,
        officer_badge: caseData.investigating_officer_badge,
        statutory_deadline_reference: ""
      });
      showToast("Case diary step logged successfully.");
      const updatedDiary = await api.getCaseDiary(caseId);
      setDiaryData(updatedDiary);
      const updatedLogs = await api.getAuditLogs(caseId);
      setAuditLogs(updatedLogs);
    } catch (err) {
      alert("Error adding diary step: " + err.message);
    }
  };

  // Export Case Diary DOCX
  const handleExportCaseDiaryDocx = () => {
    setIsExportingDiary(true);
    const url = api.getCaseDiaryExportUrl(caseId);
    window.open(url, "_blank");
    setTimeout(() => setIsExportingDiary(false), 2000);
    showToast("Case Diary (.docx) export generated and downloaded.");
  };

  // Update Status
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateCaseStatus(
        caseId,
        statusForm.newStatus,
        statusForm.notes,
        caseData.investigating_officer_name
      );
      setCaseData(updated);
      setShowStatusModal(false);
      showToast("Investigation status updated: " + statusForm.newStatus);
      const updatedLogs = await api.getAuditLogs(caseId);
      setAuditLogs(updatedLogs);
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  // Open WhatsApp LERS Modal
  const handleOpenLersModal = async (accusedObj, lang = "en") => {
    setLersModal({ accused: accusedObj, data: null, lang, loading: true });
    try {
      const data = await api.getWhatsappLers(caseId, lang);
      setLersModal({ accused: accusedObj, data, lang, loading: false });
    } catch (err) {
      setLersModal({ accused: accusedObj, data: { error: err.message }, lang, loading: false });
    }
  };

  // Open BharatPol Query Modal
  const handleOpenBharatpolModal = async (accusedObj) => {
    setBharatpolModal({ accused: accusedObj, data: null, loading: true });
    try {
      const data = await api.queryBharatpolRecord(accusedObj.name);
      setBharatpolModal({ accused: accusedObj, data, loading: false });
    } catch (err) {
      setBharatpolModal({ accused: accusedObj, data: { error: err.message }, loading: false });
    }
  };

  const copyLersNotice = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLers(true);
    setTimeout(() => setCopiedLers(false), 2000);
  };

  if (loading || !caseData) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: "12px", animation: "spin 1s linear infinite" }} />
        <div>Loading Case Command Dossier...</div>
      </div>
    );
  }

  const primaryVictim = (caseData.persons || []).find(p => p.person_type === "VICTIM");
  const accusedList = (caseData.persons || []).filter(p => p.person_type === "ACCUSED");
  const witnesses = (caseData.persons || []).filter(p => p.person_type === "WITNESS");

  const docTypesList = [
    { id: "PURVANI_CHARGESHEET", code: "FORM-193-CS", desc: "Supplementary / Final Chargesheet under Section 193 BNSS" },
    { id: "REMAND_REQUEST", code: "FORM-187-REMAND", desc: "Police Custody Remand Application under Section 187 BNSS" },
    { id: "MEDICAL_LETTER", code: "FORM-53-MLC", desc: "Medico-Legal Examination Request to CMO under Sec 53 BNSS" },
    { id: "SEIZURE_RECEIPT", code: "FORM-105-SEIZURE", desc: "Seizure Receipt & Mudamal Panchanama under Sec 105 BNSS" },
    { id: "COURT_CUSTODY_LETTER", code: "FORM-187-JC", desc: "Judicial Remand Forwarding Letter to Magistrate" },
    { id: "ACCUSED_PANCHANAMA", code: "FORM-35-PANCHANAMA", desc: "Arrest & Body Inspection Memo (D.K. Basu Compliance)" },
    { id: "FACE_IDENTIFICATION_FORM", code: "FORM-54-TIP", desc: "Accused Test Identification Parade (TIP) Protocol" }
  ];

  return (
    <div className="content-wrap" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "#ffffff",
          padding: "14px 22px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: "600",
          fontSize: "13.5px",
          zIndex: 1000
        }}>
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: "12.5px" }}>
          <ArrowLeft size={15} /> Back to Case Explorer
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => setShowStatusModal(true)} className="btn btn-outline" style={{ fontSize: "12px", padding: "6px 12px" }}>
            <Layers size={13} /> {t.caseDetail.updateStatusBtn}
          </button>
          <button onClick={() => setShowAddDiaryModal(true)} className="btn btn-cyan" style={{ fontSize: "12px", padding: "6px 12px" }}>
            <Plus size={13} /> {t.caseDetail.addDiaryStepBtn}
          </button>
        </div>
      </div>

      {/* Case Header Hero Dossier */}
      <div className="glass-panel" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "20px", fontWeight: "800", fontFamily: "var(--font-mono)", color: "var(--bordo)", margin: 0 }}>
                {caseData.fir_number}
              </h1>
              <span className="badge badge-blue">{t.status[caseData.status] || caseData.status}</span>
              <span className="badge badge-subtle">{caseData.police_station}</span>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <span>FIR Date: <strong>{new Date(caseData.fir_date || caseData.created_at).toLocaleDateString()}</strong></span>
              <span>Location: <strong>{caseData.incident_place}</strong></span>
              <span>IO: <strong>{caseData.investigating_officer_name} ({caseData.investigating_officer_badge})</strong></span>
            </div>
          </div>

          {/* Quick Stats on Right */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ background: "var(--bg-surface-raised)", padding: "6px 12px", borderRadius: "7px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Persons</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-heading)" }}>{(caseData.persons || []).length}</div>
            </div>
            <div style={{ background: "var(--bg-surface-raised)", padding: "6px 12px", borderRadius: "7px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>BNS Sections</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-heading)" }}>{(caseData.sections || []).length}</div>
            </div>
            <div style={{ background: "var(--bg-surface-raised)", padding: "6px 12px", borderRadius: "7px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Docs</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--bordo)" }}>{documents.length} / 7</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", overflowX: "auto" }}>
        {[
          { id: "documents", label: t.caseDetail.tabs.documents || "Official Documents" },
          { id: "compliance", label: "Compliance Clocks" },
          { id: "diary", label: t.caseDetail.tabs.diary || "Case Diary (Sec 187)" },
          { id: "evidence", label: "Evidence Vault (BSA Sec 63)" },
          { id: "cctns", label: "CCTNS & BharatPol Sync" },
          { id: "legalIntel", label: t.caseDetail.tabs.legalIntel || "Legal Intelligence" },
          { id: "overview", label: t.caseDetail.tabs.overview || "Overview" },
          { id: "seizures", label: t.caseDetail.tabs.seizures || "Seizures / Mudamal" },
          { id: "audit", label: t.caseDetail.tabs.audit || "Audit Log" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 14px",
              borderRadius: "7px",
              background: activeTab === tab.id ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === tab.id ? "var(--police-blue)" : "var(--text-secondary)",
              border: activeTab === tab.id ? "1px solid var(--police-blue)" : "1px solid transparent",
              fontWeight: activeTab === tab.id ? "700" : "500",
              fontSize: "12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DOCUMENT GENERATION CENTER */}
      {activeTab === "documents" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "16px" }}>
          {/* Left Column: All 7 Document Generators */}
          <div className="glass-panel" style={{ padding: "18px", height: "fit-content" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", color: "var(--police-gold)", marginBottom: "4px" }}>
              Official Police Documents (7)
            </h2>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px" }}>
              Generate BNSS-compliant documents with unified case data or preview print-ready copies.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {docTypesList.map((doc) => {
                const existing = documents.find(d => d.doc_type === doc.id);
                const isSelected = selectedDocPreview && selectedDocPreview.doc_type === doc.id;

                return (
                  <div
                    key={doc.id}
                    style={{
                      background: isSelected ? "rgba(108, 21, 30, 0.12)" : "var(--bg-surface-raised)",
                      border: isSelected ? "1px solid var(--bordo)" : "1px solid var(--border-subtle)",
                      borderRadius: "7px",
                      padding: "10px 12px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: isSelected ? "var(--bordo)" : "var(--text-heading)" }}>
                        {t.docTypes[doc.id] || doc.id}
                      </span>
                      {existing ? (
                        <span className="badge badge-green" style={{ fontSize: "8.5px" }}>READY</span>
                      ) : (
                        <span className="badge badge-gold" style={{ fontSize: "8.5px" }}>PENDING</span>
                      )}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginBottom: "8px" }}>
                      {doc.desc}
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => handleGenerateDocument(doc.id)}
                        disabled={generatingDoc}
                        className="btn btn-primary"
                        style={{ padding: "4px 8px", fontSize: "11px", flex: 1 }}
                      >
                        <FileText size={12} /> {existing ? "Regenerate" : "Generate"}
                      </button>

                      <button
                        onClick={() => setPrintPreviewDoc({ docType: doc.id, title: t.docTypes[doc.id] || doc.id })}
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                        title="Print / Save as PDF (Ctrl+P)"
                      >
                        <Printer size={12} color="var(--police-gold)" />
                      </button>

                      {existing && (
                        <button
                          onClick={() => setSelectedDocPreview(existing)}
                          className="btn btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                        >
                          <Eye size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Document Preview Sheet & Download Controls */}
          <div>
            {selectedDocPreview ? (
              <div>
                {/* Actions Toolbar */}
                <div className="glass-panel" style={{ padding: "12px 18px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-heading)" }}>
                      {selectedDocPreview.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      File: {selectedDocPreview.file_name} • Generated: {new Date(selectedDocPreview.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setPrintPreviewDoc({ docType: selectedDocPreview.doc_type, title: selectedDocPreview.title })}
                      className="btn btn-outline"
                      style={{ fontSize: "11.5px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Printer size={14} color="var(--police-gold)" /> Print / Save as PDF (Ctrl+P)
                    </button>

                    {selectedDocPreview.file_name && (
                      <a
                        href={api.getDownloadUrl(selectedDocPreview.file_name)}
                        download
                        className="btn btn-primary"
                        style={{ fontSize: "11.5px", padding: "6px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <Download size={14} /> Download .DOCX
                      </a>
                    )}
                  </div>
                </div>

                {/* Printable Document Paper Sheet */}
                <div className="doc-sheet">
                  <div className="doc-header-seal">
                    <h2 style={{ fontSize: "15px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px" }}>
                      GUJARAT POLICE DEPARTMENT
                    </h2>
                    <h3 style={{ fontSize: "12px", fontWeight: "normal", color: "#475569" }}>
                      {caseData.police_station.toUpperCase()}, {caseData.district.toUpperCase()}
                    </h3>
                    <div style={{ margin: "12px 0 4px", fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", color: "#0f172a" }}>
                      {selectedDocPreview.structured_content?.title || selectedDocPreview.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                      {selectedDocPreview.structured_content?.sub_title || "Under the Bharatiya Nagarik Suraksha Sanhita, 2023"}
                    </div>
                  </div>

                  {/* Metadata Table */}
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ width: "30%", fontWeight: "bold" }}>FIR / Case Number:</td>
                        <td>{caseData.fir_number} (Dated: {new Date(caseData.fir_date || caseData.created_at).toLocaleDateString()})</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: "bold" }}>Police Station &amp; District:</td>
                        <td>{caseData.police_station}, {caseData.district}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: "bold" }}>Investigating Officer (IO):</td>
                        <td>{caseData.investigating_officer_name} [{caseData.investigating_officer_badge}], {caseData.investigating_officer_rank}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: "bold" }}>Sections Applied (BNS):</td>
                        <td>
                          {caseData.sections.map(s => `${s.act} Sec ${s.section_number} (${s.section_title})`).join(", ") || "Under Investigation"}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Parties Details */}
                  <h4 style={{ margin: "14px 0 6px", fontSize: "12.5px", textTransform: "uppercase", color: "#1e293b", borderBottom: "1px solid #cbd5e1", paddingBottom: "3px" }}>
                    1. Involved Parties &amp; Accused
                  </h4>
                  {primaryVictim && (
                    <p style={{ margin: "4px 0", fontSize: "11.5px" }}>
                      <strong>Complainant / Victim:</strong> {primaryVictim.name}, S/o W/o {primaryVictim.father_or_husband_name || "N/A"}, Age: {primaryVictim.age || "Adult"}, {primaryVictim.gender}<br />
                      Address: {primaryVictim.address || "N/A"} • Phone: {primaryVictim.phone || "N/A"}
                    </p>
                  )}
                  {accusedList.map((a, i) => (
                    <p key={i} style={{ margin: "4px 0", fontSize: "11.5px" }}>
                      <strong>Accused #{i+1}:</strong> {a.name}, S/o {a.father_or_husband_name || "N/A"}, Age: {a.age || "Adult"}, Custody Status: <u>{a.custody_status}</u><br />
                      Address: {a.address || "N/A"}<br />
                      Arrest Date &amp; Time: {a.arrest_date_time || "Under Investigation / Free"}
                    </p>
                  ))}

                  {/* Facts Summary */}
                  <h4 style={{ margin: "14px 0 6px", fontSize: "12.5px", textTransform: "uppercase", color: "#1e293b", borderBottom: "1px solid #cbd5e1", paddingBottom: "3px" }}>
                    2. Brief Incident Narrative &amp; Investigation Findings
                  </h4>
                  <p style={{ fontSize: "11.5px", lineHeight: "1.5" }}>{caseData.incident_summary}</p>

                  {/* Seizures */}
                  {caseData.seizures && caseData.seizures.length > 0 && (
                    <>
                      <h4 style={{ margin: "14px 0 6px", fontSize: "12.5px", textTransform: "uppercase", color: "#1e293b", borderBottom: "1px solid #cbd5e1", paddingBottom: "3px" }}>
                        3. Seized Articles &amp; Mudamal Inventory
                      </h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Qty / Val</th>
                            <th>Video Ref ID (Sec 105 BNSS)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caseData.seizures.map((sz, i) => (
                            <tr key={i}>
                              <td>{sz.item_name}</td>
                              <td>{sz.category}</td>
                              <td>{sz.quantity_or_value || "1 unit"}</td>
                              <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{sz.videography_ref_id || "VID-LOG-BNSS"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {/* Signatures */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", fontSize: "11.5px" }}>
                    <div>
                      Signature of Complainant / Panch / Accused<br />
                      ____________________________________<br />
                      Date: {new Date().toLocaleDateString()}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      Signature &amp; Seal of Investigating Officer (IO)<br /><br />
                      <strong>({caseData.investigating_officer_name})</strong><br />
                      {caseData.investigating_officer_rank}<br />
                      Badge No: {caseData.investigating_officer_badge}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: "50px", textAlign: "center", color: "var(--text-muted)" }}>
                <FileText size={36} color="var(--police-blue)" style={{ marginBottom: "10px" }} />
                <h3 style={{ fontSize: "15px", color: "var(--text-heading)", marginBottom: "4px" }}>Select or Generate a Document</h3>
                <p style={{ fontSize: "12px" }}>Choose from the 7 legal documents on the left panel to synthesize and view formatted copy.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: COMPLIANCE CLOCKS */}
      {activeTab === "compliance" && (
        <ComplianceClockPanel
          complianceData={complianceData}
          activeAlerts={complianceData?.active_alerts || []}
          onExportDocx={handleExportCaseDiaryDocx}
          isExporting={isExportingDiary}
        />
      )}

      {/* TAB: CASE DIARY & BNSS TIMELINE */}
      {activeTab === "diary" && (
        <CaseDiaryTimeline
          caseId={caseId}
          firNumber={caseData.fir_number}
          events={diaryData?.events || []}
          onEventAdded={async () => {
            const [d, c, logs] = await Promise.all([
              api.getCaseDiary(caseId),
              api.getComplianceClocks(caseId).catch(() => null),
              api.getAuditLogs(caseId).catch(() => [])
            ]);
            setDiaryData(d);
            setComplianceData(c);
            setAuditLogs(logs);
            showToast("Investigation step logged in Case Diary.");
          }}
          onExportDocx={handleExportCaseDiaryDocx}
          isExporting={isExportingDiary}
          currentUserRole={currentRole}
          officerName={caseData.investigating_officer_name}
          officerBadge={caseData.investigating_officer_badge}
        />
      )}

      {/* TAB: BSA ELECTRONIC EVIDENCE VAULT */}
      {activeTab === "evidence" && (
        <EvidenceVaultPanel
          caseId={caseId}
          firNumber={caseData.fir_number}
          seizures={caseData.seizures || []}
          onSeizureUpdated={async () => {
            const [c, logs] = await Promise.all([
              api.getCaseById(caseId),
              api.getAuditLogs(caseId).catch(() => [])
            ]);
            setCaseData(c);
            setAuditLogs(logs);
          }}
          officerName={caseData.investigating_officer_name}
          officerBadge={caseData.investigating_officer_badge}
        />
      )}

      {/* TAB: CCTNS & E-SAKSHYA SYNC */}
      {activeTab === "cctns" && (
        <CCTNSSyncPanel
          caseId={caseId}
          firNumber={caseData.fir_number}
          caseData={caseData}
          officerName={caseData.investigating_officer_name}
          officerBadge={caseData.investigating_officer_badge}
        />
      )}

      {/* TAB: LEGAL INTELLIGENCE & PRECEDENTS */}
      {activeTab === "legalIntel" && (
        <div>
          {legalIntel ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Summary Analysis */}
              <div className="glass-panel" style={{ padding: "18px", border: "1px solid var(--border-gold)", background: "var(--bg-surface-raised)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Scale size={16} color="var(--police-gold)" />
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--police-gold)", margin: 0 }}>
                    Incident Legal Analysis & Statutory Mapping
                  </h3>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5", margin: 0 }}>
                  {legalIntel.summary_analysis}
                </p>
              </div>

              {/* BNS Sections with IPC Mapping */}
              <div className="glass-panel" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px", color: "var(--bordo)" }}>
                  Suggested Bharatiya Nyaya Sanhita (BNS) Sections
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
                  {legalIntel.bns_sections.map((s, idx) => (
                    <div key={idx} style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--bordo)" }}>
                          {s.act} Sec {s.section_number}
                        </span>
                        <span className="badge badge-gold">{(s.confidence * 100).toFixed(0)}% MATCH</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                        {s.section_title}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--police-gold)", marginBottom: "6px" }}>
                        IPC Equivalent: <strong>{s.ipc_equivalent || "N/A"}</strong>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "8px", lineHeight: "1.4" }}>
                        {s.rationale}
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <span className="badge badge-purple" style={{ fontSize: "9.5px" }}>{s.cognizable}</span>
                        <span className="badge badge-blue" style={{ fontSize: "9.5px" }}>{s.bailable}</span>
                        <span className="badge badge-green" style={{ fontSize: "9.5px" }}>{s.punishment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Landmark Judgments */}
              <div className="glass-panel" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px", color: "var(--police-gold)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Scale size={16} /> Landmark Supreme Court Precedents
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {legalIntel.landmark_judgments.map((j, idx) => (
                    <div key={idx} style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "7px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-heading)" }}>
                          {j.case_name}
                        </span>
                        <span className="badge badge-blue" style={{ fontSize: "9.5px" }}>{j.citation}</span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--police-blue)", marginBottom: "4px" }}>
                        {j.subject}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                        <strong>Legal Principle:</strong> {j.principle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
              Loading Legal Recommendations...
            </div>
          )}
        </div>
      )}

      {/* TAB: UNIFIED DATA POOL & OVERVIEW */}
      {activeTab === "overview" && (
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--bordo)", marginBottom: "16px" }}>
            Unified Case Pool Entities
          </h2>

          <div className="responsive-2col">
            <div>
              <h3 style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--police-gold)", marginBottom: "10px" }}>
                Enrolled Parties ({caseData.persons.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {caseData.persons.map((p, i) => (
                  <div key={i} style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "7px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700" }}>{p.name}</span>
                      <span className={`badge ${p.person_type === 'ACCUSED' ? 'badge-red' : p.person_type === 'VICTIM' ? 'badge-blue' : 'badge-gold'}`} style={{ fontSize: "9px" }}>
                        {p.person_type}
                      </span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "3px" }}>
                      Age: {p.age || "Adult"} • {p.gender} • Ph: {p.phone || "N/A"}
                    </div>
                    {p.address && (
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Address: {p.address}
                      </div>
                    )}

                    {/* Accused Actions (LERS & BharatPol) */}
                    {p.person_type === "ACCUSED" && (
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleOpenLersModal(p, currentLang)}
                          className="btn btn-secondary"
                          style={{ padding: "3px 8px", fontSize: "10.5px", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <MessageSquare size={11} color="#34d399" /> WhatsApp Notice (Sec 35)
                        </button>
                        <button
                          onClick={() => handleOpenBharatpolModal(p)}
                          className="btn btn-secondary"
                          style={{ padding: "3px 8px", fontSize: "10.5px", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <ShieldAlert size={11} color="var(--bordo)" /> BharatPol Check
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--police-gold)", marginBottom: "10px" }}>
                Case Incident Facts
              </h3>
              <div style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "7px", padding: "14px", fontSize: "12.5px", lineHeight: "1.5", color: "var(--text-primary)" }}>
                {caseData.incident_summary}
              </div>

              {caseData.incident_summary_original && (
                <div style={{ marginTop: "10px", background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "7px", padding: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <div style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--bordo)", marginBottom: "3px" }}>Vernacular Original:</div>
                  {caseData.incident_summary_original}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SEIZURES & MUDAMAL VAULT */}
      {activeTab === "seizures" && (
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--bordo)", marginBottom: "14px" }}>
            Mudamal Inventory &amp; Evidence Locker (Sec 105 BNSS / Sec 63 BSA)
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "8px" }}>Item Name</th>
                  <th style={{ padding: "8px" }}>Category</th>
                  <th style={{ padding: "8px" }}>Qty / Value</th>
                  <th style={{ padding: "8px" }}>Seized From</th>
                  <th style={{ padding: "8px" }}>Storage Location</th>
                  <th style={{ padding: "8px" }}>Sec 105 Video Ref</th>
                </tr>
              </thead>
              <tbody>
                {caseData.seizures && caseData.seizures.length > 0 ? (
                  caseData.seizures.map((sz, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 8px", fontWeight: "700" }}>{sz.item_name}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span className="badge badge-purple" style={{ fontSize: "9.5px" }}>{sz.category}</span>
                      </td>
                      <td style={{ padding: "10px 8px", color: "var(--police-gold)" }}>{sz.quantity_or_value || "1 unit"}</td>
                      <td style={{ padding: "10px 8px" }}>{sz.seized_from_person_name || "Spot"}</td>
                      <td style={{ padding: "10px 8px", color: "var(--police-green)" }}>{sz.storage_location}</td>
                      <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{sz.videography_ref_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      No seized articles recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-heading)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} color="#6C151E" /> Case Tamper-Evident Audit Ledger
              </h2>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                BSA Section 63 statutory chain-of-custody logging all evidentiary mutations and synthesized documents.
              </div>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
              {auditLogs ? auditLogs.length : 0} Event Records
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log, i) => {
                const hashMatch = log.details && log.details.match(/\b([A-Fa-f0-9]{64})\b/);
                const hash = hashMatch ? hashMatch[1] : null;
                const isTampered = log.details && (log.details.includes("TAMPERED") || log.details.includes("Match = False"));
                const isVerified = log.details && (log.details.includes("VERIFIED") || log.details.includes("Match = True"));
                const isCopied = copiedAuditId === `case-audit-${i}`;

                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--bg-surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className={`badge ${isTampered ? "badge-red" : isVerified ? "badge-green" : "badge-blue"}`} style={{ fontSize: "10px" }}>
                          {log.action}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                          Officer: <strong style={{ color: "var(--text-primary)" }}>{log.officer_name}</strong> ({log.role})
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ fontSize: "12.5px", color: "var(--text-primary)", fontWeight: "500", lineHeight: "1.4" }}>
                      {log.details}
                    </div>

                    {hash && (
                      <div className="audit-hash-badge" style={{ marginTop: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Lock size={11} color="#0F3D3A" />
                          <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>SHA-256:</span>
                          <span style={{ color: "var(--text-primary)", fontSize: "11px" }}>{hash}</span>
                        </div>
                        <button
                          onClick={() => handleCopyAuditHash(hash, `case-audit-${i}`)}
                          className="btn btn-secondary"
                          style={{ padding: "1px 6px", fontSize: "10px", height: "20px" }}
                        >
                          {isCopied ? <Check size={10} color="#0F3D3A" /> : <Copy size={10} />}
                          <span>{isCopied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "12.5px", textAlign: "center", padding: "30px" }}>
                No audit log records found for this case.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Print-Ready HTML Document Preview (Ctrl+P) ── */}
      {printPreviewDoc && (
        <div className="modal-overlay" onClick={() => setPrintPreviewDoc(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "880px", width: "95vw", height: "85vh", padding: "16px", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Printer size={16} color="var(--police-gold)" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>
                  {printPreviewDoc.title} — Print Preview (Ctrl+P / Save PDF)
                </h3>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <a
                  href={api.getDocumentPreviewUrl(caseId, printPreviewDoc.docType)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: "11.5px", padding: "4px 10px" }}
                >
                  <ExternalLink size={12} /> Open in New Tab
                </a>
                <button onClick={() => setPrintPreviewDoc(null)} className="btn btn-secondary btn-icon" style={{ width: "26px", height: "26px" }}>✕</button>
              </div>
            </div>

            <iframe
              src={api.getDocumentPreviewUrl(caseId, printPreviewDoc.docType)}
              style={{ width: "100%", flex: 1, border: "1px solid var(--border-subtle)", borderRadius: "6px", background: "#fff" }}
              title="Print Document Preview"
            />
          </div>
        </div>
      )}

      {/* ── MODAL: WhatsApp LERS Notice ── */}
      {lersModal && (
        <div className="modal-overlay" onClick={() => setLersModal(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "600px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={16} color="#34d399" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>WhatsApp Arrest Notification (BNSS Sec 35)</h3>
              </div>
              <button onClick={() => setLersModal(null)} className="btn btn-secondary btn-icon" style={{ width: "24px", height: "24px" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              {[
                { code: "en", label: "English" },
                { code: "hi", label: "हिन्दी" },
                { code: "gu", label: "ગુજરાતી" }
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => handleOpenLersModal(lersModal.accused, l.code)}
                  className={`btn ${lersModal.lang === l.code ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: "4px 10px", fontSize: "11px" }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {lersModal.loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Generating LERS notice...</div>
            ) : lersModal.data?.error ? (
              <div className="alert alert-danger">{lersModal.data.error}</div>
            ) : (
              <div>
                <pre
                  style={{
                    background: "var(--bg-code)",
                    padding: "14px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "260px",
                    overflowY: "auto",
                    lineHeight: "1.4"
                  }}
                >
                  {lersModal.data?.whatsapp_message}
                </pre>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Ref: <code>{lersModal.data?.lers_ref}</code>
                  </span>
                  <button
                    onClick={() => copyLersNotice(lersModal.data?.whatsapp_message)}
                    className="btn btn-primary"
                    style={{ fontSize: "12px" }}
                  >
                    {copiedLers ? "Copied to Clipboard" : "Copy WhatsApp Message"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: BharatPol Query ── */}
      {bharatpolModal && (
        <div className="modal-overlay" onClick={() => setBharatpolModal(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "600px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={16} color="var(--bordo)" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>BharatPol Criminal Record Check</h3>
              </div>
              <button onClick={() => setBharatpolModal(null)} className="btn btn-secondary btn-icon" style={{ width: "24px", height: "24px" }}>✕</button>
            </div>

            {bharatpolModal.loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Querying BharatPol National Gateway...</div>
            ) : bharatpolModal.data?.error ? (
              <div className="alert alert-danger">{bharatpolModal.data.error}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ background: "var(--bg-surface-raised)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-heading)" }}>{bharatpolModal.data?.query_name}</span>
                    <span className={`badge ${bharatpolModal.data?.history_sheeter ? 'badge-red' : 'badge-green'}`}>
                      {bharatpolModal.data?.history_sheeter ? "HISTORY SHEETER" : "CLEAN RECORD"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px" }}>
                    <div><b>NCRB ID:</b> <code style={{ color: "var(--police-blue)" }}>{bharatpolModal.data?.ncrb_crd_id || "NOT_LISTED"}</code></div>
                    <div><b>Warrants:</b> {bharatpolModal.data?.open_warrant ? "Active" : "None"}</div>
                    <div><b>Interstate:</b> {bharatpolModal.data?.interstate_crime_links ? "Yes" : "No"}</div>
                    <div><b>Priors:</b> {bharatpolModal.data?.prior_firs_count || 0} FIRs</div>
                  </div>
                </div>

                {bharatpolModal.data?.prior_firs && bharatpolModal.data.prior_firs.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Prior Inter-District Records ({bharatpolModal.data.prior_firs.length})
                    </div>
                    {bharatpolModal.data.prior_firs.map((pf, idx) => (
                      <div key={idx} style={{ background: "var(--bg-inline-card)", border: "1px solid var(--border-subtle)", padding: "6px 8px", borderRadius: "4px", fontSize: "11px", marginBottom: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "var(--text-heading)" }}>
                          <span>{pf.fir_number} ({pf.year})</span>
                          <span className="badge badge-subtle" style={{ fontSize: "8.5px" }}>{pf.status}</span>
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "10px" }}>{pf.police_station} • {pf.offence}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ background: "var(--cream-soft)", padding: "8px", borderRadius: "5px", fontSize: "11px", color: "var(--text-secondary)" }}>
                  <b>Tactical Advisory:</b> {bharatpolModal.data?.remark}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add Diary Step */}
      {showAddDiaryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: "520px", maxWidth: "90vw", padding: "24px", background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px", color: "var(--text-heading)" }}>
              Add Case Diary Investigation Event
            </h3>

            <form onSubmit={handleAddDiaryEvent} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="form-label">Investigation Step Title *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={diaryForm.step_title}
                  onChange={(e) => setDiaryForm({ ...diaryForm, step_title: e.target.value })}
                  placeholder="e.g. Crime Scene Examination / Witness Statement Recording"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-label">Step Category</label>
                  <select
                    className="form-control"
                    value={diaryForm.step_type}
                    onChange={(e) => setDiaryForm({ ...diaryForm, step_type: e.target.value })}
                  >
                    <option value="WITNESS_EXAMINATION">Witness Examination</option>
                    <option value="CRIME_SCENE_VISIT">Crime Scene Visit</option>
                    <option value="SEIZURE">Mudamal Seizure</option>
                    <option value="ARREST">Arrest Effected</option>
                    <option value="MEDICAL_EXAM">Medical Examination (Sec 53)</option>
                    <option value="REMAND_PRODUCED">Remand Production (Sec 187)</option>
                    <option value="FORENSIC_DISPATCH">FSL Dispatch</option>
                    <option value="CHARGESHEET">Chargesheet Filed</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={diaryForm.location}
                    onChange={(e) => setDiaryForm({ ...diaryForm, location: e.target.value })}
                    placeholder={caseData.police_station}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Statutory Deadline / Rule Reference</label>
                <input
                  type="text"
                  className="form-control"
                  value={diaryForm.statutory_deadline_reference}
                  onChange={(e) => setDiaryForm({ ...diaryForm, statutory_deadline_reference: e.target.value })}
                  placeholder="e.g. Section 105 BNSS / Section 53 BNSS"
                />
              </div>

              <div>
                <label className="form-label">Detailed Description *</label>
                <textarea
                  required
                  className="form-control"
                  style={{ minHeight: "80px" }}
                  value={diaryForm.description}
                  onChange={(e) => setDiaryForm({ ...diaryForm, description: e.target.value })}
                  placeholder="Enter thorough notes of evidence collected, persons questioned, or legal actions taken..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowAddDiaryModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Diary Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Case Status */}
      {showStatusModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: "460px", maxWidth: "90vw", padding: "24px", background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px", color: "var(--police-gold)" }}>
              Update Investigation Status
            </h3>

            <form onSubmit={handleStatusUpdate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="form-label">Select New Investigation State</label>
                <select
                  className="form-control"
                  value={statusForm.newStatus}
                  onChange={(e) => setStatusForm({ ...statusForm, newStatus: e.target.value })}
                >
                  <option value="FIR_REGISTERED">FIR Registered</option>
                  <option value="INVESTIGATION">Under Investigation</option>
                  <option value="ARREST_EFFECTED">Arrest Effected (Sec 35 BNSS)</option>
                  <option value="REMAND_GRANTED">Police Remand Granted (Sec 187 BNSS)</option>
                  <option value="JUDICIAL_CUSTODY">Judicial Custody</option>
                  <option value="CHARGESHEET_FILED">Chargesheet Filed (Sec 193 BNSS)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Status Change Notes / Reason</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: "70px" }}
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  placeholder="Record justification for status transition..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowStatusModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Transition Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

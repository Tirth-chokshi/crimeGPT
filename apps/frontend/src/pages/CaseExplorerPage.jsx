import React, { useState } from "react";
import {
  FolderSearch, Search, Filter, LayoutGrid, List, PlusCircle,
  FileText, Shield, Users, Clock, AlertTriangle, ArrowUpRight,
  Sparkles, CheckCircle2, ChevronRight, Scale, Package, ExternalLink,
  MessageSquare, Printer, ShieldAlert, BadgeCheck
} from "lucide-react";
import { translations } from "../translations";
import { api } from "../api";

export default function CaseExplorerPage({
  cases = [],
  onSelectCase,
  onNewCase,
  onOpenLegalIntel,
  currentLang = "en"
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"

  // Modals for Quick Actions
  const [activeModal, setActiveModal] = useState(null); // { type: 'lers' | 'bharatpol' | 'preview', caseObj: null }
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [lersLang, setLersLang] = useState(currentLang || "en");
  const [copiedToast, setCopiedToast] = useState(false);

  const t = translations[currentLang] || translations.en;

  // Extract unique districts
  const uniqueDistricts = Array.from(new Set(cases.map(c => c.district).filter(Boolean)));

  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesDistrict = districtFilter === "ALL" || c.district === districtFilter;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesStatus && matchesDistrict;

    const sectionsText = (c.sections || []).map(s => `${s.act} ${s.section_number} ${s.section_title}`).join(" ").toLowerCase();
    const personsText = (c.persons || []).map(p => `${p.name} ${p.person_type} ${p.statement || ''}`).join(" ").toLowerCase();

    const matchesSearch =
      c.fir_number.toLowerCase().includes(term) ||
      (c.incident_summary || "").toLowerCase().includes(term) ||
      (c.police_station || "").toLowerCase().includes(term) ||
      (c.district || "").toLowerCase().includes(term) ||
      (c.investigating_officer_name || "").toLowerCase().includes(term) ||
      sectionsText.includes(term) ||
      personsText.includes(term);

    return matchesStatus && matchesDistrict && matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "FIR_REGISTERED": return "badge-blue";
      case "INVESTIGATION": return "badge-purple";
      case "ARREST_EFFECTED": return "badge-red";
      case "REMAND_GRANTED": return "badge-gold";
      case "JUDICIAL_CUSTODY": return "badge-gold";
      case "CHARGESHEET_FILED": return "badge-green";
      default: return "badge-blue";
    }
  };

  const getStatusLabel = (status) => {
    return t.status[status] || status.replace("_", " ");
  };

  // Quick Action: WhatsApp LERS
  const handleOpenLers = async (caseObj, lang = "en") => {
    setActiveModal({ type: "lers", caseObj });
    setModalLoading(true);
    setLersLang(lang);
    try {
      const data = await api.getWhatsappLers(caseObj.id, lang);
      setModalData(data);
    } catch (err) {
      setModalData({ error: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  // Quick Action: BharatPol Query
  const handleOpenBharatpol = async (caseObj) => {
    const accused = (caseObj.persons || []).find(p => p.person_type === "ACCUSED");
    const accusedName = accused ? accused.name : "Vikram Solanki";
    setActiveModal({ type: "bharatpol", caseObj, accusedName });
    setModalLoading(true);
    try {
      const data = await api.queryBharatpolRecord(accusedName);
      setModalData(data);
    } catch (err) {
      setModalData({ error: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  // Quick Action: Print Preview Modal
  const handleOpenPreview = (caseObj) => {
    setActiveModal({ type: "preview", caseObj, docType: "PURVANI_CHARGESHEET" });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  return (
    <div className="content-wrap" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header & Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "4px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.3px", color: "#f8fafc", margin: 0 }}>
              {t.caseExplorer?.title || "Case Dossier Explorer"}
            </h1>
            <span className="badge badge-subtle" style={{ fontSize: "10px", fontWeight: "700" }}>
              {filteredCases.length} {t.caseExplorer?.totalFound || "dossiers matched"}
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "2px 0 0 0" }}>
            {t.caseExplorer?.subtitle || "Comprehensive repository of all registered FIRs, accused tracking, and judicial reports."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#141b2e",
              border: "1px solid var(--border-subtle)",
              borderRadius: "7px",
              padding: "2px"
            }}
          >
            <button
              onClick={() => setViewMode("cards")}
              className="btn btn-icon"
              style={{
                background: viewMode === "cards" ? "var(--police-blue)" : "transparent",
                color: viewMode === "cards" ? "#fff" : "var(--text-secondary)",
                width: "28px",
                height: "28px",
                borderRadius: "5px"
              }}
              title={t.caseExplorer?.viewCards || "Dossier Cards"}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="btn btn-icon"
              style={{
                background: viewMode === "table" ? "var(--police-blue)" : "transparent",
                color: viewMode === "table" ? "#fff" : "var(--text-secondary)",
                width: "28px",
                height: "28px",
                borderRadius: "5px"
              }}
              title={t.caseExplorer?.viewTable || "Data Table"}
            >
              <List size={14} />
            </button>
          </div>

          <button onClick={onNewCase} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
            <PlusCircle size={14} />
            {t.caseExplorer?.createNew || "File New FIR"}
          </button>
        </div>
      </div>

      {/* Multi-Facet Filter Strip */}
      <div
        className="glass-panel"
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          background: "rgba(14, 18, 28, 0.9)"
        }}
      >
        {/* Search Bar */}
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: "220px" }}>
          <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder={t.caseExplorer?.searchPlaceholder || "Search FIR No, Complainant, Accused, Section..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: "36px", fontSize: "12px", background: "#0a0f1d" }}
          />
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: "auto", fontSize: "11.5px", padding: "4px 8px", background: "#0a0f1d" }}
            >
              <option value="ALL">All Stages ({cases.length})</option>
              <option value="FIR_REGISTERED">FIR Registered</option>
              <option value="INVESTIGATION">Under Investigation</option>
              <option value="ARREST_EFFECTED">Arrest Effected</option>
              <option value="REMAND_GRANTED">Police Remand</option>
              <option value="JUDICIAL_CUSTODY">Judicial Custody</option>
              <option value="CHARGESHEET_FILED">Chargesheet Filed</option>
            </select>
          </div>

          {/* District Filter */}
          {uniqueDistricts.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>District:</span>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="form-control"
                style={{ width: "auto", fontSize: "11.5px", padding: "4px 8px", background: "#0a0f1d" }}
              >
                <option value="ALL">All Districts</option>
                {uniqueDistricts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {(searchTerm || statusFilter !== "ALL" || districtFilter !== "ALL") && (
            <button
              onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setDistrictFilter("ALL"); }}
              className="btn btn-secondary"
              style={{ padding: "4px 8px", fontSize: "11px" }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Cards or Table */}
      {filteredCases.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "rgba(14, 18, 28, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <FolderSearch size={40} color="var(--text-muted)" />
          <h3 style={{ fontSize: "16px", color: "#f8fafc", margin: 0 }}>
            {t.caseExplorer?.noResults || "No case dossiers match the selected criteria"}
          </h3>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", maxWidth: "420px", margin: 0 }}>
            Try adjusting your search terms, changing the investigation stage filter, or register a new FIR.
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setDistrictFilter("ALL"); }}
              className="btn btn-secondary"
              style={{ fontSize: "12px" }}
            >
              {t.caseExplorer?.clearFilters || "Reset Filters"}
            </button>
            <button onClick={onNewCase} className="btn btn-primary" style={{ fontSize: "12px" }}>
              {t.caseExplorer?.createNew || "File New FIR"}
            </button>
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* Grid of Rich Dossier Cards */
        <div className="responsive-cards-grid">
          {filteredCases.map((c) => {
            const victim = (c.persons || []).find(p => p.person_type === "VICTIM");
            const accusedList = (c.persons || []).filter(p => p.person_type === "ACCUSED");
            const sections = c.sections || [];

            return (
              <div
                key={c.id}
                className="glass-panel"
                style={{
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  background: "rgba(14, 18, 28, 0.85)",
                  border: "1px solid var(--border-subtle)",
                  transition: "all 0.18s ease"
                }}
              >
                {/* Top Row: FIR Number & Status */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#f8fafc", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                        {c.fir_number}
                      </span>
                      <span className="badge badge-subtle" style={{ fontSize: "9px" }}>
                        {c.fir_date ? new Date(c.fir_date).toLocaleDateString("en-IN") : "2026"}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {c.police_station}
                    </div>
                  </div>

                  <span className={`badge ${getStatusBadgeClass(c.status)}`} style={{ fontSize: "9px", whiteSpace: "nowrap" }}>
                    {getStatusLabel(c.status)}
                  </span>
                </div>

                {/* Incident Narrative Snippet */}
                <div
                  style={{
                    background: "#0a0f1d",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.04)"
                  }}
                >
                  <p className="card-summary" style={{ margin: 0 }}>
                    {c.incident_summary}
                  </p>
                </div>

                {/* Parties Involved Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <div style={{ background: "rgba(56, 189, 248, 0.05)", padding: "7px 9px", borderRadius: "5px", border: "1px solid rgba(56, 189, 248, 0.15)", minWidth: 0 }}>
                    <div style={{ color: "var(--police-blue)", fontWeight: "700", fontSize: "9.5px", textTransform: "uppercase", marginBottom: "2px", letterSpacing: "0.3px" }}>
                      Complainant
                    </div>
                    <div className="party-name">
                      {victim ? victim.name : "State / Informant"}
                    </div>
                  </div>

                  <div style={{ background: "rgba(244, 63, 94, 0.05)", padding: "7px 9px", borderRadius: "5px", border: "1px solid rgba(244, 63, 94, 0.15)", minWidth: 0 }}>
                    <div style={{ color: "var(--police-red)", fontWeight: "700", fontSize: "9.5px", textTransform: "uppercase", marginBottom: "2px", letterSpacing: "0.3px" }}>
                      Accused ({accusedList.length})
                    </div>
                    <div className="party-name">
                      {accusedList.length > 0 ? accusedList[0].name : "Unidentified"}
                    </div>
                  </div>
                </div>

                {/* Sections Applied */}
                {sections.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {sections.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="badge badge-subtle" style={{ fontSize: "8.5px", padding: "2px 5px" }} title={s.section_title}>
                        {s.act} Sec {s.section_number}
                      </span>
                    ))}
                    {sections.length > 3 && (
                      <span className="badge badge-subtle" style={{ fontSize: "8.5px", padding: "2px 5px", color: "var(--police-blue)" }}>
                        +{sections.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Metadata & Quick Action Footer */}
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "6px",
                    flexWrap: "wrap"
                  }}
                >
                  {/* Quick Feature Buttons */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenLers(c, currentLang); }}
                      className="btn btn-secondary btn-icon"
                      style={{ width: "26px", height: "26px", borderRadius: "5px", padding: 0 }}
                      title="Generate WhatsApp LERS Notice"
                    >
                      <MessageSquare size={13} color="#34d399" />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenBharatpol(c); }}
                      className="btn btn-secondary btn-icon"
                      style={{ width: "26px", height: "26px", borderRadius: "5px", padding: 0 }}
                      title="Check BharatPol National Database"
                    >
                      <ShieldAlert size={13} color="#38bdf8" />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenPreview(c); }}
                      className="btn btn-secondary btn-icon"
                      style={{ width: "26px", height: "26px", borderRadius: "5px", padding: 0 }}
                      title="Print / Save PDF (Ctrl+P)"
                    >
                      <Printer size={13} color="#fbbf24" />
                    </button>
                  </div>

                  {/* Open Dossier Button */}
                  <button
                    onClick={() => onSelectCase(c.id)}
                    className="btn btn-primary"
                    style={{ padding: "4px 10px", fontSize: "11.5px", fontWeight: "700" }}
                  >
                    <span>{t.caseExplorer?.inspectDossier || "Inspect Dossier"}</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="glass-panel table-responsive" style={{ padding: "0" }}>
          <table className="data-table" style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "left" }}>
                <th style={{ padding: "10px 14px" }}>FIR Number</th>
                <th style={{ padding: "10px 14px" }}>Station &amp; District</th>
                <th style={{ padding: "10px 14px" }}>Complainant</th>
                <th style={{ padding: "10px 14px" }}>Accused</th>
                <th style={{ padding: "10px 14px" }}>Sections Applied</th>
                <th style={{ padding: "10px 14px" }}>Status</th>
                <th style={{ textAlign: "right", padding: "10px 14px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => {
                const victim = (c.persons || []).find(p => p.person_type === "VICTIM");
                const accused = (c.persons || []).find(p => p.person_type === "ACCUSED");
                return (
                  <tr key={c.id} style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)" }} onClick={() => onSelectCase(c.id)}>
                    <td style={{ padding: "10px 14px", fontWeight: "700", fontFamily: "var(--font-mono)", color: "#f8fafc", whiteSpace: "nowrap" }}>
                      {c.fir_number}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ color: "#f8fafc", fontWeight: "500" }}>{c.police_station}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.district}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>{victim ? victim.name : "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {accused ? (
                        <span style={{ color: accused.custody_status !== "FREE" ? "var(--police-red)" : "inherit" }}>
                          {accused.name}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {(c.sections || []).slice(0, 2).map((s, i) => (
                          <span key={i} className="badge badge-subtle" style={{ fontSize: "8.5px" }}>
                            {s.act} {s.section_number}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span className={`badge ${getStatusBadgeClass(c.status)}`} style={{ fontSize: "8.5px", whiteSpace: "nowrap" }}>
                        {getStatusLabel(c.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 14px" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "inline-flex", gap: "4px" }}>
                        <button
                          onClick={() => handleOpenLers(c, currentLang)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: "26px", height: "26px", padding: 0 }}
                          title="WhatsApp LERS Notice"
                        >
                          <MessageSquare size={12} color="#34d399" />
                        </button>
                        <button
                          onClick={() => handleOpenBharatpol(c)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: "26px", height: "26px", padding: 0 }}
                          title="BharatPol Record Check"
                        >
                          <ShieldAlert size={12} color="#38bdf8" />
                        </button>
                        <button
                          onClick={() => onSelectCase(c.id)}
                          className="btn btn-primary btn-icon"
                          style={{ width: "26px", height: "26px", padding: 0 }}
                          title="Inspect Dossier"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: WhatsApp LERS Notice ── */}
      {activeModal && activeModal.type === "lers" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content glass-panel" style={{ padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(52, 211, 153, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageSquare size={16} color="#34d399" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: "700" }}>WhatsApp Arrest Notification (LERS)</h3>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>BNSS Section 35 / D.K. Basu Compliance</div>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary btn-icon" style={{ width: "24px", height: "24px" }}>✕</button>
            </div>

            {/* Language Selector */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              {[
                { code: "en", label: "English" },
                { code: "hi", label: "हिन्दी" },
                { code: "gu", label: "ગુજરાતી" }
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => handleOpenLers(activeModal.caseObj, l.code)}
                  className={`btn ${lersLang === l.code ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: "4px 10px", fontSize: "11px" }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {modalLoading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Generating LERS advisory message...</div>
            ) : modalData?.error ? (
              <div className="alert alert-danger">{modalData.error}</div>
            ) : (
              <div>
                <pre
                  style={{
                    background: "#0a0f1d",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "11.5px",
                    color: "#f8fafc",
                    fontFamily: "var(--font-mono)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "260px",
                    overflowY: "auto",
                    lineHeight: "1.4"
                  }}
                >
                  {modalData?.whatsapp_message}
                </pre>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Ref: <code>{modalData?.lers_ref}</code>
                  </span>
                  <button
                    onClick={() => copyToClipboard(modalData?.whatsapp_message)}
                    className="btn btn-primary"
                    style={{ fontSize: "12px" }}
                  >
                    {copiedToast ? "✓ Copied to Clipboard!" : "Copy WhatsApp Message"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: BharatPol Query ── */}
      {activeModal && activeModal.type === "bharatpol" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content glass-panel" style={{ padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldAlert size={16} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: "700" }}>BharatPol National Criminal Record</h3>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>NCRB / ICJS Interoperable Record Check</div>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary btn-icon" style={{ width: "24px", height: "24px" }}>✕</button>
            </div>

            {modalLoading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Querying BharatPol National Gateway...</div>
            ) : modalData?.error ? (
              <div className="alert alert-danger">{modalData.error}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ background: "#0a0f1d", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "4px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#f8fafc" }}>{modalData?.query_name}</span>
                    <span className={`badge ${modalData?.history_sheeter ? 'badge-red' : 'badge-green'}`}>
                      {modalData?.history_sheeter ? "⚠️ HISTORY SHEETER" : "✓ CLEAN RECORD"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px" }}>
                    <div><b>NCRB ID:</b> <code style={{ color: "var(--police-blue)" }}>{modalData?.ncrb_crd_id || "NOT_LISTED"}</code></div>
                    <div><b>Open Warrants:</b> {modalData?.open_warrant ? "🚨 Active Warrant" : "None"}</div>
                    <div><b>Interstate Links:</b> {modalData?.interstate_crime_links ? "Yes" : "No"}</div>
                    <div><b>Prior Cases:</b> {modalData?.prior_firs_count || 0} FIRs</div>
                  </div>
                </div>

                {modalData?.prior_firs && modalData.prior_firs.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Prior Inter-District Records ({modalData.prior_firs.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {modalData.prior_firs.map((pf, idx) => (
                        <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", padding: "6px 8px", borderRadius: "4px", fontSize: "11px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "#f8fafc" }}>
                            <span>{pf.fir_number} ({pf.year})</span>
                            <span className="badge badge-subtle" style={{ fontSize: "8.5px" }}>{pf.status}</span>
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "10px" }}>{pf.police_station} • {pf.offence}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ background: "rgba(56, 189, 248, 0.08)", padding: "8px 10px", borderRadius: "5px", fontSize: "11px", color: "var(--text-secondary)" }}>
                  <b>Tactical Advisory:</b> {modalData?.remark}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: HTML Document Print Preview ── */}
      {activeModal && activeModal.type === "preview" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "860px", width: "95vw", height: "85vh", padding: "16px", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Printer size={16} color="var(--police-gold)" />
                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: "700" }}>
                  Print-Ready Legal Document Preview ({activeModal.caseObj.fir_number})
                </h3>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <a
                  href={api.getDocumentPreviewUrl(activeModal.caseObj.id, activeModal.docType)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: "11px", padding: "4px 8px" }}
                >
                  <ExternalLink size={12} /> Open in Tab
                </a>
                <button onClick={() => setActiveModal(null)} className="btn btn-secondary btn-icon" style={{ width: "24px", height: "24px" }}>✕</button>
              </div>
            </div>

            <iframe
              src={api.getDocumentPreviewUrl(activeModal.caseObj.id, activeModal.docType)}
              style={{ width: "100%", flex: 1, border: "1px solid var(--border-subtle)", borderRadius: "6px", background: "#fff" }}
              title="Print Document Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import {
  BookOpen, Plus, FileDown, Calendar, MapPin, User, Shield,
  CheckCircle2, Clock, Search, AlertCircle, FileText, X, Scale
} from "lucide-react";
import { api } from "../api";

export default function CaseDiaryTimeline({
  caseId,
  firNumber,
  events = [],
  onEventAdded,
  onExportDocx,
  isExporting = false,
  currentUserRole = "IO",
  officerName = "Inspector R. K. Jadeja",
  officerBadge = "GJ-AHM-4421"
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    step_title: "",
    step_type: "WITNESS_EXAMINATION",
    location: "",
    description: "",
    statutory_deadline_reference: "Sec 187 BNSS"
  });

  const stepTypes = [
    { value: "CRIME_SCENE_VISIT", label: "Crime Scene Inspection", statutory: "Sec 105 BNSS (Videography)" },
    { value: "WITNESS_EXAMINATION", label: "Witness Statement (Sec 180)", statutory: "Sec 180 BNSS" },
    { value: "SEIZURE", label: "Mudamal Seizure / Panchanama", statutory: "Sec 105 BNSS & Sec 23 BSA" },
    { value: "ARREST", label: "Accused Apprehension / Arrest", statutory: "Sec 35 & 187 BNSS" },
    { value: "MEDICAL_EXAM", label: "Medico-Legal Examination (MLC)", statutory: "Sec 53 BNSS" },
    { value: "REMAND_PRODUCED", label: "Remand Production before Magistrate", statutory: "Sec 187(1) BNSS (24h limit)" },
    { value: "CUSTODY_EXTENDED", label: "Custody Extension / Jail Transit", statutory: "Sec 187(2) BNSS (15d cap)" },
    { value: "FORENSIC_DISPATCH", label: "FSL / Cyber Forensic Dispatch", statutory: "Sec 63 BSA Hash Cert" },
    { value: "CHARGESHEET", label: "Chargesheet / Police Report Filing", statutory: "Sec 193 BNSS" }
  ];

  const renderStepIcon = (type) => {
    switch (type) {
      case "CRIME_SCENE_VISIT": return <Search size={14} color="var(--bordo)" />;
      case "WITNESS_EXAMINATION": return <User size={14} color="var(--bordo)" />;
      case "SEIZURE": return <Shield size={14} color="var(--police-gold)" />;
      case "ARREST": return <AlertCircle size={14} color="#ef4444" />;
      case "MEDICAL_EXAM": return <CheckCircle2 size={14} color="#10b981" />;
      case "REMAND_PRODUCED": return <Scale size={14} color="#8b5cf6" />;
      case "CHARGESHEET": return <FileText size={14} color="#10b981" />;
      default: return <BookOpen size={14} color="var(--text-muted)" />;
    }
  };

  const getStepBadgeColor = (type) => {
    switch (type) {
      case "FIR": return "badge-blue";
      case "ARREST": return "badge-red";
      case "MEDICAL_EXAM": return "badge-gold";
      case "REMAND_PRODUCED": return "badge-purple";
      case "SEIZURE": return "badge-green";
      case "CHARGESHEET": return "badge-green";
      default: return "badge-blue";
    }
  };

  const handleStepTypeChange = (e) => {
    const selectedType = e.target.value;
    const match = stepTypes.find((s) => s.value === selectedType);
    setFormData({
      ...formData,
      step_type: selectedType,
      statutory_deadline_reference: match?.statutory || "BNSS 2023"
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.step_title.trim() || !formData.description.trim()) {
      alert("Please provide both a Step Title and Description.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.addDiaryEvent(caseId, {
        step_title: formData.step_title,
        step_type: formData.step_type,
        location: formData.location || "Police Station",
        description: formData.description,
        officer_name: officerName,
        officer_badge: officerBadge,
        statutory_deadline_reference: formData.statutory_deadline_reference
      });

      setIsAddModalOpen(false);
      setFormData({
        step_title: "",
        step_type: "WITNESS_EXAMINATION",
        location: "",
        description: "",
        statutory_deadline_reference: "Sec 187 BNSS"
      });

      if (onEventAdded) onEventAdded();
    } catch (err) {
      alert("Failed to add diary event: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background: "var(--bordo-soft)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <BookOpen size={20} color="var(--bordo)" />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "var(--text-heading)" }}>
              Case Diary Chronology (Sec 187 BNSS)
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Official continuous daily investigative record • {events.length} chronological entries recorded
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {onExportDocx && (
            <button
              onClick={onExportDocx}
              disabled={isExporting}
              className="btn btn-secondary"
              style={{ fontSize: "12px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FileDown size={14} />
              {isExporting ? "Exporting..." : "Export .docx"}
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: "12px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={15} /> Record Investigation Step
          </button>
        </div>
      </div>

      {/* Vertical Timeline */}
      {events.length === 0 ? (
        <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center" }}>
          <BookOpen size={36} color="var(--text-muted)" style={{ marginBottom: "12px", opacity: 0.6 }} />
          <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>
            No Diary Events Recorded Yet
          </h4>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 16px auto" }}>
            Every investigative action, witness statement, crime scene visit, arrest, and remand must be recorded in the Case Diary under BNSS Section 187.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: "12.5px", padding: "8px 18px" }}
          >
            <Plus size={14} /> Add First Investigation Step
          </button>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: "32px" }}>
          {/* Vertical Track Line */}
          <div
            style={{
              position: "absolute",
              left: "15px",
              top: "14px",
              bottom: "14px",
              width: "2px",
              background: "var(--border-subtle)"
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {events.map((ev, index) => {
              const badgeClass = getStepBadgeColor(ev.step_type);
              const dateStr = ev.event_timestamp
                ? new Date(ev.event_timestamp).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  })
                : "—";

              return (
                <div key={ev.id || index} style={{ position: "relative" }}>
                  {/* Timeline Node Icon */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-32px",
                      top: "16px",
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: "var(--bg-surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2
                    }}
                  >
                    {renderStepIcon(ev.step_type)}
                  </div>

                  {/* Card Body */}
                  <div
                    className="glass-panel"
                    style={{
                      padding: "16px 20px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "10px",
                      transition: "transform 0.2s ease, border-color 0.2s ease"
                    }}
                  >
                    {/* Card Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "10px",
                        flexWrap: "wrap",
                        gap: "8px"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--police-gold)" }}>
                            ENTRY #{index + 1}
                          </span>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: "9.5px" }}>
                            {ev.step_type?.replace(/_/g, " ")}
                          </span>
                          {ev.statutory_deadline_reference && (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--bordo)",
                                background: "var(--bordo-soft)",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                border: "1px solid var(--border-subtle)"
                              }}
                            >
                              {ev.statutory_deadline_reference}
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "var(--text-heading)" }}>
                          {ev.step_title}
                        </h4>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                        <Clock size={12} /> {dateStr}
                      </div>
                    </div>

                    {/* Card Description */}
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        margin: "0 0 12px 0",
                        whiteSpace: "pre-line"
                      }}
                    >
                      {ev.description}
                    </p>

                    {/* Card Footer: Location and Officer */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "11.5px",
                        color: "var(--text-muted)",
                        borderTop: "1px solid var(--border-subtle)",
                        paddingTop: "10px",
                        flexWrap: "wrap",
                        gap: "8px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={12} color="var(--police-gold)" />
                        <span>{ev.location || "Police Station Jurisdiction"}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <User size={12} color="var(--bordo)" />
                        <span>
                          {ev.officer_name} ({ev.officer_badge || "IO"})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Investigation Step Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div
            className="glass-panel"
            style={{
              maxWidth: "600px",
              width: "90%",
              padding: "28px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "var(--bordo-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <BookOpen size={18} color="var(--bordo)" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "var(--text-heading)" }}>
                    Record Investigation Step
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    FIR: {firNumber} • Case Diary entry under Sec 187 BNSS
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>
                  Investigation Step Type *
                </label>
                <select
                  className="form-control"
                  value={formData.step_type}
                  onChange={handleStepTypeChange}
                  style={{ fontSize: "13px" }}
                >
                  {stepTypes.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>
                  Step Title / Action Heading *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Examination of eye-witness Smt. Rekhaben at crime scene"
                  value={formData.step_title}
                  onChange={(e) => setFormData({ ...formData, step_title: e.target.value })}
                  style={{ fontSize: "13px" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "12px" }}>
                    Location of Action
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Near C.G. Road Crossway"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: "12px" }}>
                    Statutory Provision Reference
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sec 180 BNSS"
                    value={formData.statutory_deadline_reference}
                    onChange={(e) => setFormData({ ...formData, statutory_deadline_reference: e.target.value })}
                    style={{ fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>
                  Detailed Investigation Narrative / Description *
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Describe the exact actions taken, witness statements recorded, recoveries effected, panch witnesses present, or court directions complied with..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ fontSize: "13px" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ fontSize: "12px", padding: "8px 20px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <CheckCircle2 size={14} />
                  {isSubmitting ? "Recording..." : "Save to Case Diary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

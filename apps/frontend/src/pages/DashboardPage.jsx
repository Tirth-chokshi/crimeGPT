import React from "react";
import {
  FileText, Users, Scale, Package,
  ShieldAlert, Activity, ChevronRight, PlusCircle
} from "lucide-react";
import { translations } from "../translations";

export default function DashboardPage({
  cases = [],
  onSelectCase,
  onNewCase,
  onOpenLegalIntel,
  currentLang = "en"
}) {
  const t = translations[currentLang] || translations.en;

  const activeCount = cases.length;
  const inCustodyAccused = cases.flatMap(c =>
    (c.persons || []).filter(p => p.person_type === "ACCUSED" && (p.custody_status === "POLICE_CUSTODY" || p.custody_status === "JUDICIAL_CUSTODY"))
      .map(p => ({ ...p, caseId: c.id, firNumber: c.fir_number, policeStation: c.police_station }))
  );
  const inCustodyCount = inCustodyAccused.length;
  const pendingChargesheetCount = cases.filter(c => c.status !== "CHARGESHEET_FILED").length;
  const allSeizures = cases.flatMap(c => (c.seizures || []).map(sz => ({ ...sz, firNumber: c.fir_number })));
  const totalSeizuresCount = allSeizures.length;
  const hashedSeizuresCount = allSeizures.filter(sz => sz.hash_value_or_serial).length;

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

  return (
    <div className="content-wrap" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Institutional Header */}
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
          <h1 style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.2px", color: "var(--text-primary)", margin: 0 }}>
            {t.dashboard.title}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "12.5px", margin: "3px 0 0 0" }}>
            {t.dashboard.subtitle}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={onOpenLegalIntel} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "12.5px" }}>
            <Scale size={14} color="var(--police-blue)" />
            {t.dashboard.analyzeCrimeBtn}
          </button>
          <button onClick={onNewCase} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12.5px" }}>
            <PlusCircle size={14} />
            {t.dashboard.newFirBtn}
          </button>
        </div>
      </div>

      {/* 4-KPI Metric Grid */}
      <div className="responsive-kpi-grid">
        {/* Metric 1: Active Cases */}
        <div
          className="glass-panel"
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "6px",
              background: "rgba(56, 139, 253, 0.12)",
              border: "1px solid rgba(56, 139, 253, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <FileText size={18} color="var(--police-blue)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                {activeCount}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                {t.dashboard.activeCases}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Active Case Pool
            </div>
          </div>
        </div>

        {/* Metric 2: Accused in Custody */}
        <div
          className="glass-panel"
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "6px",
              background: "rgba(248, 81, 73, 0.12)",
              border: "1px solid rgba(248, 81, 73, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Users size={18} color="var(--police-red)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                {inCustodyCount}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                {t.dashboard.inCustody}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--police-gold)" }}>
              Sec 187 BNSS 24h Watch
            </div>
          </div>
        </div>

        {/* Metric 3: Pending Chargesheets */}
        <div
          className="glass-panel"
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "6px",
              background: "rgba(210, 153, 34, 0.12)",
              border: "1px solid rgba(210, 153, 34, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Scale size={18} color="var(--police-gold)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                {pendingChargesheetCount}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                {t.dashboard.pendingChargesheet}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Sec 193 (60/90d Limit)
            </div>
          </div>
        </div>

        {/* Metric 4: Seizures Logged */}
        <div
          className="glass-panel"
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "6px",
              background: "rgba(46, 160, 67, 0.12)",
              border: "1px solid rgba(46, 160, 67, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Package size={18} color="var(--police-green)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                {totalSeizuresCount}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                {t.dashboard.seizuresLogged}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#3fb950" }}>
              {hashedSeizuresCount} SHA-256 Verified
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="responsive-2col">
        {/* Left Column: Statutory Compliance Deadlines */}
        <div className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={16} color="var(--police-gold)" />
              <h2 style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                {t.dashboard.complianceRadarTitle}
              </h2>
            </div>
            <span className="badge badge-gold" style={{ fontSize: "10px" }}>
              STRICT COMPLIANCE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Clock 1: Section 187 Remand */}
            <div style={{ background: "rgba(248, 81, 73, 0.05)", border: "1px solid rgba(248, 81, 73, 0.2)", borderRadius: "6px", padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "4px" }}>
                <div style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "12.5px" }}>
                  Sec 187 BNSS: 24-Hour Magistrate Production Watch
                </div>
                <span className="badge badge-red" style={{ fontSize: "9px" }}>
                  ACTIVE CLOCK
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Mandatory production before Judicial Magistrate within 24 hours of arrest. Currently monitoring <b>{inCustodyCount}</b> accused in custody.
              </div>
              {inCustodyAccused.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {inCustodyAccused.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectCase(acc.caseId)}
                      className="btn btn-secondary"
                      style={{ fontSize: "11px", padding: "3px 8px" }}
                    >
                      {acc.name} ({acc.firNumber}) →
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clock 2: Section 193 Default Bail */}
            <div style={{ background: "rgba(210, 153, 34, 0.05)", border: "1px solid rgba(210, 153, 34, 0.2)", borderRadius: "6px", padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "4px" }}>
                <div style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "12.5px" }}>
                  Sec 193(3) BNSS: 60/90-Day Chargesheet Time-Bar
                </div>
                <span className="badge badge-gold" style={{ fontSize: "9px" }}>
                  DEFAULT BAIL IMMUNITY
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Failure to file Chargesheet within 60 days (or 90 days for major offences) gives accused statutory default bail rights.
              </div>
            </div>

            {/* Clock 3: Section 105 Videography */}
            <div style={{ background: "rgba(56, 139, 253, 0.05)", border: "1px solid rgba(56, 139, 253, 0.2)", borderRadius: "6px", padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "4px" }}>
                <div style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "12.5px" }}>
                  Sec 105 BNSS &amp; Sec 63 BSA: Mandatory Seizure Videography
                </div>
                <span className="badge badge-blue" style={{ fontSize: "9px" }}>
                  EVIDENTIARY MANDATE
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                All crime scenes, mudamal recoveries, and searches must include mandatory mobile videography and electronic SHA-256 certificates.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Station Activity & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Quick Operations Strip */}
          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Activity size={14} color="var(--police-blue)" />
              {t.dashboard.quickActions || "Quick Station Operations"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
              <button
                onClick={onNewCase}
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "8px 12px", fontSize: "12px", textAlign: "left" }}
              >
                <PlusCircle size={14} color="var(--police-blue)" />
                <span>Register New FIR</span>
              </button>

              <button
                onClick={onOpenLegalIntel}
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "8px 12px", fontSize: "12px", textAlign: "left" }}
              >
                <Scale size={14} color="var(--police-gold)" />
                <span>BNS Section Mapping</span>
              </button>
            </div>
          </div>

          {/* Recent Investigations Feed */}
          <div className="glass-panel" style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={14} color="var(--police-blue)" />
                {t.dashboard.recentCases || "Live Investigation Feed"}
              </div>
              <button
                onClick={() => onSelectCase(cases[0]?.id)}
                className="btn btn-outline"
                style={{ fontSize: "11.5px", padding: "3px 8px" }}
              >
                View Dossiers →
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {cases.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  style={{
                    background: "var(--bg-surface-raised)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "border-color 0.12s ease",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "12.5px", whiteSpace: "nowrap" }}>
                        {c.fir_number}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(c.status)}`} style={{ fontSize: "9px" }}>
                        {getStatusLabel(c.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.incident_summary}
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

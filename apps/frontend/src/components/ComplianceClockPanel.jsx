import React, { useState } from "react";
import {
  Clock, AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert,
  Scale, Hourglass, User, Calendar, Flame, Zap, Info, FileText,
  ChevronDown, ChevronUp, ShieldCheck
} from "lucide-react";

export default function ComplianceClockPanel({
  complianceData,
  activeAlerts = [],
  onExportDocx,
  isExporting = false
}) {
  const [showAllRules, setShowAllRules] = useState(false);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLIED":
        return {
          label: "COMPLIED",
          className: "badge-green",
          icon: <CheckCircle2 size={12} />
        };
      case "SAFE":
        return {
          label: "SAFE",
          className: "badge-blue",
          icon: <ShieldCheck size={12} />
        };
      case "CAUTION":
        return {
          label: "CAUTION",
          className: "badge-purple",
          icon: <Info size={12} />
        };
      case "WARNING":
        return {
          label: "WARNING",
          className: "badge-gold",
          icon: <AlertTriangle size={12} />
        };
      case "CRITICAL":
        return {
          label: "CRITICAL",
          className: "badge-red",
          icon: <Flame size={12} />
        };
      case "OVERDUE":
        return {
          label: "OVERDUE",
          className: "badge-red",
          icon: <ShieldAlert size={12} />
        };
      default:
        return {
          label: status || "UNKNOWN",
          className: "badge-blue",
          icon: <Clock size={12} />
        };
    }
  };

  const getAlertLevelStyle = (level) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
      case "OVERDUE":
        return {
          border: "1px solid rgba(239, 68, 68, 0.4)",
          background: "rgba(239, 68, 68, 0.08)",
          badge: "badge-red",
          icon: <Flame size={15} color="#ef4444" />
        };
      case "WARNING":
        return {
          border: "1px solid rgba(245, 158, 11, 0.4)",
          background: "rgba(245, 158, 11, 0.08)",
          badge: "badge-gold",
          icon: <AlertTriangle size={15} color="var(--police-gold)" />
        };
      default:
        return {
          border: "1px solid var(--border-subtle)",
          background: "var(--cream-soft)",
          badge: "badge-blue",
          icon: <Info size={15} color="var(--bordo)" />
        };
    }
  };

  const clocks = complianceData?.per_accused_clocks || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner: Statutory Overview */}
      <div
        className="glass-panel"
        style={{
          padding: "18px 24px",
          background: "var(--bg-surface-raised)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Scale size={22} color="var(--police-gold)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "var(--text-heading)" }}>
                BNSS Statutory Compliance Radar
              </h3>
              <span className="badge badge-gold" style={{ fontSize: "10px" }}>
                BNSS 2023 Enforced
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
              Continuous real-time tracking of 24h Magistrate production, 15-day police remand cap, and 60/90-day default bail triggers.
            </p>
          </div>
        </div>

        {onExportDocx && (
          <button
            onClick={onExportDocx}
            disabled={isExporting}
            className="btn btn-primary"
            style={{ fontSize: "12.5px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FileText size={15} />
            {isExporting ? "Exporting Case Diary..." : "Export BNSS Case Diary (.docx)"}
          </button>
        )}
      </div>

      {/* Active Compliance Alerts Banner */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "#ef4444" }}>
            <ShieldAlert size={16} /> Active Statutory Compliance Alerts ({activeAlerts.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeAlerts.map((alert, idx) => {
              const style = getAlertLevelStyle(alert.level);
              return (
                <div
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    ...style,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{ marginTop: "2px" }}>{style.icon}</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-heading)", marginBottom: "3px" }}>
                        {alert.message}
                      </div>
                      {alert.mandate && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                          {alert.mandate}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${style.badge}`} style={{ fontSize: "9.5px", textTransform: "uppercase" }}>
                    {alert.level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Accused Compliance Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--bordo)", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={16} /> Live Custody & Investigation Timers
        </h4>

        {clocks.length === 0 || (clocks.length === 1 && clocks[0].no_arrests_yet) ? (
          <div className="glass-panel" style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ maxWidth: "480px", margin: "0 auto" }}>
              <Hourglass size={32} color="var(--police-gold)" style={{ marginBottom: "12px", opacity: 0.8 }} />
              <h5 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>
                No Arrests Recorded Yet
              </h5>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Custody clocks (24h Magistrate production & 15-day police remand cap) will activate automatically as soon as an accused person is arrested.
              </p>

              {/* Case-Level Chargesheet Clock */}
              {clocks[0]?.chargesheet_clock && (
                <div
                  style={{
                    background: "var(--bg-surface-raised)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    padding: "14px",
                    textAlign: "left"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--police-gold)" }}>
                      Police Report / Chargesheet Deadline (Sec 193 BNSS)
                    </span>
                    <span className={`badge ${getStatusBadge(clocks[0].chargesheet_clock.status).className}`}>
                      {clocks[0].chargesheet_clock.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <span>Statutory Period: {clocks[0].chargesheet_clock.chargesheet_days_allowed} Days</span>
                    <span>Due Date: {clocks[0].chargesheet_clock.deadline_ist}</span>
                    <span style={{ fontWeight: "700", color: "var(--bordo)" }}>
                      {clocks[0].chargesheet_clock.days_remaining} Days Left
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          clocks.map((clock, idx) => {
            if (clock.no_arrests_yet) return null;

            const prod24h = clock.magistrate_production_24h || {};
            const rem15d = clock.police_remand_15d || {};
            const csClock = clock.chargesheet_clock || {};

            const prodBadge = getStatusBadge(prod24h.status);
            const remBadge = getStatusBadge(rem15d.status);
            const csBadge = getStatusBadge(csClock.status);

            const remandPct = Math.min(100, Math.round(((rem15d.days_in_police_custody || 0) / 15) * 100));

            return (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: "20px",
                  border: prod24h.status === "CRITICAL" || csClock.bail_right_triggered
                    ? "1px solid rgba(239, 68, 68, 0.5)"
                    : "1px solid var(--border-subtle)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Header per accused */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--bordo-soft)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <User size={18} color="var(--bordo)" />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-heading)" }}>
                          {clock.accused_name}
                        </span>
                        <span className="badge badge-purple" style={{ fontSize: "10px" }}>
                          {clock.custody_status?.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        Arrested on: {clock.arrest_datetime_ist}
                      </div>
                    </div>
                  </div>

                  {csClock.bail_right_triggered && (
                    <div className="badge badge-red" style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Flame size={13} /> DEFAULT BAIL TRIGGERED (Sec 479 BNSS)
                    </div>
                  )}
                </div>

                {/* Grid of 3 Statutory Clocks */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "14px"
                  }}
                >
                  {/* Clock 1: 24-Hour Magistrate Production */}
                  <div
                    style={{
                      background: "var(--bg-surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-heading)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Hourglass size={14} color="#f59e0b" /> 24h Magistrate Production
                        </span>
                        <span className={`badge ${prodBadge.className}`} style={{ fontSize: "9.5px", display: "flex", alignItems: "center", gap: "4px" }}>
                          {prodBadge.icon} {prodBadge.label}
                        </span>
                      </div>

                      <div style={{ margin: "10px 0" }}>
                        {prod24h.complied ? (
                          <div style={{ fontSize: "20px", fontWeight: "800", color: "#34d399" }}>
                            COMPLIED
                          </div>
                        ) : (
                          <div style={{ fontSize: "22px", fontWeight: "900", color: prod24h.hours_remaining < 2 ? "#ef4444" : "#f59e0b" }}>
                            {prod24h.hours_remaining?.toFixed(1)} <span style={{ fontSize: "13px", fontWeight: "500" }}>hours remaining</span>
                          </div>
                        )}
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Deadline: {prod24h.deadline_ist}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                      Sec 187(1) BNSS: Production before Magistrate within 24h of arrest.
                    </div>
                  </div>

                  {/* Clock 2: 15-Day Police Remand Cap */}
                  <div
                    style={{
                      background: "var(--bg-surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-heading)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Scale size={14} color="var(--bordo)" /> 15-Day Police Remand Cap
                        </span>
                        <span className={`badge ${remBadge.className}`} style={{ fontSize: "9.5px", display: "flex", alignItems: "center", gap: "4px" }}>
                          {remBadge.icon} {remBadge.label}
                        </span>
                      </div>

                      <div style={{ margin: "10px 0" }}>
                        <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--bordo)" }}>
                          {rem15d.days_remaining} <span style={{ fontSize: "13px", fontWeight: "500" }}>days left of 15-day cap</span>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", marginTop: "6px" }}>
                          <div
                            style={{
                              width: `${remandPct}%`,
                              height: "100%",
                              background: remandPct > 80 ? "#ef4444" : remandPct > 50 ? "#f59e0b" : "var(--bordo)",
                              transition: "width 0.3s ease"
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Days consumed: {rem15d.days_in_police_custody || 0} / 15 days
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                      Sec 187(2) BNSS: Max 15 days police custody in whole or in parts.
                    </div>
                  </div>

                  {/* Clock 3: 60/90-Day Chargesheet & Default Bail */}
                  <div
                    style={{
                      background: "var(--bg-surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-heading)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FileText size={14} color="#a855f7" /> Chargesheet / Default Bail
                        </span>
                        <span className={`badge ${csBadge.className}`} style={{ fontSize: "9.5px", display: "flex", alignItems: "center", gap: "4px" }}>
                          {csBadge.icon} {csBadge.label}
                        </span>
                      </div>

                      <div style={{ margin: "10px 0" }}>
                        <div style={{ fontSize: "22px", fontWeight: "900", color: csClock.bail_right_triggered ? "#ef4444" : "#a855f7" }}>
                          {csClock.days_remaining} <span style={{ fontSize: "13px", fontWeight: "500" }}>days left ({csClock.chargesheet_days_allowed}d rule)</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Filing Due Date: {csClock.deadline_ist}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                      Sec 187(3) & 479 BNSS: Failure to file within deadline triggers default bail right.
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BNSS Statutory Rules Accordion */}
      <div className="glass-panel" style={{ padding: "16px 20px" }}>
        <button
          type="button"
          onClick={() => setShowAllRules(!showAllRules)}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            padding: 0
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "var(--bordo)" }}>
            <Zap size={15} /> Active BNSS 2023 Statutory Directives & Timelines
          </div>
          {showAllRules ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
        </button>

        {showAllRules && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
            {[
              {
                section: "Sec 35 BNSS",
                title: "Notice of Appearance vs Arrest",
                mandate: "For offences punishable with <= 7 years imprisonment, notice under Sec 35(3) mandatory unless reasons for warrantless arrest are recorded."
              },
              {
                section: "Sec 53 BNSS",
                title: "Mandatory Medico-Legal Examination",
                mandate: "Arrested accused must be examined by a registered medical practitioner (CMO) immediately upon arrest and before magistrate production."
              },
              {
                section: "Sec 105 BNSS",
                title: "Mandatory Audio-Video Search & Seizure Recording",
                mandate: "All search and seizure procedures must be recorded through electronic audio-video means and forwarded to Magistrate within 48 hours."
              },
              {
                section: "Sec 187 BNSS",
                title: "24h Production & 15-Day Remand Limit",
                mandate: "Production before nearest Magistrate within 24h. Police custody cap of 15 days in whole or in parts during first 40/60 days."
              },
              {
                section: "Sec 193 BNSS",
                title: "Police Report on Completion of Investigation",
                mandate: "Final chargesheet or Purvani Chargesheet must be submitted within 60 days (minor) or 90 days (major) from arrest."
              },
              {
                section: "Sec 479 BNSS",
                title: "First-Time Offender Default Bail Relief",
                mandate: "First-time undertrial prisoners who have undergone detention for 1/3rd of the maximum sentence are entitled to release on bail."
              }
            ].map((rule, i) => (
              <div key={i} style={{ background: "var(--bg-surface-raised)", borderRadius: "6px", padding: "10px 14px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-heading)" }}>{rule.title}</span>
                  <span className="badge badge-gold" style={{ fontSize: "9px" }}>{rule.section}</span>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {rule.mandate}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

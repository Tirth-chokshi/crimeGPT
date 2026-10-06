import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, ShieldAlert, RefreshCw, Download, Search,
  Lock, FileText, Database, ArrowLeftRight, BookOpen,
  Copy, Check, Clock, User, Filter, AlertTriangle
} from "lucide-react";
import { api } from "../api";
import { translations } from "../translations";

export default function AuditPage({ currentLang }) {
  const t = translations[currentLang] || translations.en;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch audit trail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `crimegpt_audit_ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper to categorize log actions
  const getLogCategory = (action = "") => {
    const act = action.toUpperCase();
    if (act.includes("HASH") || act.includes("TAMPER") || act.includes("SEC63") || act.includes("ESAKSHYA")) {
      return "FORENSIC";
    }
    if (act.includes("DOCUMENT") || act.includes("CHARGESHEET") || act.includes("PANCHANAMA") || act.includes("LETTER")) {
      return "DOCUMENT";
    }
    if (act.includes("CCTNS") || act.includes("BHARATPOL") || act.includes("LERS") || act.includes("SYNC")) {
      return "INTEROP";
    }
    if (act.includes("DIARY")) {
      return "DIARY";
    }
    return "OTHER";
  };

  // Categorized counts for summary metrics
  const stats = useMemo(() => {
    let forensic = 0;
    let documents = 0;
    let interop = 0;
    let diary = 0;

    logs.forEach((log) => {
      const cat = getLogCategory(log.action);
      if (cat === "FORENSIC") forensic++;
      else if (cat === "DOCUMENT") documents++;
      else if (cat === "INTEROP") interop++;
      else if (cat === "DIARY") diary++;
    });

    return {
      total: logs.length,
      forensic,
      documents,
      interop,
      diary
    };
  }, [logs]);

  // Filtered logs based on search query and category
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const cat = getLogCategory(log.action);
      if (activeCategory === "FORENSIC" && cat !== "FORENSIC") return false;
      if (activeCategory === "DOCUMENT" && cat !== "DOCUMENT") return false;
      if (activeCategory === "INTEROP" && cat !== "INTEROP") return false;
      if (activeCategory === "DIARY" && cat !== "DIARY") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.officer_name && log.officer_name.toLowerCase().includes(q)) ||
        (log.case_id && log.case_id.toLowerCase().includes(q)) ||
        (log.role && log.role.toLowerCase().includes(q))
      );
    });
  }, [logs, activeCategory, searchQuery]);

  // Extract SHA-256 hash (64 hex characters) if present in details
  const extractHash = (details = "") => {
    const match = details.match(/\b([A-Fa-f0-9]{64})\b/);
    return match ? match[1] : null;
  };

  // Extract reference tokens if present
  const extractRefToken = (details = "") => {
    const match = details.match(/(BHARATPOL\/[A-Za-z0-9\/-]+|LERS-[A-Za-z0-9\/-]+|ESAKSHYA\/[A-Za-z0-9\/-]+|CCTNS\/[A-Za-z0-9\/-]+)/);
    return match ? match[0] : null;
  };

  const getActionConfig = (action = "", details = "") => {
    const isTampered = details.includes("TAMPERED") || details.includes("Match = False");
    const isVerified = details.includes("VERIFIED") || details.includes("Match = True");

    if (isTampered) {
      return {
        icon: AlertTriangle,
        iconColor: "#FFFFFF",
        markerBg: "var(--bordo)",
        markerBorder: "var(--bordo-hover)",
        badgeClass: "badge-red",
        label: "TAMPER ALERT"
      };
    }
    if (isVerified) {
      return {
        icon: ShieldCheck,
        iconColor: "#FFFFFF",
        markerBg: "var(--green)",
        markerBorder: "var(--green-accent)",
        badgeClass: "badge-green",
        label: "INTEGRITY VERIFIED"
      };
    }

    const cat = getLogCategory(action);
    switch (cat) {
      case "FORENSIC":
        return {
          icon: Lock,
          iconColor: "var(--stat-forensic)",
          markerBg: "var(--bg-surface)",
          markerBorder: "var(--stat-forensic)",
          badgeClass: "badge-green",
          label: action
        };
      case "DOCUMENT":
        return {
          icon: FileText,
          iconColor: "var(--stat-document)",
          markerBg: "var(--bg-surface)",
          markerBorder: "var(--stat-document)",
          badgeClass: "badge-blue",
          label: action
        };
      case "INTEROP":
        return {
          icon: ArrowLeftRight,
          iconColor: "var(--stat-interop)",
          markerBg: "var(--bg-surface)",
          markerBorder: "var(--stat-interop)",
          badgeClass: "badge-gold",
          label: action
        };
      case "DIARY":
        return {
          icon: BookOpen,
          iconColor: "var(--text-secondary)",
          markerBg: "var(--bg-surface)",
          markerBorder: "var(--border-medium)",
          badgeClass: "badge-neutral",
          label: action
        };
      default:
        return {
          icon: Clock,
          iconColor: "var(--text-secondary)",
          markerBg: "var(--bg-surface)",
          markerBorder: "var(--border-medium)",
          badgeClass: "badge-subtle",
          label: action
        };
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const date = new Date(isoStr);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "6px",
                background: "var(--bordo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--cream)"
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-heading)", margin: 0, letterSpacing: "-0.3px" }}>
              System Audit Trail & Forensic Ledger
            </h1>
            <span className="badge badge-bns" style={{ fontSize: "10px" }}>
              BSA Sec 63 / BNSS Sec 175
            </span>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0, maxWidth: "780px" }}>
            Immutable, timestamped ledger of digital evidence SHA-256 hashes, statutory documents, and ICJS / CCTNS interoperability transactions.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="btn btn-outline"
            style={{ fontSize: "12px", padding: "6px 12px" }}
            title="Export full ledger as JSON for judicial audit"
          >
            <Download size={13} /> Export Ledger
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn btn-primary"
            style={{ fontSize: "12px", padding: "6px 14px" }}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            {loading ? "Refreshing..." : "Refresh Records"}
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          marginBottom: "20px"
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: "14px 16px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)"
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Total Audit Records
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-heading)", marginTop: "4px" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Tamper-evident chain of custody
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: "14px 16px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)"
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Forensics & SHA-256 Hashes
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--stat-forensic)", marginTop: "4px" }}>
            {stats.forensic}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
            e-Sakshya & Sec 63 BSA stamps
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: "14px 16px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)"
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Judicial Documents
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--stat-document)", marginTop: "4px" }}>
            {stats.documents}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Panchanama & Chargesheets
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: "14px 16px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)"
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            ICJS & Interop Syncs
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--stat-interop)", marginTop: "4px" }}>
            {stats.interop}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
            CCTNS, BharatPol, LERS WhatsApp
          </div>
        </div>
      </div>

      {/* ── Search & Filter Navigation Bar ── */}
      <div
        className="glass-panel"
        style={{
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        {/* Category Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`audit-filter-pill ${activeCategory === "ALL" ? "active" : ""}`}
          >
            All Events ({stats.total})
          </button>
          <button
            onClick={() => setActiveCategory("FORENSIC")}
            className={`audit-filter-pill ${activeCategory === "FORENSIC" ? "active" : ""}`}
          >
            Forensics & Hash ({stats.forensic})
          </button>
          <button
            onClick={() => setActiveCategory("DOCUMENT")}
            className={`audit-filter-pill ${activeCategory === "DOCUMENT" ? "active" : ""}`}
          >
            Documents ({stats.documents})
          </button>
          <button
            onClick={() => setActiveCategory("INTEROP")}
            className={`audit-filter-pill ${activeCategory === "INTEROP" ? "active" : ""}`}
          >
            Interop & Sync ({stats.interop})
          </button>
          <button
            onClick={() => setActiveCategory("DIARY")}
            className={`audit-filter-pill ${activeCategory === "DIARY" ? "active" : ""}`}
          >
            Case Diary ({stats.diary})
          </button>
        </div>

        {/* Live Search Input */}
        <div style={{ position: "relative", minWidth: "260px", flex: "1", maxWidth: "360px" }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search officer, hash, case, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: "30px",
              paddingRight: "10px",
              fontSize: "12px",
              height: "34px",
              borderRadius: "6px"
            }}
          />
        </div>
      </div>

      {/* ── Timeline Audit Ledger Feed ── */}
      <div className="glass-panel" style={{ padding: "24px 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px", color: "var(--bordo)" }} />
            <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
              Loading Tamper-Evident Ledger...
            </div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>
              Verifying cryptographic hash sequence from SQLite store
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <ShieldAlert size={28} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
            <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
              No audit entries matched the filter criteria
            </div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>
              {searchQuery ? `No records found matching "${searchQuery}"` : "No events recorded in this category yet."}
            </div>
            {(searchQuery || activeCategory !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("ALL");
                }}
                className="btn btn-secondary"
                style={{ marginTop: "14px", fontSize: "12px", padding: "5px 12px" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="audit-timeline-container">
            {filteredLogs.map((log, idx) => {
              const cfg = getActionConfig(log.action, log.details);
              const IconComp = cfg.icon;
              const hash = extractHash(log.details);
              const refToken = extractRefToken(log.details);
              const isCopied = copiedId === log.id || copiedId === `hash-${idx}`;

              return (
                <div key={log.id || idx} className="audit-timeline-entry">
                  {/* Timeline Node Marker */}
                  <div
                    className="audit-timeline-marker"
                    style={{
                      background: cfg.markerBg,
                      borderColor: cfg.markerBorder
                    }}
                  >
                    <IconComp size={14} color={cfg.iconColor} />
                  </div>

                  {/* Audit Record Card */}
                  <div className="audit-timeline-card">
                    {/* Top Row: Action Badge + Case ID + Officer + Timestamp */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "8px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className={`badge ${cfg.badgeClass}`} style={{ fontSize: "10.5px" }}>
                          {log.action}
                        </span>

                        {log.case_id && (
                          <span
                            className="badge badge-neutral"
                            style={{ fontSize: "10px", fontFamily: "var(--font-mono)" }}
                            title={`Case ID: ${log.case_id}`}
                          >
                            CASE #{log.case_id.slice(0, 8)}
                          </span>
                        )}

                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <User size={11} color="var(--text-muted)" />
                          <strong>{log.officer_name || "Investigating Officer"}</strong>
                          <span style={{ color: "var(--text-muted)" }}>({log.role || "IO"})</span>
                        </span>
                      </div>

                      {/* Precise Timestamp */}
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono)",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <Clock size={11} />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Details Text */}
                    <div
                      style={{
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "var(--text-primary)",
                        fontWeight: "500"
                      }}
                    >
                      {log.details}
                    </div>

                    {/* Cryptographic SHA-256 Digest Chip (if hash is detected) */}
                    {hash && (
                      <div className="audit-hash-badge">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Lock size={12} color="var(--stat-forensic)" />
                          <span style={{ color: "var(--text-muted)", fontSize: "10.5px" }}>SHA-256:</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{hash}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(hash, `hash-${idx}`)}
                          className="btn btn-secondary"
                          style={{
                            padding: "2px 7px",
                            fontSize: "10px",
                            height: "22px",
                            borderRadius: "4px"
                          }}
                          title="Copy SHA-256 Hash"
                        >
                          {isCopied ? <Check size={11} color="var(--stat-forensic)" /> : <Copy size={11} />}
                          <span>{isCopied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}

                    {/* ICJS / Interop Reference Token (if reference detected) */}
                    {refToken && !hash && (
                      <div
                        style={{
                          marginTop: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "var(--bg-surface-raised)",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-subtle)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px"
                        }}
                      >
                        <ArrowLeftRight size={11} color="var(--stat-interop)" />
                        <span style={{ color: "var(--text-muted)" }}>Ack Ref:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{refToken}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

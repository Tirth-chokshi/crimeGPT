import React, { useState, useEffect } from "react";
import { ShieldAlert, RefreshCw, User, Calendar, Tag } from "lucide-react";
import { api } from "../api";
import { translations } from "../translations";

export default function AuditPage({ currentLang }) {
  const t = translations[currentLang] || translations.en;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert size={20} color="var(--police-red)" />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "800" }}>System Audit Trail & Integrity Log</h1>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Immutable, chronological record of case modifications, legal section selections, and document syntheses.
          </p>
        </div>

        <button onClick={fetchLogs} className="btn btn-secondary" style={{ fontSize: "13px" }}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className="glass-panel" style={{ padding: "24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading audit entries...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No audit records available.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {logs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(19, 29, 51, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span className="badge badge-blue" style={{ fontSize: "10px" }}>{log.action}</span>
                    <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#f8fafc" }}>{log.details}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "16px" }}>
                    <span>Officer: <strong>{log.officer_name}</strong></span>
                    <span>Role: <strong>{log.role}</strong></span>
                  </div>
                </div>

                <div style={{ fontSize: "11.5px", color: "var(--police-gold)", fontFamily: "var(--font-mono)" }}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

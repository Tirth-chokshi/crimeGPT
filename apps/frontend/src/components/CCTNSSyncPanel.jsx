import React, { useState, useEffect } from "react";
import {
  Layers, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck,
  Send, Terminal, History, Database, Cloud, FileCheck, Copy, ArrowRight,
  ShieldAlert, Code, Eye, ExternalLink
} from "lucide-react";
import { api } from "../api";

export default function CCTNSSyncPanel({
  caseId,
  firNumber,
  caseData,
  officerName = "Inspector R. K. Jadeja",
  officerBadge = "GJ-AHM-4421"
}) {
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [xmlPayload, setXmlPayload] = useState(null);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [bharatpolSynced, setBharatpolSynced] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const loadStatus = async () => {
    try {
      const data = await api.getCaseSyncStatus(caseId);
      setSyncStatus(data);
    } catch (err) {
      console.error("Failed to load sync status:", err);
    }
  };

  useEffect(() => {
    if (caseId) {
      loadStatus();
    }
  }, [caseId]);

  const addTerminalLog = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setTerminalLogs((prev) => [...prev, { timestamp, msg, type }]);
  };

  const handlePushToCctns = async () => {
    setIsSyncing(true);
    setTerminalLogs([]);
    addTerminalLog("Initiating ICJS / CCTNS Core Application Software Handshake...", "info");
    addTerminalLog(`Serializing Case Dossier for FIR: ${firNumber}...`, "info");

    try {
      await new Promise((r) => setTimeout(r, 400));
      addTerminalLog("Encrypting payload with State Police Public Key (RSA-4096)...", "info");

      await new Promise((r) => setTimeout(r, 400));
      addTerminalLog("Connecting to National CCTNS Gateway (CAS 5.0 @ 10.24.8.102)...", "info");

      const res = await api.syncCaseToCctns(caseId, officerName, officerBadge);

      if (res.cas_payload_preview) {
        setXmlPayload(res.cas_payload_preview);
      }

      await new Promise((r) => setTimeout(r, 300));
      addTerminalLog(`✔ Handshake verified. ICJS Bus Token: ${res.icjs_transaction_token}`, "success");
      addTerminalLog(`✔ CCTNS Acknowledgment Generated: ${res.cctns_ack_no}`, "success");
      addTerminalLog("State Central Repository & Judiciary Bus updated successfully.", "success");

      showToast(`CCTNS Synced: ${res.cctns_ack_no}`);
      loadStatus();
    } catch (err) {
      addTerminalLog(`❌ Sync failed: ${err.message}`, "error");
      alert("CCTNS Sync error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToBharatpol = async () => {
    setIsSyncing(true);
    addTerminalLog("Initiating BharatPol National Law Enforcement Portal (ICJS / Interpol) Sync...", "info");
    addTerminalLog(`Extracting accused biometrics and charges for FIR: ${firNumber}...`, "info");

    try {
      await new Promise((r) => setTimeout(r, 500));
      const res = await api.pushToBharatpol(caseId);

      addTerminalLog(`✔ Pushed ${res.total_records} accused records to BharatPol ICJS Gateway.`, "success");
      res.records.forEach((r, idx) => {
        addTerminalLog(`  [Accused #${idx+1}] Bureau Ref: ${r.bureau_ref_id} • FP: ${r.fingerprint_record_id}`, "success");
      });

      setBharatpolSynced(true);
      showToast("Pushed to BharatPol National Criminal Database!");
      loadStatus();
    } catch (err) {
      addTerminalLog(`❌ BharatPol Sync failed: ${err.message}`, "error");
      alert("BharatPol Sync error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkSyncEsakshya = async () => {
    if (!caseData?.seizures || caseData.seizures.length === 0) {
      alert("No seizure items found to sync with e-Sakshya.");
      return;
    }

    setIsSyncing(true);
    setTerminalLogs([]);
    addTerminalLog(`Starting e-Sakshya batch upload for ${caseData.seizures.length} Mudamal items...`, "info");

    try {
      for (let i = 0; i < caseData.seizures.length; i++) {
        const item = caseData.seizures[i];
        addTerminalLog(`[${i + 1}/${caseData.seizures.length}] Transmitting '${item.item_name}' SHA-256 to e-Sakshya vault...`, "info");
        await new Promise((r) => setTimeout(r, 300));

        const res = await api.syncEvidenceToEsakshya(
          item.id,
          item.hash_value_or_serial,
          officerName,
          officerBadge
        );
        addTerminalLog(`✔ Registered: ${res.esakshya_reg_no} -> ${res.vault_uri}`, "success");
      }

      addTerminalLog("All digital evidence items vaulted in national repository under BSA Sec 63.", "success");
      showToast("e-Sakshya batch sync completed successfully.");
      loadStatus();
    } catch (err) {
      addTerminalLog(`❌ e-Sakshya sync error: ${err.message}`, "error");
      alert("e-Sakshya sync error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "600",
            fontSize: "13px",
            zIndex: 1100
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div
        className="glass-panel"
        style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
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
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Database size={24} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "800", margin: 0, color: "#f8fafc" }}>
                National ICJS, CCTNS &amp; BharatPol Gateway
              </h3>
              <span className="badge badge-green" style={{ fontSize: "10px" }}>
                CAS 5.0 ACTIVE
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
              Unified Interoperable Criminal Justice System (ICJS), BharatPol &amp; e-Sakshya Digital Evidence Vault.
            </p>
          </div>
        </div>

        {/* Sync Actions */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={handlePushToCctns}
            disabled={isSyncing}
            className="btn btn-primary"
            style={{ fontSize: "12px", padding: "7px 14px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Send size={13} />
            {isSyncing ? "Syncing..." : "Push to CCTNS CAS"}
          </button>

          <button
            onClick={handlePushToBharatpol}
            disabled={isSyncing}
            className="btn btn-outline"
            style={{ fontSize: "12px", padding: "7px 14px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ShieldAlert size={13} color="#38bdf8" />
            Push to BharatPol
          </button>

          <button
            onClick={handleBulkSyncEsakshya}
            disabled={isSyncing}
            className="btn btn-cyan"
            style={{ fontSize: "12px", padding: "7px 14px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Cloud size={13} />
            e-Sakshya Vault
          </button>
        </div>
      </div>

      {/* Sync Status 3-Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
        {/* Card 1: CCTNS Status */}
        <div className="glass-panel" style={{ padding: "16px", borderLeft: syncStatus?.cctns_synced ? "4px solid #10b981" : "4px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
              <Database size={14} color="#38bdf8" /> CCTNS CAS 5.0
            </span>
            <span className={`badge ${syncStatus?.cctns_synced ? "badge-green" : "badge-gold"}`} style={{ fontSize: "9px" }}>
              {syncStatus?.cctns_status || "PENDING_SYNC"}
            </span>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Case dossier synchronized with State Data Centre &amp; Judiciary Bus.
          </div>
          {xmlPayload && (
            <button
              onClick={() => setShowXmlModal(true)}
              className="btn btn-ghost"
              style={{ fontSize: "11px", padding: "4px 0", color: "var(--police-blue)", marginTop: "6px" }}
            >
              <Code size={12} /> Inspect CAS 5.0 XML Schema →
            </button>
          )}
        </div>

        {/* Card 2: BharatPol National Criminal Portal */}
        <div className="glass-panel" style={{ padding: "16px", borderLeft: bharatpolSynced ? "4px solid #10b981" : "4px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldAlert size={14} color="#38bdf8" /> BharatPol ICJS Portal
            </span>
            <span className={`badge ${bharatpolSynced ? "badge-green" : "badge-blue"}`} style={{ fontSize: "9px" }}>
              {bharatpolSynced ? "SYNCED & ACTIVE" : "READY TO PUSH"}
            </span>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            National criminal record tracking, interstate crime links, and Interpol alert verification.
          </div>
        </div>

        {/* Card 3: e-Sakshya Status */}
        <div className="glass-panel" style={{ padding: "16px", borderLeft: syncStatus?.esakshya_registered_count > 0 ? "4px solid #10b981" : "4px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
              <Cloud size={14} color="#38bdf8" /> e-Sakshya Evidence Vault
            </span>
            <span className={`badge ${syncStatus?.esakshya_registered_count > 0 ? "badge-green" : "badge-blue"}`} style={{ fontSize: "9px" }}>
              {syncStatus?.esakshya_registered_count || 0} VAULTED
            </span>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Digital evidence SHA-256 tokens registered in National Informatics Centre (NIC) cloud under BSA Sec 63.
          </div>
        </div>
      </div>

      {/* Live Terminal Handshake Console */}
      {terminalLogs.length > 0 && (
        <div
          style={{
            background: "#090d16",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: "8px",
            padding: "14px",
            fontFamily: "var(--font-mono)",
            fontSize: "11.5px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", marginBottom: "8px", fontWeight: "700" }}>
            <Terminal size={13} /> ICJS Gateway Interoperability Terminal Handshake
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "180px", overflowY: "auto" }}>
            {terminalLogs.map((log, idx) => (
              <div key={idx} style={{ display: "flex", gap: "8px" }}>
                <span style={{ color: "#64748b" }}>[{log.timestamp}]</span>
                <span
                  style={{
                    color: log.type === "success" ? "#34d399" : log.type === "error" ? "#ef4444" : "#cbd5e1"
                  }}
                >
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync History Audit Trail */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#38bdf8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <History size={15} /> Sync Transaction Audit Trail ({syncStatus?.history?.length || 0})
        </h4>

        {!syncStatus?.history || syncStatus.history.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "16px" }}>
            No synchronization transactions recorded yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {syncStatus.history.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "rgba(19, 29, 51, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "8px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span className="badge badge-blue" style={{ fontSize: "9px" }}>
                      {item.system}
                    </span>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                      {item.timestamp_ist}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#f8fafc" }}>
                    {item.details}
                  </div>
                </div>

                <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                  Officer: <strong>{item.officer_name}</strong> [{item.role}]
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: CAS 5.0 XML Schema Inspector ── */}
      {showXmlModal && xmlPayload && (
        <div className="modal-overlay" onClick={() => setShowXmlModal(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "700px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Code size={16} color="var(--police-blue)" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>CCTNS CAS 5.0 XML Payload Preview</h3>
              </div>
              <button onClick={() => setShowXmlModal(false)} className="btn btn-secondary btn-icon" style={{ width: "24px", height: "24px" }}>✕</button>
            </div>

            <pre
              style={{
                background: "#0a0f1d",
                padding: "14px",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                fontSize: "11.5px",
                color: "#38bdf8",
                fontFamily: "var(--font-mono)",
                whiteSpace: "pre-wrap",
                maxHeight: "360px",
                overflowY: "auto"
              }}
            >
              {xmlPayload}
            </pre>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button onClick={() => copyToClipboard(xmlPayload, "XML Payload")} className="btn btn-primary" style={{ fontSize: "12px" }}>
                Copy CAS 5.0 XML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

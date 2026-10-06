import React, { useState } from "react";
import {
  ShieldCheck, Lock, Key, FileText, QrCode, Upload, Download,
  CheckCircle2, AlertTriangle, RefreshCw, Copy, ExternalLink, Eye,
  X, CloudUpload, Search, FileCheck, ShieldAlert, Box
} from "lucide-react";
import { api } from "../api";

export default function EvidenceVaultPanel({
  caseId,
  firNumber,
  seizures = [],
  onSeizureUpdated,
  officerName = "Inspector R. K. Jadeja",
  officerBadge = "GJ-AHM-4421"
}) {
  const [selectedSeizure, setSelectedSeizure] = useState(null);
  const [qrModalSeizure, setQrModalSeizure] = useState(null);
  const [hashModalSeizure, setHashModalSeizure] = useState(null);
  const [verifyModalSeizure, setVerifyModalSeizure] = useState(null);
  const [manualHash, setManualHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  // Upload file & compute SHA-256
  const handleUploadComputeHash = async (e) => {
    e.preventDefault();
    if (!selectedFile || !hashModalSeizure) return;

    setIsProcessing(true);
    try {
      const res = await api.computeSeizureHash(
        hashModalSeizure.id,
        selectedFile,
        officerName,
        officerBadge
      );
      showToast(`SHA-256 computed: ${res.sha256.substring(0, 16)}...`);
      setHashModalSeizure(null);
      setSelectedFile(null);
      if (onSeizureUpdated) onSeizureUpdated();
    } catch (err) {
      alert("Error computing hash: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Set Manual Hash
  const handleSetManualHash = async (e) => {
    e.preventDefault();
    if (!manualHash.trim() || !hashModalSeizure) return;

    setIsProcessing(true);
    try {
      await api.setSeizureHashManual(hashModalSeizure.id, manualHash, officerName);
      showToast("Manual SHA-256 hash attached to seizure item.");
      setHashModalSeizure(null);
      setManualHash("");
      if (onSeizureUpdated) onSeizureUpdated();
    } catch (err) {
      alert("Error attaching hash: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify Tamper check
  const handleVerifyTamper = async (e) => {
    e.preventDefault();
    if (!selectedFile || !verifyModalSeizure) return;

    setIsProcessing(true);
    setVerifyResult(null);
    try {
      const res = await api.verifySeizureHash(verifyModalSeizure.id, selectedFile);
      setVerifyResult(res);
    } catch (err) {
      alert("Verification failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync to e-Sakshya
  const handleSyncToEsakshya = async (seizure) => {
    setIsProcessing(true);
    try {
      const res = await api.syncEvidenceToEsakshya(
        seizure.id,
        seizure.hash_value_or_serial,
        officerName,
        officerBadge
      );
      showToast(`Registered in e-Sakshya Vault: ${res.esakshya_reg_no}`);
      if (onSeizureUpdated) onSeizureUpdated();
    } catch (err) {
      alert("e-Sakshya sync failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const electronicItemsCount = seizures.filter(
    (s) =>
      s.category === "ELECTRONIC" ||
      s.category === "DIGITAL" ||
      s.hash_value_or_serial ||
      (s.item_name && /mobile|phone|cctv|dvr|laptop|hard disk|pendrive|sim/i.test(s.item_name))
  ).length;

  const hashedItemsCount = seizures.filter((s) => s.hash_value_or_serial && s.hash_value_or_serial.length >= 32).length;

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

      {/* Hero Header: BSA Section 63 Evidence Vault */}
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
            <ShieldCheck size={24} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "800", margin: 0, color: "#f8fafc" }}>
                BSA Electronic Evidence Vault
              </h3>
              <span className="badge badge-blue" style={{ fontSize: "10px" }}>
                Section 63 BSA Mandated
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
              Cryptographic SHA-256 bitstream hashing, Section 63 BSA Digital Certificate generation, and Malkhana QR custody tagging.
            </p>
          </div>
        </div>

        {/* Quick Vault Metrics */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(19, 29, 51, 0.8)", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Mudamal</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#f8fafc" }}>{seizures.length}</div>
          </div>
          <div style={{ background: "rgba(19, 29, 51, 0.8)", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Digital Items</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#38bdf8" }}>{electronicItemsCount}</div>
          </div>
          <div style={{ background: "rgba(19, 29, 51, 0.8)", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>SHA-256 Hashed</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#34d399" }}>{hashedItemsCount}</div>
          </div>
        </div>
      </div>

      {/* Seizure Items Evidence List */}
      {seizures.length === 0 ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
          <Box size={36} color="var(--text-muted)" style={{ marginBottom: "12px", opacity: 0.6 }} />
          <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>
            No Seizure Items Recorded in Case
          </h4>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto" }}>
            Seized property (Mudamal), electronic media, weapons, and documents recorded under Section 105 BNSS will appear here for cryptographic vaulting.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {seizures.map((seizure, idx) => {
            const hasHash = seizure.hash_value_or_serial && seizure.hash_value_or_serial.length >= 32;
            const certUrl = api.getBsaCertificateUrl(seizure.id, officerName, officerBadge);
            const qrUrl = api.getSeizureQrUrl(seizure.id);

            return (
              <div
                key={seizure.id || idx}
                className="glass-panel"
                style={{
                  padding: "20px",
                  background: "rgba(19, 29, 51, 0.7)",
                  border: hasHash ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                {/* Item Top Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: hasHash ? "rgba(52, 211, 153, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        border: hasHash ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {hasHash ? <Lock size={18} color="#34d399" /> : <AlertTriangle size={18} color="#f59e0b" />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: "#f8fafc" }}>
                          {seizure.item_name}
                        </span>
                        <span className="badge badge-purple" style={{ fontSize: "10px" }}>
                          {seizure.category || "MUDAMAL"}
                        </span>
                        {hasHash ? (
                          <span className="badge badge-green" style={{ fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={11} /> SHA-256 ATTACHED
                          </span>
                        ) : (
                          <span className="badge badge-gold" style={{ fontSize: "10px" }}>
                            HASH PENDING
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Seized from: <strong>{seizure.seized_from_person_name || "Scene of Crime"}</strong> • Place: {seizure.seizure_place || "Police Station Jurisdiction"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      Malkhana: <strong style={{ color: "var(--police-gold)" }}>{seizure.storage_location || "Locker Rack #B4"}</strong>
                    </span>
                  </div>
                </div>

                {/* Description */}
                {seizure.description && (
                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                    {seizure.description}
                  </p>
                )}

                {/* Hash Display or Action Prompt */}
                {hasHash ? (
                  <div
                    style={{
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Key size={15} color="#34d399" />
                      <div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Cryptographic SHA-256 Hex Digest (FIPS 180-4)
                        </div>
                        <div style={{ fontSize: "12.5px", fontFamily: "var(--font-mono)", color: "#34d399", fontWeight: "700" }}>
                          {seizure.hash_value_or_serial}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(seizure.hash_value_or_serial, "SHA-256 Hash")}
                      className="btn btn-outline"
                      style={{ fontSize: "11px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Copy size={12} /> Copy Hash
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px dashed rgba(245, 158, 11, 0.4)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--police-gold)" }}>
                      <AlertTriangle size={14} />
                      <span>No cryptographic hash attached. Section 63 BSA certificate requires an immutable SHA-256 hash.</span>
                    </div>
                    <button
                      onClick={() => setHashModalSeizure(seizure)}
                      className="btn btn-gold"
                      style={{ fontSize: "11.5px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Lock size={13} /> Compute / Attach Hash
                    </button>
                  </div>
                )}

                {/* Actions Toolbar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    paddingTop: "12px",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {/* Button 1: Download BSA Sec 63 Certificate */}
                    <a
                      href={certUrl}
                      download
                      className="btn btn-primary"
                      style={{ fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
                    >
                      <FileCheck size={14} />
                      Generate BSA Sec 63 Certificate (.docx)
                    </a>

                    {/* Button 2: Malkhana QR Code */}
                    <button
                      onClick={() => setQrModalSeizure(seizure)}
                      className="btn btn-secondary"
                      style={{ fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <QrCode size={14} />
                      Malkhana QR Tag
                    </button>

                    {/* Button 3: Verify / Tamper Check */}
                    {hasHash && (
                      <button
                        onClick={() => {
                          setVerifyModalSeizure(seizure);
                          setVerifyResult(null);
                          setSelectedFile(null);
                        }}
                        className="btn btn-outline"
                        style={{ fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <ShieldAlert size={14} />
                        Verify Tampering
                      </button>
                    )}
                  </div>

                  {/* Button 4: Push to e-Sakshya */}
                  <button
                    onClick={() => handleSyncToEsakshya(seizure)}
                    disabled={isProcessing}
                    className="btn btn-cyan"
                    style={{ fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <CloudUpload size={14} />
                    Push to e-Sakshya
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Compute / Attach SHA-256 Hash */}
      {hashModalSeizure && (
        <div className="modal-backdrop">
          <div
            className="glass-panel"
            style={{
              maxWidth: "520px",
              width: "90%",
              padding: "24px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={16} color="#38bdf8" />
                </div>
                <h4 style={{ fontSize: "15px", fontWeight: "800", margin: 0 }}>
                  Cryptographic Evidence Hashing
                </h4>
              </div>
              <button onClick={() => setHashModalSeizure(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Attaching hash to: <strong>{hashModalSeizure.item_name}</strong>
            </div>

            {/* Option A: Upload file for direct browser/server SHA-256 */}
            <form onSubmit={handleUploadComputeHash} style={{ marginBottom: "18px", padding: "14px", background: "rgba(19, 29, 51, 0.6)", borderRadius: "8px" }}>
              <label className="form-label" style={{ fontSize: "12px", marginBottom: "6px" }}>
                Option 1: Upload Evidence File to Compute SHA-256
              </label>
              <input
                type="file"
                className="form-control"
                style={{ fontSize: "12px", padding: "8px" }}
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <button
                type="submit"
                disabled={!selectedFile || isProcessing}
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "10px", fontSize: "12px", padding: "8px" }}
              >
                {isProcessing ? "Computing Hashes..." : "Compute & Attach SHA-256"}
              </button>
            </form>

            {/* Option B: Enter manual forensic hash */}
            <form onSubmit={handleSetManualHash} style={{ padding: "14px", background: "rgba(19, 29, 51, 0.6)", borderRadius: "8px" }}>
              <label className="form-label" style={{ fontSize: "12px", marginBottom: "6px" }}>
                Option 2: Paste SHA-256 Hash from Cellebrite / EnCase
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="64-character hex hash (e.g. E3B0C44298FC...)"
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                style={{ fontSize: "12px" }}
              />
              <button
                type="submit"
                disabled={!manualHash.trim() || isProcessing}
                className="btn btn-gold"
                style={{ width: "100%", marginTop: "10px", fontSize: "12px", padding: "8px" }}
              >
                Save Manual Hash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Malkhana QR Code Tag */}
      {qrModalSeizure && (
        <div className="modal-backdrop">
          <div
            className="glass-panel"
            style={{
              maxWidth: "460px",
              width: "90%",
              padding: "24px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
              textAlign: "center"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "800", margin: 0 }}>
                Malkhana Evidence Chain QR Tag
              </h4>
              <button onClick={() => setQrModalSeizure(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* Printable Tag Container */}
            <div
              style={{
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: "8px",
                padding: "20px",
                margin: "0 auto 16px auto",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", color: "#1e3a5f" }}>
                POLICE DEPARTMENT — EVIDENCE VAULT
              </div>
              <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "12px" }}>
                BSA 2023 Sec 63 & BNSS 2023 Sec 105 Compliant
              </div>

              {/* QR Image */}
              <img
                src={api.getSeizureQrUrl(qrModalSeizure.id)}
                alt="Malkhana Evidence QR Code"
                style={{ width: "180px", height: "180px", margin: "0 auto 12px auto", display: "block" }}
              />

              <div style={{ textAlign: "left", fontSize: "11px", lineHeight: "1.5", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
                <div><strong>FIR:</strong> {firNumber}</div>
                <div><strong>Item:</strong> {qrModalSeizure.item_name}</div>
                <div><strong>Location:</strong> {qrModalSeizure.storage_location || "Malkhana Locker Rack #B4"}</div>
                <div style={{ wordBreak: "break-all" }}>
                  <strong>SHA-256:</strong> {qrModalSeizure.hash_value_or_serial || "PENDING"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <a
                href={api.getSeizureQrUrl(qrModalSeizure.id)}
                download={`Malkhana_QR_${qrModalSeizure.item_name}.png`}
                className="btn btn-primary"
                style={{ fontSize: "12px", padding: "8px 18px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={14} /> Download QR PNG
              </a>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ fontSize: "12px", padding: "8px 18px" }}
              >
                Print Evidence Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Tamper Verification */}
      {verifyModalSeizure && (
        <div className="modal-backdrop">
          <div
            className="glass-panel"
            style={{
              maxWidth: "540px",
              width: "90%",
              padding: "24px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldAlert size={18} color="#38bdf8" />
                <h4 style={{ fontSize: "15px", fontWeight: "800", margin: 0 }}>
                  Tamper Detection & Integrity Verification
                </h4>
              </div>
              <button onClick={() => setVerifyModalSeizure(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "14px" }}>
              Target Evidence: <strong>{verifyModalSeizure.item_name}</strong>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#34d399", marginTop: "2px" }}>
                Recorded Base Hash: {verifyModalSeizure.hash_value_or_serial}
              </div>
            </div>

            <form onSubmit={handleVerifyTamper}>
              <label className="form-label" style={{ fontSize: "12px" }}>
                Upload current evidence file from storage/transit:
              </label>
              <input
                type="file"
                className="form-control"
                style={{ fontSize: "12px", padding: "8px", marginBottom: "12px" }}
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />

              <button
                type="submit"
                disabled={!selectedFile || isProcessing}
                className="btn btn-primary"
                style={{ width: "100%", fontSize: "12.5px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <RefreshCw size={14} className={isProcessing ? "spin" : ""} />
                {isProcessing ? "Verifying Bitstream..." : "Verify Cryptographic Match"}
              </button>
            </form>

            {/* Verification Result Display */}
            {verifyResult && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  borderRadius: "8px",
                  background: verifyResult.match ? "rgba(52, 211, 153, 0.1)" : "rgba(239, 68, 68, 0.12)",
                  border: verifyResult.match ? "1px solid rgba(52, 211, 153, 0.4)" : "1px solid rgba(239, 68, 68, 0.5)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "13px", color: verifyResult.match ? "#34d399" : "#ef4444", marginBottom: "6px" }}>
                  {verifyResult.match ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {verifyResult.status === "VERIFIED" ? "EVIDENCE INTEGRITY INTACT" : "TAMPER ALERT DETECTED"}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 8px 0" }}>
                  {verifyResult.message}
                </p>
                <div style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  <div>Current File SHA-256: {verifyResult.current_hash}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

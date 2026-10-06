import React, { useState } from "react";
import { FileText, Upload, Check, X, AlertCircle, Eye, RefreshCw, FileSearch } from "lucide-react";
import { api } from "../api";

export default function DocumentScannerModal({ isOpen, onClose, onApplyExtractedData }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Editable parsed fields
  const [extractedSummary, setExtractedSummary] = useState("");
  const [complainantName, setComplainantName] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");
  const [incidentDateTime, setIncidentDateTime] = useState("");
  const [incidentPlace, setIncidentPlace] = useState("");
  const [accusedDesc, setAccusedDesc] = useState("");
  const [seizedItems, setSeizedItems] = useState("");

  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setErrorMsg("");

    // Create local object URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Automatically trigger OCR scan
    setIsScanning(true);
    try {
      const res = await api.scanDocumentOCR(file);
      setOcrResult(res);

      const fields = res.structured_data || {};
      setExtractedSummary(res.extracted_text || "");
      setComplainantName(fields.complainant_name || "");
      setComplainantPhone(fields.complainant_phone || "");
      setIncidentDateTime(fields.incident_date_time || "");
      setIncidentPlace(fields.incident_place || "");
      setAccusedDesc(fields.accused_description || "");
      setSeizedItems(fields.seized_items || "");
    } catch (err) {
      console.error("OCR scan error:", err);
      setErrorMsg("Failed to process document: " + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    onApplyExtractedData({
      incident_summary: extractedSummary,
      complainant_name: complainantName,
      complainant_phone: complainantPhone,
      incident_date_time: incidentDateTime,
      incident_place: incidentPlace,
      accused_description: accusedDesc,
      seized_items: seizedItems
    });
    handleClose();
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setErrorMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 6, 6, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px"
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
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
              <FileSearch size={20} color="var(--bordo)" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-heading)", margin: 0 }}>
                Physical Police Complaint & FIR OCR Scanner
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                Upload scanned paper complaint, handwritten memo, or panchanama sheet
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Side by Side */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {!selectedFile ? (
            /* Upload Dropzone */
            <div
              style={{
                border: "2px dashed var(--border-medium)",
                borderRadius: "12px",
                padding: "48px 24px",
                textAlign: "center",
                background: "var(--cream-soft)",
                cursor: "pointer"
              }}
              onClick={() => document.getElementById("ocr-file-input").click()}
            >
              <Upload size={40} color="var(--bordo)" style={{ marginBottom: "12px" }} />
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-heading)", marginBottom: "6px" }}>
                Click to upload or drag & drop scanned complaint image
              </h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Supports PNG, JPG, JPEG, WEBP scanned documents (English, Hindi & Gujarati headers)
              </p>
              <button type="button" className="btn btn-primary" style={{ fontSize: "12px", padding: "8px 18px" }}>
                Browse Physical Files
              </button>
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            /* Side-by-Side Review */
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "20px" }}>
              {/* Left Column: Image Preview */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--bg-inline-card)",
                  borderRadius: "10px",
                  padding: "14px",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--bordo)" }}>
                    Scanned Document Preview
                  </span>
                  <label
                    style={{ fontSize: "11px", color: "var(--police-gold)", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Change File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                <div
                  style={{
                    flex: 1,
                    minHeight: "260px",
                    maxHeight: "360px",
                    overflow: "hidden",
                    borderRadius: "8px",
                    background: "var(--bg-code)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Scanned Document Preview"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  )}
                </div>

                {ocrResult?.image_info && (
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", textAlign: "center" }}>
                    Format: {ocrResult.image_info.format} | {ocrResult.image_info.width}x{ocrResult.image_info.height}px
                  </div>
                )}
              </div>

              {/* Right Column: OCR Extraction Review & Edit */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {isScanning ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <RefreshCw className="animate-spin" size={32} color="var(--bordo)" style={{ marginBottom: "12px" }} />
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-heading)" }}>
                      Processing Document OCR...
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Detecting text patterns and extracting complaint metadata
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileSearch size={15} /> Extracted Document Text & Fields
                      </span>
                      <span className="badge badge-green" style={{ fontSize: "10px" }}>
                        OCR Parsed
                      </span>
                    </div>

                    {/* Auto-detected extracted metadata fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label className="form-label" style={{ fontSize: "11px" }}>Complainant Name</label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: "12px", padding: "6px 10px" }}
                          value={complainantName}
                          onChange={(e) => setComplainantName(e.target.value)}
                          placeholder="Extracted complainant name"
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: "11px" }}>Incident Date/Time</label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: "12px", padding: "6px 10px" }}
                          value={incidentDateTime}
                          onChange={(e) => setIncidentDateTime(e.target.value)}
                          placeholder="e.g. 14-Aug-2026 21:30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>Incident Place / Location</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                        value={incidentPlace}
                        onChange={(e) => setIncidentPlace(e.target.value)}
                        placeholder="Extracted place of crime"
                      />
                    </div>

                    {/* Full Narrative Text */}
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Incident Narrative / Complaint Statement (Editable):
                      </label>
                      <textarea
                        className="form-control"
                        style={{ minHeight: "110px", fontSize: "12.5px", lineHeight: "1.4" }}
                        value={extractedSummary}
                        onChange={(e) => setExtractedSummary(e.target.value)}
                        placeholder="Full extracted narrative statement..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                marginTop: "16px",
                padding: "10px 14px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#fca5a5",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            background: "var(--bg-surface-raised)"
          }}
        >
          <button type="button" onClick={handleClose} className="btn btn-secondary" style={{ fontSize: "13px" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!extractedSummary.trim()}
            className="btn btn-primary"
            style={{ fontSize: "13px", padding: "8px 20px" }}
          >
            <Check size={16} /> Apply Extracted Data to Case
          </button>
        </div>
      </div>
    </div>
  );
}

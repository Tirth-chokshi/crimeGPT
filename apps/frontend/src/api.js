const API_BASE = import.meta.env.VITE_API_BASE || "/api";

let _authToken = localStorage.getItem("crimegpt_auth_token") || "";

function getHeaders(customHeaders = {}) {
  const headers = { ...customHeaders };
  if (_authToken) {
    headers["Authorization"] = `Bearer ${_authToken}`;
  }
  return headers;
}

export const api = {
  setAuthToken(token) {
    _authToken = token || "";
    if (token) {
      localStorage.setItem("crimegpt_auth_token", token);
    } else {
      localStorage.removeItem("crimegpt_auth_token");
    }
  },

  getAuthToken() {
    return _authToken;
  },

  // Auth
  async login(role = "IO") {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "officer", password: "password", role })
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    if (data.token) {
      api.setAuthToken(data.token);
    }
    return data;
  },

  async getAuthRoles() {
    const res = await fetch(`${API_BASE}/auth/roles`);
    if (!res.ok) throw new Error("Failed to fetch roles");
    return res.json();
  },

  async getAuthMe() {
    if (!_authToken) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  },

  // Cases
  async getCases(status = "", search = "") {
    let url = `${API_BASE}/cases/`;
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (search) params.append("search", search);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch cases");
    return res.json();
  },

  async getCaseById(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch case details");
    return res.json();
  },

  async createCase(caseData) {
    const res = await fetch(`${API_BASE}/cases/`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(caseData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create case");
    }
    return res.json();
  },

  async updateCaseStatus(caseId, status, notes = "", officerName = "Inspector R. K. Jadeja") {
    const res = await fetch(`${API_BASE}/cases/${caseId}/status?status=${encodeURIComponent(status)}&notes=${encodeURIComponent(notes)}&officer_name=${encodeURIComponent(officerName)}`, {
      method: "PATCH",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to update status");
    return res.json();
  },

  // Legal Intelligence
  async analyzeNarrative(narrative, language = "en", engineMode = "auto") {
    const res = await fetch(`${API_BASE}/legal-intel/suggest?engine_mode=${engineMode}`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ narrative, language })
    });
    if (!res.ok) throw new Error("Failed to analyze narrative");
    return res.json();
  },

  async getEngineStatus() {
    const res = await fetch(`${API_BASE}/legal-intel/engine-status`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to get engine status");
    return res.json();
  },

  async getCaseLegalRecommendations(caseId) {
    const res = await fetch(`${API_BASE}/legal-intel/case/${caseId}/recommendations`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to get legal recommendations");
    return res.json();
  },

  // Documents
  async getDocumentTypes() {
    const res = await fetch(`${API_BASE}/documents/types`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to get document types");
    return res.json();
  },

  async generateDocument(caseId, docType, language = "en", overrideFields = null, officerName = "Inspector R. K. Jadeja") {
    const res = await fetch(`${API_BASE}/documents/generate/${caseId}?officer_name=${encodeURIComponent(officerName)}`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        doc_type: docType,
        language,
        override_fields: overrideFields
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to generate document");
    }
    return res.json();
  },

  async getCaseDocuments(caseId) {
    const res = await fetch(`${API_BASE}/documents/case/${caseId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to get case documents");
    return res.json();
  },

  getDownloadUrl(filename) {
    return `${API_BASE}/documents/download/${filename}`;
  },

  getDocumentPreviewUrl(caseId, docType) {
    return `${API_BASE}/io/documents/preview/${caseId}/${docType}`;
  },

  // Case Diary & Statutory Compliance
  async getCaseDiary(caseId) {
    const res = await fetch(`${API_BASE}/diary/${caseId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to get case diary");
    return res.json();
  },

  async addDiaryEvent(caseId, eventData) {
    const res = await fetch(`${API_BASE}/diary/${caseId}/event`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(eventData)
    });
    if (!res.ok) throw new Error("Failed to add diary event");
    return res.json();
  },

  async getComplianceClocks(caseId) {
    const res = await fetch(`${API_BASE}/diary/${caseId}/compliance-clocks`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to get statutory compliance clocks");
    return res.json();
  },

  async getComplianceAlerts(caseId) {
    const res = await fetch(`${API_BASE}/diary/${caseId}/alerts`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to get compliance alerts");
    return res.json();
  },

  getCaseDiaryExportUrl(caseId) {
    return `${API_BASE}/diary/${caseId}/export`;
  },

  // BSA Electronic Evidence Vault (Sec 63)
  async computeSeizureHash(seizureId, file, officerName = "Inspector R. K. Jadeja", officerBadge = "GJ-AHM-4421") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("officer_name", officerName);
    formData.append("officer_badge", officerBadge);
    const res = await fetch(`${API_BASE}/evidence/${seizureId}/compute-hash`, {
      method: "POST",
      headers: getHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to compute cryptographic hash");
    }
    return res.json();
  },

  async setSeizureHashManual(seizureId, sha256Hash, officerName = "Inspector R. K. Jadeja") {
    const formData = new FormData();
    formData.append("sha256_hash", sha256Hash);
    formData.append("officer_name", officerName);
    const res = await fetch(`${API_BASE}/evidence/${seizureId}/set-hash`, {
      method: "POST",
      headers: getHeaders(),
      body: formData
    });
    if (!res.ok) throw new Error("Failed to attach hash");
    return res.json();
  },

  getBsaCertificateUrl(seizureId, officerName = "Inspector R. K. Jadeja", officerBadge = "GJ-AHM-4421") {
    return `${API_BASE}/evidence/${seizureId}/certificate?officer_name=${encodeURIComponent(officerName)}&officer_badge=${encodeURIComponent(officerBadge)}`;
  },

  getSeizureQrUrl(seizureId) {
    return `${API_BASE}/evidence/${seizureId}/qr`;
  },

  async verifySeizureHash(seizureId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/evidence/${seizureId}/verify-hash`, {
      method: "POST",
      headers: getHeaders(),
      body: formData
    });
    if (!res.ok) throw new Error("Failed to verify evidence hash");
    return res.json();
  },

  // CCTNS & e-Sakshya Interoperability Sync
  async syncCaseToCctns(caseId, officerName = "Inspector R. K. Jadeja", officerBadge = "GJ-AHM-4421") {
    const res = await fetch(`${API_BASE}/sync/cctns/${caseId}?officer_name=${encodeURIComponent(officerName)}&officer_badge=${encodeURIComponent(officerBadge)}`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("CCTNS Sync failed");
    return res.json();
  },

  async syncEvidenceToEsakshya(seizureId, hashValue = null, officerName = "Inspector R. K. Jadeja", officerBadge = "GJ-AHM-4421") {
    let url = `${API_BASE}/sync/esakshya/${seizureId}?officer_name=${encodeURIComponent(officerName)}&officer_badge=${encodeURIComponent(officerBadge)}`;
    if (hashValue) url += `&hash_value=${encodeURIComponent(hashValue)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("e-Sakshya Sync failed");
    return res.json();
  },

  async getCaseSyncStatus(caseId) {
    const res = await fetch(`${API_BASE}/sync/${caseId}/status`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch sync status");
    return res.json();
  },

  // WhatsApp LERS & BharatPol (New Sprint Capabilities)
  async getWhatsappLers(caseId, language = "en") {
    const res = await fetch(`${API_BASE}/io/whatsapp-lers/${caseId}?language=${encodeURIComponent(language)}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to generate WhatsApp LERS notice");
    return res.json();
  },

  async pushToBharatpol(caseId) {
    const res = await fetch(`${API_BASE}/io/bharatpol/push/${caseId}`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "BharatPol Push failed");
    }
    return res.json();
  },

  async queryBharatpolRecord(accusedName) {
    const res = await fetch(`${API_BASE}/io/bharatpol/record/${encodeURIComponent(accusedName)}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to query BharatPol records");
    return res.json();
  },

  // Search & Audit
  async globalSearch(q) {
    const res = await fetch(`${API_BASE}/search/?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to search");
    return res.json();
  },

  async getAuditLogs(caseId = null) {
    const url = caseId ? `${API_BASE}/search/audit-logs?case_id=${caseId}` : `${API_BASE}/search/audit-logs`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return res.json();
  },

  // Multilingual I/O (ASR, OCR, Translation)
  async scanDocumentOCR(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/io/ocr`, {
      method: "POST",
      headers: getHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Document OCR scan failed");
    }
    return res.json();
  },

  async transcribeAudio(audioFile, language = null) {
    const formData = new FormData();
    formData.append("file", audioFile);
    let url = `${API_BASE}/io/transcribe`;
    if (language) url += `?language=${encodeURIComponent(language)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Audio transcription failed");
    }
    return res.json();
  },

  async translateText(text, sourceLang = "en", targetLang = "hi") {
    const res = await fetch(`${API_BASE}/io/translate`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang })
    });
    if (!res.ok) throw new Error("Translation failed");
    return res.json();
  }
};

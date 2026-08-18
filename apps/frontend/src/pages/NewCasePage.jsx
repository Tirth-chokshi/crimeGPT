import React, { useState } from "react";
import { 
  Sparkles, CheckCircle2, UserPlus, PackagePlus, ArrowRight, ArrowLeft, 
  ShieldCheck, AlertCircle, Trash2, Plus, Scale, BookOpen, Mic, FileSearch 
} from "lucide-react";
import { api } from "../api";
import { translations } from "../translations";
import VoiceRecorderModal from "../components/VoiceRecorderModal";
import DocumentScannerModal from "../components/DocumentScannerModal";

export default function NewCasePage({ onCaseCreated, onCancel, currentLang }) {
  const t = translations[currentLang] || translations.en;
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  const handleApplyVoiceTranscript = (text, lang) => {
    setFormData((prev) => ({
      ...prev,
      incident_summary: (prev.incident_summary ? prev.incident_summary + "\n\n" : "") + text,
      original_language: lang || prev.original_language
    }));
  };

  const handleApplyOcrData = (ocrData) => {
    setFormData((prev) => {
      const updatedPersons = [...prev.persons];
      if (ocrData.complainant_name && updatedPersons.length > 0) {
        updatedPersons[0].name = ocrData.complainant_name;
        if (ocrData.complainant_phone) updatedPersons[0].phone = ocrData.complainant_phone;
      }

      return {
        ...prev,
        incident_summary: ocrData.incident_summary || prev.incident_summary,
        incident_date_time: ocrData.incident_date_time || prev.incident_date_time,
        incident_place: ocrData.incident_place || prev.incident_place,
        persons: updatedPersons
      };
    });
  };

  // Case Form State
  const [formData, setFormData] = useState({
    fir_number: `FIR-${Math.floor(1000 + Math.random() * 9000)}/2026`,
    police_station: "Navrangpura Police Station, Ahmedabad",
    district: "Ahmedabad City",
    state: "Gujarat",
    incident_date_time: "17-08-2026 at 20:30 HRS",
    incident_place: "Near CG Road Crossroad, Navrangpura",
    incident_summary: "",
    original_language: currentLang,
    status: "FIR_REGISTERED",
    investigating_officer_name: "Inspector R. K. Jadeja",
    investigating_officer_badge: "GJ-AHM-4421",
    investigating_officer_rank: "Police Inspector (IO)",
    persons: [
      {
        person_type: "VICTIM",
        name: "Shri Rajesh M. Parekh",
        father_or_husband_name: "Maheshbhai Parekh",
        age: 41,
        gender: "Male",
        phone: "+91 98251 22334",
        aadhaar_or_id: "XXXX-XXXX-9901",
        address: "B-202, Surya Tower, Navrangpura, Ahmedabad",
        occupation: "Diamond Merchant",
        role_description: "Complainant / Victim whose bag was snatched.",
        statement: "Returning from office when two suspects on motorbike threatened with knife and snatched briefcase containing cash."
      },
      {
        person_type: "ACCUSED",
        name: "Ramesh alias Kalio Dashrath Solanki",
        father_or_husband_name: "Dashrath Solanki",
        age: 26,
        gender: "Male",
        phone: "+91 97123 77889",
        aadhaar_or_id: "XXXX-XXXX-4412",
        address: "Near Chhota Lal Hospital Chawl, Gomtipur, Ahmedabad",
        occupation: "Daily Wage Labourer",
        role_description: "Accused who threatened victim with sharp knife and snatched briefcase.",
        statement: "Confessed to crime during preliminary interrogation.",
        custody_status: "POLICE_CUSTODY",
        arrest_date_time: "17-08-2026 22:00 HRS",
        physical_features: {
          height: "5 ft 8 in",
          complexion: "Dark",
          build: "Medium",
          identification_marks: "Burn mark on right shoulder, cut mark above left eyebrow"
        }
      }
    ],
    sections: [],
    seizures: [
      {
        item_name: "Cash Rs. 2,50,000/- (Currency Bundles 500x500)",
        category: "CASH",
        description: "Currency notes recovered from accused possession during arrest.",
        quantity_or_value: "Rs. 2,50,000/-",
        seized_from_person_name: "Ramesh Solanki",
        seizure_place: "Gomtipur Chawl, Ahmedabad",
        seizure_date_time: "17-08-2026 23:15 HRS",
        hash_value_or_serial: "SHA256: 7f8a9e...33cd",
        videography_ref_id: "VID-BNSS-105-AHM-098",
        storage_location: "Malkhana Safe Locker #S1"
      }
    ]
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartyChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.persons];
      updated[index][field] = value;
      return { ...prev, persons: updated };
    });
  };

  const addPerson = (type = "WITNESS") => {
    setFormData(prev => ({
      ...prev,
      persons: [
        ...prev.persons,
        {
          person_type: type,
          name: "",
          father_or_husband_name: "",
          age: 30,
          gender: "Male",
          phone: "",
          address: "",
          statement: "",
          custody_status: type === "ACCUSED" ? "POLICE_CUSTODY" : "FREE"
        }
      ]
    }));
  };

  const removePerson = (index) => {
    setFormData(prev => ({
      ...prev,
      persons: prev.persons.filter((_, i) => i !== index)
    }));
  };

  const handleSeizureChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.seizures];
      updated[index][field] = value;
      return { ...prev, seizures: updated };
    });
  };

  const addSeizure = () => {
    setFormData(prev => ({
      ...prev,
      seizures: [
        ...prev.seizures,
        {
          item_name: "",
          category: "OTHER",
          description: "",
          quantity_or_value: "",
          seized_from_person_name: "",
          seizure_place: prev.police_station,
          storage_location: "Malkhana Locker Rack #B4",
          videography_ref_id: `VID-BNSS-105-${Math.floor(100 + Math.random() * 900)}`
        }
      ]
    }));
  };

  const removeSeizure = (index) => {
    setFormData(prev => ({
      ...prev,
      seizures: prev.seizures.filter((_, i) => i !== index)
    }));
  };

  // Run AI Legal Analysis
  const runAiAnalysis = async () => {
    if (!formData.incident_summary.trim()) {
      setErrorMessage("Please enter the incident narrative facts first.");
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage("");
    try {
      const result = await api.analyzeNarrative(formData.incident_summary, currentLang);
      setAiSuggestions(result);

      // Auto populate sections if not already populated
      const newSections = result.bns_sections.map(s => ({
        act: s.act,
        section_number: s.section_number,
        section_title: s.section_title,
        ipc_crpc_equivalent: s.ipc_equivalent,
        is_ai_recommended: true,
        ai_confidence: s.confidence,
        ai_rationale: s.rationale,
        status: "ACCEPTED"
      }));

      setFormData(prev => ({ ...prev, sections: newSections }));
    } catch (err) {
      setErrorMessage("Error running AI analysis: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (sec) => {
    setFormData(prev => {
      const exists = prev.sections.some(s => s.section_number === sec.section_number);
      if (exists) {
        return {
          ...prev,
          sections: prev.sections.filter(s => s.section_number !== sec.section_number)
        };
      } else {
        return {
          ...prev,
          sections: [
            ...prev.sections,
            {
              act: sec.act,
              section_number: sec.section_number,
              section_title: sec.section_title,
              ipc_crpc_equivalent: sec.ipc_equivalent,
              is_ai_recommended: true,
              ai_confidence: sec.confidence,
              ai_rationale: sec.rationale,
              status: "ACCEPTED"
            }
          ]
        };
      }
    });
  };

  // Submit Case
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const created = await api.createCase(formData);
      onCaseCreated(created.id);
    } catch (err) {
      setErrorMessage(err.message || "Failed to register case");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-wrap" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0 }}>{t.caseForm.title}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "2px 0 0 0" }}>
            Single-entry case creation under BNSS/BNS. Information entered here auto-populates all 7 legal documents.
          </p>
        </div>
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
      </div>

      {errorMessage && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "12px 16px", borderRadius: "8px", color: "#f87171", marginBottom: "16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5-Step Stepper Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", background: "var(--bg-card)", padding: "6px", borderRadius: "10px", border: "1px solid var(--border-subtle)", overflowX: "auto", gap: "6px" }}>
        {[
          { num: 1, label: t.caseForm.step1 },
          { num: 2, label: t.caseForm.step2 },
          { num: 3, label: t.caseForm.step3 },
          { num: 4, label: t.caseForm.step4 },
          { num: 5, label: t.caseForm.step5 }
        ].map((s) => (

          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            style={{
              flex: "1 0 auto",
              padding: "8px 12px",
              background: step === s.num ? "var(--police-blue)" : "transparent",
              color: step === s.num ? "#050b14" : step > s.num ? "#38bdf8" : "var(--text-muted)",
              border: "none",
              borderRadius: "6px",
              fontWeight: step === s.num ? "700" : "600",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap"
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: FIR & Station Details */}
      {step === 1 && (
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "16px", color: "#38bdf8" }}>
            FIR Identification & Police Jurisdiction
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
            <div>
              <label className="form-label">{t.caseForm.firNumber} *</label>
              <input
                type="text"
                className="form-control"
                value={formData.fir_number}
                onChange={(e) => handleInputChange("fir_number", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">{t.caseForm.policeStation} *</label>
              <input
                type="text"
                className="form-control"
                value={formData.police_station}
                onChange={(e) => handleInputChange("police_station", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">{t.caseForm.district} *</label>
              <input
                type="text"
                className="form-control"
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">{t.caseForm.state}</label>
              <input
                type="text"
                className="form-control"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">{t.caseForm.incidentDateTime}</label>
              <input
                type="text"
                className="form-control"
                value={formData.incident_date_time}
                onChange={(e) => handleInputChange("incident_date_time", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">{t.caseForm.incidentPlace}</label>
              <input
                type="text"
                className="form-control"
                value={formData.incident_place}
                onChange={(e) => handleInputChange("incident_place", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">{t.caseForm.officerName}</label>
              <input
                type="text"
                className="form-control"
                value={formData.investigating_officer_name}
                onChange={(e) => handleInputChange("investigating_officer_name", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">{t.caseForm.officerBadge}</label>
              <input
                type="text"
                className="form-control"
                value={formData.investigating_officer_badge}
                onChange={(e) => handleInputChange("investigating_officer_badge", e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "28px" }}>
            <button onClick={() => setStep(2)} className="btn btn-primary">
              {t.caseForm.next}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Involved Parties */}
      {step === 2 && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#38bdf8" }}>
                Involved Parties (Victims, Accused, Witnesses)
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                Single-entry profile. Physical marks and custody status feed directly to Remand, Panchanama, and TIP forms.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => addPerson("VICTIM")} className="btn btn-secondary" style={{ fontSize: "12px" }}>
                + Complainant
              </button>
              <button onClick={() => addPerson("ACCUSED")} className="btn btn-secondary" style={{ fontSize: "12px" }}>
                + Accused
              </button>
              <button onClick={() => addPerson("WITNESS")} className="btn btn-secondary" style={{ fontSize: "12px" }}>
                + Witness
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {formData.persons.map((p, idx) => (
              <div key={idx} style={{ background: "rgba(19, 29, 51, 0.7)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <select
                      value={p.person_type}
                      onChange={(e) => handlePartyChange(idx, "person_type", e.target.value)}
                      className="form-control"
                      style={{ width: "auto", padding: "4px 10px", fontSize: "12px", fontWeight: "700" }}
                    >
                      <option value="VICTIM">👤 COMPLAINANT / VICTIM</option>
                      <option value="ACCUSED">🚨 ACCUSED / SUSPECT</option>
                      <option value="WITNESS">👁️ EYE WITNESS</option>
                    </select>
                    <span style={{ fontSize: "13px", fontWeight: "700" }}>#{idx + 1}: {p.name || "Untitled"}</span>
                  </div>

                  {formData.persons.length > 1 && (
                    <button onClick={() => removePerson(idx)} className="btn btn-secondary" style={{ padding: "4px 8px", color: "#f87171" }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div>
                    <label className="form-label">{t.caseForm.fullName}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={p.name}
                      onChange={(e) => handlePartyChange(idx, "name", e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                    />
                  </div>

                  <div>
                    <label className="form-label">{t.caseForm.fatherName}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={p.father_or_husband_name || ""}
                      onChange={(e) => handlePartyChange(idx, "father_or_husband_name", e.target.value)}
                      placeholder="e.g. Dashrathbhai"
                    />
                  </div>

                  <div>
                    <label className="form-label">{t.caseForm.age} & {t.caseForm.gender}</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: "80px" }}
                        value={p.age || ""}
                        onChange={(e) => handlePartyChange(idx, "age", parseInt(e.target.value) || 0)}
                      />
                      <select
                        value={p.gender || "Male"}
                        onChange={(e) => handlePartyChange(idx, "gender", e.target.value)}
                        className="form-control"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">{t.caseForm.phone}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={p.phone || ""}
                      onChange={(e) => handlePartyChange(idx, "phone", e.target.value)}
                    />
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label className="form-label">{t.caseForm.address}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={p.address || ""}
                      onChange={(e) => handlePartyChange(idx, "address", e.target.value)}
                    />
                  </div>

                  {p.person_type === "ACCUSED" && (
                    <>
                      <div>
                        <label className="form-label">{t.caseForm.custodyStatus}</label>
                        <select
                          value={p.custody_status || "FREE"}
                          onChange={(e) => handlePartyChange(idx, "custody_status", e.target.value)}
                          className="form-control"
                        >
                          <option value="POLICE_CUSTODY">Police Custody (Remand)</option>
                          <option value="JUDICIAL_CUSTODY">Judicial Custody (Jail)</option>
                          <option value="NOTICE_SERVED">Notice Served (Sec 35 BNSS)</option>
                          <option value="FREE">Free / Absconding</option>
                          <option value="ON_BAIL">On Bail</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">{t.caseForm.arrestDateTime}</label>
                        <input
                          type="text"
                          className="form-control"
                          value={p.arrest_date_time || ""}
                          onChange={(e) => handlePartyChange(idx, "arrest_date_time", e.target.value)}
                          placeholder="e.g. 17-08-2026 22:00 HRS"
                        />
                      </div>
                    </>
                  )}

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">{t.caseForm.statement}</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: "60px" }}
                      value={p.statement || ""}
                      onChange={(e) => handlePartyChange(idx, "statement", e.target.value)}
                      placeholder="Brief statement or role description..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              {t.caseForm.prev}
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary">
              {t.caseForm.next}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Incident Narrative & AI Legal Assistant */}
      {step === 3 && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#38bdf8" }}>
              Incident Narrative & AI Legal Intelligence
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
              Enter narrative in English, Hindi, or Gujarati. CrimeGPT Legal Engine will map BNS sections, IPC equivalents, and Supreme Court precedents.
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ margin: 0 }}>{t.caseForm.incidentNarrativeLabel} *</label>
              
              {/* Multimodal Input Toolbar */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: "12px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px", color: "var(--police-gold)", borderColor: "rgba(245, 158, 11, 0.4)" }}
                >
                  <Mic size={14} /> 🎙️ Record Voice Statement
                </button>
                <button
                  type="button"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: "12px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}
                >
                  <FileSearch size={14} /> 📄 Scan Paper Complaint (OCR)
                </button>
              </div>
            </div>

            <textarea
              className="form-control"
              style={{ minHeight: "150px", fontSize: "14px" }}
              value={formData.incident_summary}
              onChange={(e) => handleInputChange("incident_summary", e.target.value)}
              placeholder={t.caseForm.narrativePlaceholder}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
              {/* Preset Sample Narratives */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>Presets:</span>
                <button
                  type="button"
                  onClick={() => handleInputChange("incident_summary", "Accused along with 2 accomplices stopped complainant on motorcycle at knife point, threatened to kill, and forcibly snatched gold chain worth Rs 1.5 Lakhs and cash.")}
                  className="btn btn-secondary"
                  style={{ fontSize: "11.5px", padding: "4px 8px" }}
                >
                  🔪 Armed Snatching (BNS 309/304)
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("incident_summary", "Cyber fraudsters created fake trading group on Telegram, forged SEBI certificates, and induced complainant to transfer Rs 12,00,000 into mule bank accounts.")}
                  className="btn btn-secondary"
                  style={{ fontSize: "11.5px", padding: "4px 8px" }}
                >
                  💻 Cyber Fraud (BNS 318/336)
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("incident_summary", "આરોપીઓએ ફરિયાદીની દુકાનમાં ઘૂસી લાકડી અને પાઈપ વડે હુમલો કરી ગંભીર ઈજાઓ પહોંચાડી અને જાનથી મારી નાખવાની ધમકી આપી.")}
                  className="btn btn-secondary"
                  style={{ fontSize: "11.5px", padding: "4px 8px" }}
                >
                  🇬🇯 Gujarati Assault
                </button>
              </div>

              <button
                type="button"
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="btn btn-cyan"
              >
                <Sparkles size={16} />
                {isAnalyzing ? t.caseForm.analyzing : t.caseForm.analyzeBtn}
              </button>
            </div>
          </div>

          {/* AI Suggestions Results Panel */}
          {aiSuggestions && (
            <div style={{ background: "rgba(10, 20, 40, 0.85)", border: "1px solid var(--border-gold)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} color="var(--police-gold)" />
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "#fbbf24" }}>
                    CrimeGPT Legal Recommendations
                  </span>
                  <span className="badge badge-gold">Language: {aiSuggestions.detected_language.toUpperCase()}</span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Click chips to toggle sections
                </span>
              </div>

              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.4" }}>
                {aiSuggestions.summary_analysis}
              </div>

              {/* Recommended Sections Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                {aiSuggestions.bns_sections.map((sec, idx) => {
                  const isSelected = formData.sections.some(s => s.section_number === sec.section_number);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSection(sec)}
                      style={{
                        background: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(15, 23, 42, 0.6)",
                        border: isSelected ? "1px solid var(--police-blue)" : "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        padding: "12px",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontWeight: "800", color: "#38bdf8", fontSize: "14px" }}>
                          {sec.act} Sec {sec.section_number}
                        </span>
                        <span className="badge badge-blue">{(sec.confidence * 100).toFixed(0)}% MATCH</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{sec.section_title}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--police-gold)", marginBottom: "6px" }}>
                        Legacy: {sec.ipc_equivalent}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: "1.3" }}>
                        {sec.rationale}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Landmark Judgments & BNSS Protocols */}
              {aiSuggestions.landmark_judgments && aiSuggestions.landmark_judgments.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#fbbf24", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Scale size={15} /> Applicable Landmark Supreme Court Judgments:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {aiSuggestions.landmark_judgments.map((j, i) => (
                      <div key={i} style={{ fontSize: "12px", color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.03)", padding: "6px 10px", borderRadius: "6px" }}>
                        <span style={{ fontWeight: "700", color: "#f8fafc" }}>{j.case_name} ({j.citation}): </span>
                        <span>{j.principle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              {t.caseForm.prev}
            </button>
            <button onClick={() => setStep(4)} className="btn btn-primary">
              {t.caseForm.next}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Seizures & Mudamal */}
      {step === 4 && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#38bdf8" }}>
                Seizures & Mudamal Inventory (Section 105 BNSS)
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                Log physical and electronic evidence. Auto-generates Seizure Panchanama and BSA Section 63 hash certificate.
              </p>
            </div>
            <button onClick={addSeizure} className="btn btn-secondary" style={{ fontSize: "12px" }}>
              + Add Seized Article
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {formData.seizures.map((sz, idx) => (
              <div key={idx} style={{ background: "rgba(19, 29, 51, 0.7)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--police-gold)" }}>
                    Mudamal Article #{idx + 1}: {sz.item_name || "New Item"}
                  </span>
                  {formData.seizures.length > 0 && (
                    <button onClick={() => removeSeizure(idx)} className="btn btn-secondary" style={{ padding: "4px 8px", color: "#f87171" }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div>
                    <label className="form-label">{t.caseForm.itemName} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sz.item_name}
                      onChange={(e) => handleSeizureChange(idx, "item_name", e.target.value)}
                      placeholder="e.g. Rampuri Knife / Samsung Galaxy Phone"
                    />
                  </div>

                  <div>
                    <label className="form-label">{t.caseForm.itemCategory}</label>
                    <select
                      value={sz.category}
                      onChange={(e) => handleSeizureChange(idx, "category", e.target.value)}
                      className="form-control"
                    >
                      <option value="WEAPON">Weapon of Offence</option>
                      <option value="CASH">Cash & Currency</option>
                      <option value="ELECTRONIC_DEVICE">Electronic / Smartphone (Sec 63 BSA)</option>
                      <option value="VEHICLE">Vehicle</option>
                      <option value="DOCUMENT">Forged Document</option>
                      <option value="OTHER">Other Valuable</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">{t.caseForm.itemQtyVal}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sz.quantity_or_value || ""}
                      onChange={(e) => handleSeizureChange(idx, "quantity_or_value", e.target.value)}
                      placeholder="e.g. 1 unit / Rs. 50,000"
                    />
                  </div>

                  <div>
                    <label className="form-label">{t.caseForm.seizedFrom}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sz.seized_from_person_name || ""}
                      onChange={(e) => handleSeizureChange(idx, "seized_from_person_name", e.target.value)}
                      placeholder="e.g. Accused Ramesh Solanki"
                    />
                  </div>

                  <div>
                    <label className="form-label">{t.caseForm.storageRack}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sz.storage_location || ""}
                      onChange={(e) => handleSeizureChange(idx, "storage_location", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">{t.caseForm.videographyRef}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sz.videography_ref_id || ""}
                      onChange={(e) => handleSeizureChange(idx, "videography_ref_id", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
            <button onClick={() => setStep(3)} className="btn btn-secondary">
              {t.caseForm.prev}
            </button>
            <button onClick={() => setStep(5)} className="btn btn-primary">
              {t.caseForm.next}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Submit */}
      {step === 5 && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "18px", color: "#38bdf8" }}>
            Review Unified Case Data Pool & Submit FIR
          </h2>

          <div style={{ background: "rgba(10, 15, 29, 0.7)", borderRadius: "10px", padding: "20px", marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13.5px" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>FIR Number:</span> <strong>{formData.fir_number}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Police Station:</span> <strong>{formData.police_station}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Investigating Officer:</span> <strong>{formData.investigating_officer_name}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Parties Enrolled:</span> <strong>{formData.persons.length} Persons ({formData.persons.filter(p => p.person_type === 'ACCUSED').length} Accused)</strong>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "var(--text-muted)" }}>Applied BNS Sections:</span>{" "}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                {formData.sections.map((s, i) => (
                  <span key={i} className="badge badge-gold">
                    {s.act} Sec {s.section_number} - {s.section_title}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "var(--text-muted)" }}>Seized Mudamal Articles:</span> <strong>{formData.seizures.length} Items</strong>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(4)} className="btn btn-secondary">
              {t.caseForm.prev}
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="btn btn-primary"
              style={{ padding: "12px 28px", fontSize: "14px" }}
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? "Creating Case Pool..." : t.caseForm.submitCase}
            </button>
          </div>
        </div>
      )}

      {/* Voice Statement Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyTranscript={handleApplyVoiceTranscript}
        defaultLang={currentLang}
      />

      {/* Scanned Document OCR Modal */}
      <DocumentScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onApplyExtractedData={handleApplyOcrData}
      />
    </div>
  );
}

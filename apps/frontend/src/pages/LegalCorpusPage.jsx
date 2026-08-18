import React, { useState } from "react";
import { BookOpen, Scale, Search, Shield, Clock, ArrowRightLeft, FileCheck2, Zap, Landmark, ShieldAlert } from "lucide-react";
import { translations } from "../translations";

export default function LegalCorpusPage({ currentLang }) {
  const t = translations[currentLang] || translations.en;
  const [activeTab, setActiveTab] = useState("bns");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const bnsList = [
    { section: "103(1)", title: "Murder", ipc: "Section 302 IPC", chapter: "Offences Against Body", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Death or Life Imprisonment and fine", desc: "Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine." },
    { section: "103(2)", title: "Mob Lynching (Group of 5 or more)", ipc: "Newly introduced under BNS", chapter: "Offences Against Body", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Death or Life Imprisonment", desc: "When 5 or more persons commit murder acting in concert on grounds of race, caste, sex, religion, language, or place of birth." },
    { section: "109(1)", title: "Attempt to Murder", ipc: "Section 307 IPC", chapter: "Offences Against Body", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 10 years / Life and fine", desc: "Whoever does any act with such intention or knowledge that if death was caused thereby, he would be guilty of murder." },
    { section: "111(1)", title: "Organised Crime Syndicate", ipc: "Newly codified under BNS", chapter: "Terrorism & Organised Crime", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Death or Life Imprisonment; Min 5 yrs", desc: "Continuing unlawful activity including extortion, kidnapping, contract killing, financial crimes, or cybercrimes by members of an organized crime syndicate." },
    { section: "113", title: "Terrorist Act", ipc: "Replaces / supplements UAPA in general law", chapter: "Terrorism & Organised Crime", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Death or Life Imprisonment and fine", desc: "Any act committed with intent to threaten unity, integrity, sovereignty, or security of India or strike terror in people." },
    { section: "115(2)", title: "Voluntarily Causing Hurt", ipc: "Section 323 IPC", chapter: "Offences Against Body", cognizable: "Non-Cognizable", bailable: "Bailable", penalty: "Up to 1 year, or fine up to Rs. 10,000", desc: "Whoever voluntarily causes bodily pain, disease or infirmity to any person is said to cause hurt." },
    { section: "118(1)", title: "Voluntarily Causing Hurt by Dangerous Weapons", ipc: "Section 324/326 IPC", chapter: "Offences Against Body", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 3 years or up to 10 years", desc: "Hurt caused by instruments for shooting, stabbing, cutting, or corrosive substances or explosive materials." },
    { section: "126(2)", title: "Wrongful Confinement", ipc: "Section 342 IPC", chapter: "Offences Against Body", cognizable: "Non-Cognizable", bailable: "Bailable", penalty: "Up to 1 year or fine up to Rs 5,000", desc: "Whoever wrongfully restrains any person to prevent proceeding beyond circumscribing limits." },
    { section: "137(2)", title: "Abduction with Intent to Murder", ipc: "Section 364 IPC", chapter: "Offences Against Body", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Life imprisonment or up to 10 years", desc: "Kidnapping or abducting any person in order that such person may be murdered." },
    { section: "140(1)", title: "Kidnapping for Ransom", ipc: "Section 364A IPC", chapter: "Offences Against Body", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Death or Life Imprisonment", desc: "Kidnapping with threat to cause death/hurt to compel Government or person to pay ransom." },
    { section: "143(1)", title: "Trafficking of Person", ipc: "Section 370 IPC", chapter: "Women & Children Protection", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "7 years up to life and fine", desc: "Recruiting, transporting, harbouring persons for exploitation through threats, coercion, fraud or abuse of power." },
    { section: "152", title: "Act Endangering Sovereignty & Integrity of India", ipc: "Replaces Section 124A (Sedition)", chapter: "Offences Against State", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Life imprisonment or up to 7 years", desc: "Exciting secession, armed rebellion, or subversive activities endangering national sovereignty." },
    { section: "190", title: "Rioting", ipc: "Section 146 IPC", chapter: "Public Tranquility", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 2 years or fine or both", desc: "Force or violence used by unlawful assembly in prosecution of common object." },
    { section: "196(1)", title: "Promoting Enmity Between Groups (Hate Speech)", ipc: "Section 153A IPC", chapter: "Public Tranquility", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 3 years or fine or both", desc: "Promoting disharmony, hatred or enmity on grounds of religion, race, language or caste." },
    { section: "215(1)", title: "Giving Gratification to Public Servant (Bribery)", ipc: "Section 161 IPC / PC Act", chapter: "Public Justice", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 7 years and fine", desc: "Giving or offering gratification to induce public servant by corrupt means." },
    { section: "303(2)", title: "Theft", ipc: "Section 379 IPC", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 3 years or fine; Community service < Rs 5,000", desc: "Dishonestly taking any movable property out of the possession of any person without consent." },
    { section: "304(1)", title: "Snatching", ipc: "Newly codified under BNS", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 3 years and fine", desc: "Theft is snatching if the offender suddenly, quickly, or forcibly grabs, seizes, or takes away movable property." },
    { section: "308(1)", title: "Dacoity", ipc: "Section 391 IPC", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Life imprisonment or up to 10 years", desc: "Conjoint robbery committed by five or more persons." },
    { section: "309(4)", title: "Robbery", ipc: "Section 392 IPC", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Rigorous imprisonment up to 10 years and fine", desc: "Theft or extortion accompanied by causing or attempting to cause death, hurt, or wrongful restraint." },
    { section: "310(2)", title: "Dacoity with Murder", ipc: "Section 396 IPC", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Death or Life Imprisonment and fine", desc: "If any one of five or more persons committing dacoity commits murder, every person is punishable." },
    { section: "318(4)", title: "Cheating & Inducing Delivery of Property", ipc: "Section 420 IPC", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 7 years and fine", desc: "Deceiving any person and fraudulently inducing delivery of property or alteration of valuable security." },
    { section: "329(3)", title: "Extortion by Fear of Death or Grievous Hurt", ipc: "Section 387 IPC", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 10 years and fine", desc: "Extortion committed by putting any person in fear of death or grievous hurt." },
    { section: "333", title: "Forgery of Valuable Security or Will", ipc: "Section 467 IPC", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Life imprisonment or up to 10 years", desc: "Forging valuable securities, wills, or documents transferring property." },
    { section: "338", title: "Making or Possessing Counterfeit Documents", ipc: "Section 474 IPC", chapter: "Property Offences", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 7 years and fine", desc: "Possessing forged documents knowing them to be forged with intent to use as genuine." },
    { section: "64(1)", title: "Rape", ipc: "Section 376 IPC", chapter: "Women & Children Protection", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Rigorous imprisonment 10 years up to life", desc: "Sexual assault against a woman without consent or against her will." },
    { section: "70(1)", title: "Gang Rape", ipc: "Section 376D IPC", chapter: "Women & Children Protection", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Rigorous imprisonment min 20 yrs up to life", desc: "Rape committed by one or more persons acting in furtherance of a common intention." },
    { section: "78", title: "Stalking & Cyber-Stalking", ipc: "Section 354D IPC", chapter: "Women & Children Protection", cognizable: "Cognizable", bailable: "Non-Bailable (subsequent)", penalty: "Up to 3 years; subsequent up to 5 years", desc: "Following a woman repeatedly or monitoring electronic communications and social media." },
    { section: "85", title: "Cruelty by Husband or Relatives (498A)", ipc: "Section 498A IPC", chapter: "Women & Children Protection", cognizable: "Cognizable", bailable: "Non-Bailable", penalty: "Up to 3 years and fine", desc: "Subjecting a woman to cruelty or harassment to coerce unlawful property demands." }
  ];

  const bnssList = [
    { section: "35", title: "Arrest without Warrant & Notice of Appearance", crpc: "Section 41 & 41A CrPC", timeline: "Notice within 14 days", rule: "Arrest for offences <= 7 years requires prior notice unless recorded reasons are logged in Case Diary (Arnesh Kumar rule)." },
    { section: "53", title: "Mandatory Medico-Legal Examination of Accused", crpc: "Section 53 CrPC", timeline: "Within 24 hours of arrest", rule: "Mandatory medical examination of arrested person by Registered Medical Practitioner before magistrate production." },
    { section: "105", title: "Mandatory Audio-Video Recording of Search & Seizure", crpc: "Section 100/102 CrPC modified", timeline: "Forward video within 48h", rule: "All search of places and seizures of property must be recorded by audio-video electronic means including mobile/bodycam." },
    { section: "173", title: "FIR Registration & Preliminary Enquiry", crpc: "Section 154 CrPC", timeline: "PE max 14 days; e-FIR in 3 days", rule: "Allows Zero-FIR and e-FIR nationwide with DSP prior approval for preliminary enquiry in specified offences." },
    { section: "187", title: "Remand Procedure & Detention Beyond 24 Hours", crpc: "Section 167 CrPC", timeline: "15 days police remand; 60/90 days default bail", rule: "Magistrate may authorize police custody for up to 15 days in whole or in parts during the initial 40 or 60 days of total detention." },
    { section: "193", title: "Police Report on Completion of Investigation (Chargesheet)", crpc: "Section 173 CrPC", timeline: "60 or 90 days limit", rule: "Submission of final police report / Purvani chargesheet. Mandatory 2 months limit for sexual offences against women." }
  ];

  const bsaList = [
    { section: "61", title: "Admissibility of Electronic Records", iea: "Section 65A Evidence Act", rule: "Digital records, server logs, mobile extractions, and cloud dumps have equal legal effect as physical paper documents." },
    { section: "63", title: "Certificate for Electronic Evidence (Replaces 65B)", iea: "Section 65B Evidence Act", rule: "Mandatory Part A (Officer) and Part B (System Manager) certificate with cryptographic SHA-256 hash for digital media." },
    { section: "23", title: "Information Received from Accused in Custody (Recovery Memo)", iea: "Section 27 Evidence Act", rule: "So much of information distinctly leading to discovery of a physical fact is admissible in evidence." }
  ];

  const judgmentsList = [
    { name: "Arnesh Kumar v. State of Bihar", citation: "(2014) 8 SCC 273", subject: "Arrest Safeguards (< 7 Years)", principle: "Notice of appearance under Section 35 BNSS is mandatory before arrest for offences with sentence <= 7 years." },
    { name: "D.K. Basu v. State of West Bengal", citation: "(1997) 1 SCC 416", subject: "Custodial Rights & Arrest Memo", principle: "Mandatory memo of arrest, right to inform family within 8 hours, and medical checkup every 48 hours." },
    { name: "Shafhi Mohammad v. State of HP", citation: "(2018) 2 SCC 801", subject: "Crime Scene Videography", principle: "Directed videography of crime scene investigations — codified under Section 105 BNSS." },
    { name: "Joginder Kumar v. State of UP", citation: "(1994) 4 SCC 260", subject: "Right to Counsel & Family Intimation", principle: "Existence of power to arrest is different from justification for arrest. Right to counsel on arrest." },
    { name: "Rajesh Sharma v. State of UP", citation: "(2017) 10 SCC 472", subject: "Safeguards in 498A (BNS Sec 85)", principle: "Preliminary scrutiny before arrest in marital cruelty cases to prevent automatic detention." },
    { name: "Zahira Habibullah v. State of Gujarat", citation: "(2004) 4 SCC 158", subject: "Fair Investigation in Communal Riots", principle: "Right to fair trial encompasses fair investigation. IO cannot selectively record witness accounts." },
    { name: "PUCL v. Union of India", citation: "(1997) 3 SCC 433", subject: "Electronic Surveillance & Privacy", principle: "Wiretapping requires strict Home Secretary procedural safeguards under BSA electronic evidence rules." },
    { name: "Ritesh Sinha v. State of UP", citation: "(2019) 8 SCC 1", subject: "Voice Samples of Accused", principle: "Magistrate can order voice samples without violating Article 20(3) self-incrimination rights." },
    { name: "State of Bombay v. Kathi Kalu Oghad", citation: "AIR 1961 SC 1808", subject: "Biometrics & Fingerprints", principle: "Compelling fingerprints, handwriting, or blood specimens is physical evidence, not self-incrimination." }
  ];

  const filteredBns = bnsList.filter(s => {
    const matchSearch = s.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ipc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === "ALL" || s.chapter === categoryFilter;
    return matchSearch && matchCat;
  });

  const filteredBnss = bnssList.filter(s =>
    s.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.crpc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBsa = bsaList.filter(s =>
    s.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.iea.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJudgments = judgmentsList.filter(j =>
    j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.citation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.principle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ["ALL", "Terrorism & Organised Crime", "Women & Children Protection", "Property Offences", "Offences Against Body", "Public Tranquility", "Offences Against State", "Public Justice"];

  return (
    <div className="content-wrap" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <BookOpen size={17} color="var(--police-blue)" />
            </div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.4px", color: "#ffffff", margin: 0 }}>
                Bharatiya Criminal Law Codex (BNS, BNSS, BSA 2023)
              </h1>
            </div>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "2px 0 0 0" }}>
            Bare acts statutory repository with live IPC/CrPC crosswalk concordance &amp; Supreme Court precedents.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: "240px", flex: "1 1 260px", maxWidth: "380px" }}>
          <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search section, offence, or IPC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: "36px", fontSize: "12px", background: "#0a0f1d" }}
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", overflowX: "auto" }}>
        {[
          { id: "bns", label: `BNS 2023 (${bnsList.length} Sections)` },
          { id: "bnss", label: `BNSS 2023 (${bnssList.length} Sections)` },
          { id: "bsa", label: `BSA 2023 (${bsaList.length} Rules)` },
          { id: "judgments", label: `Landmark Precedents (${judgmentsList.length} Cases)` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "6px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category Filter Chips for BNS */}
      {activeTab === "bns" && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                background: categoryFilter === cat ? "rgba(56, 189, 248, 0.2)" : "#141b2e",
                color: categoryFilter === cat ? "var(--police-blue)" : "var(--text-secondary)",
                border: categoryFilter === cat ? "1px solid var(--police-blue)" : "1px solid var(--border-subtle)",
                borderRadius: "20px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content Grid */}
      {activeTab === "bns" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "12px" }}>
          {filteredBns.map((s, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: "14px", background: "rgba(14, 18, 28, 0.85)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                  BNS Sec {s.section}
                </span>
                <span className="badge badge-subtle" style={{ fontSize: "8.5px" }}>{s.chapter}</span>
              </div>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#f8fafc" }}>{s.title}</div>
              <div style={{ fontSize: "11px", color: "var(--police-gold)" }}>
                Concordance: <strong>{s.ipc}</strong>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>{s.desc}</p>
              <div style={{ marginTop: "auto", paddingTop: "6px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                <span className="badge badge-purple" style={{ fontSize: "8.5px" }}>{s.cognizable}</span>
                <span className="badge badge-blue" style={{ fontSize: "8.5px" }}>{s.bailable}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "bnss" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "12px" }}>
          {filteredBnss.map((s, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: "14px", background: "rgba(14, 18, 28, 0.85)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#fbbf24", fontFamily: "var(--font-mono)" }}>
                  BNSS Sec {s.section}
                </span>
                <span className="badge badge-gold" style={{ fontSize: "8.5px" }}>{s.timeline}</span>
              </div>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#f8fafc" }}>{s.title}</div>
              <div style={{ fontSize: "11px", color: "var(--police-blue)" }}>
                Replaces: <strong>{s.crpc}</strong>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>{s.rule}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "bsa" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "12px" }}>
          {filteredBsa.map((s, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: "14px", background: "rgba(14, 18, 28, 0.85)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                  BSA Sec {s.section}
                </span>
                <span className="badge badge-green" style={{ fontSize: "8.5px" }}>EVIDENTIARY</span>
              </div>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#f8fafc" }}>{s.title}</div>
              <div style={{ fontSize: "11px", color: "var(--police-gold)" }}>
                Replaces: <strong>{s.iea}</strong>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>{s.rule}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "judgments" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "12px" }}>
          {filteredJudgments.map((j, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: "14px", background: "rgba(14, 18, 28, 0.85)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#f8fafc" }}>
                  {j.name}
                </span>
                <span className="badge badge-blue" style={{ fontSize: "8.5px" }}>{j.citation}</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--police-blue)", fontWeight: "600" }}>{j.subject}</div>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                <b>Statutory Principle:</b> {j.principle}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

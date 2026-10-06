import React, { useState } from "react";
import { Search, FileText, BookOpen, Scale, ShieldAlert } from "lucide-react";
import { api } from "../api";
import { translations } from "../translations";

export default function SearchPage({ onSelectCase, currentLang }) {
  const t = translations[currentLang] || translations.en;
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || query.length < 2) return;
    setIsSearching(true);
    try {
      const res = await api.globalSearch(query);
      setResults(res);
    } catch (err) {
      alert("Search failed: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>

        <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "6px" }}>Global Crime & Legal Search</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Full-text indexing across registered FIR cases, BNS bare acts, procedural BNSS rules, and landmark judgments.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: "42px", height: "46px", fontSize: "15px" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords (e.g. robbery, Arnesh Kumar, 309(4), knife, Navrangpura, Sec 105)..."
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: "0 24px", height: "46px" }}>
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Found {results.results_count} total results for "<strong>{results.query}</strong>"
          </div>

          {/* Cases Results */}
          {results.cases.length > 0 && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--police-blue)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={16} /> Matching Case Files ({results.cases.length})
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
                {results.cases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase(c.id)}
                    className="glass-panel"
                    style={{ padding: "16px", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "800", color: "var(--police-blue)", fontFamily: "var(--font-mono)" }}>{c.fir_number}</span>
                      <span className="badge badge-gold" style={{ fontSize: "9.5px" }}>{c.status}</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      {c.summary_snippet}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {c.police_station} • {c.fir_date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BNS Statutes Results */}
          {results.bns_statutes.length > 0 && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--police-gold)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <BookOpen size={16} /> BNS Statutes Matching Query ({results.bns_statutes.length})
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
                {results.bns_statutes.map((s, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "800", color: "var(--bordo)" }}>BNS Sec {s.section}</span>
                      <span className="badge badge-gold" style={{ fontSize: "9.5px" }}>{s.ipc_equivalent}</span>
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: "700", marginBottom: "4px", color: "var(--text-heading)" }}>{s.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{s.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Landmark Judgments Results */}
          {results.landmark_precedents.length > 0 && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--police-green)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Scale size={16} /> Supreme Court Precedents ({results.landmark_precedents.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {results.landmark_precedents.map((j, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "700", color: "var(--text-heading)" }}>{j.case_name}</span>
                      <span className="badge badge-blue" style={{ fontSize: "10px" }}>{j.citation}</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                      {j.principle}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

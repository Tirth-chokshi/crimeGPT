import React, { useState, useEffect } from "react";
import {
  Shield, Globe, UserCheck, Clock, Menu, X, PanelLeftClose,
  PanelLeftOpen, Sparkles, Scale, Radio, KeyRound
} from "lucide-react";
import { translations } from "../translations";
import { api } from "../api";

export default function Navbar({
  currentLang,
  setLang,
  currentRole,
  setRole,
  policeStation,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen
}) {
  const [timeStr, setTimeStr] = useState("");
  const [authStatus, setAuthStatus] = useState("CONNECTED");
  const t = translations[currentLang] || translations.en;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) + " IST");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync role authentication on mount and when role changes
  useEffect(() => {
    const syncAuth = async () => {
      try {
        await api.login(currentRole);
        setAuthStatus("AUTHENTICATED");
      } catch (err) {
        console.warn("Auth token sync warning:", err);
      }
    };
    syncAuth();
  }, [currentRole]);

  const handleRoleChange = async (newRole) => {
    setRole(newRole);
    try {
      await api.login(newRole);
      setAuthStatus("AUTHENTICATED");
    } catch (err) {
      console.warn("Role switch failed:", err);
    }
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case "SHO":
        return { label: "SHO Oversight", color: "#fbbf24", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" };
      case "LEGAL_ADVISOR":
        return { label: "Prosecutor Scrutiny", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)" };
      default:
        return { label: "IO Field Ops", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)" };
    }
  };

  const roleMeta = getRoleBadge();

  return (
    <header
      className="navbar-container"
      style={{
        height: "var(--navbar-height)",
        background: "rgba(10, 15, 28, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Left: Hamburger / Collapse + Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="btn btn-secondary btn-icon"
          style={{ display: "none" }}
          id="mobile-nav-toggle"
          title="Toggle Navigation Menu"
        >
          {isMobileSidebarOpen ? <X size={17} /> : <Menu size={17} />}
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="btn btn-secondary btn-icon"
          title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          style={{
            background: "#141b2e",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            width: "30px",
            height: "30px",
            borderRadius: "6px"
          }}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={15} color="var(--police-blue)" /> : <PanelLeftClose size={15} />}
        </button>

        {/* Brand Emblem */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "7px",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px rgba(37, 99, 235, 0.4)",
              flexShrink: 0
            }}
          >
            <Shield size={17} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "15.5px",
                  fontWeight: "800",
                  letterSpacing: "-0.3px",
                  color: "#f8fafc"
                }}
              >
                {t.appName}
              </span>
              <span className="badge badge-blue" style={{ fontSize: "8.5px", padding: "1px 5px" }} id="statutory-badge">
                BNSS 2023
              </span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {policeStation || "Navrangpura PS, Ahmedabad"}
              </span>
              <span>•</span>
              <span style={{ color: "var(--police-blue)", fontWeight: "600" }}>GJ Police</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Live Engine Status & Clock (Desktop) */}
      <div className="navbar-center-pill" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            padding: "3px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            color: "#34d399",
            fontWeight: "600"
          }}
        >
          <span className="pulse-dot" style={{ width: "5px", height: "5px" }}></span>
          <span>BNS Legal Engine Active</span>
        </div>

        {/* Active Role Capability Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: roleMeta.bg,
            border: `1px solid ${roleMeta.border}`,
            padding: "3px 9px",
            borderRadius: "6px",
            fontSize: "10.5px",
            color: roleMeta.color,
            fontWeight: "700"
          }}
          title="RBAC Active Session"
        >
          <KeyRound size={11} color={roleMeta.color} />
          <span>{roleMeta.label}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "#141b2e",
            border: "1px solid var(--border-subtle)",
            padding: "3px 9px",
            borderRadius: "6px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-secondary)"
          }}
        >
          <Clock size={11} color="#38bdf8" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Right Controls: Role & Language */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Role Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <select
            value={currentRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="form-control"
            style={{
              width: "auto",
              padding: "4px 8px",
              fontSize: "11.5px",
              background: "#141b2e",
              borderColor: "var(--border-subtle)",
              color: "#f8fafc",
              fontWeight: "600"
            }}
          >
            <option value="IO">👮 {t.roles.io}</option>
            <option value="SHO">⭐ {t.roles.sho}</option>
            <option value="LEGAL_ADVISOR">⚖️ {t.roles.legalAdvisor}</option>
          </select>
        </div>

        {/* Language Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            background: "#141b2e",
            padding: "2px",
            borderRadius: "6px",
            border: "1px solid var(--border-subtle)"
          }}
        >
          <Globe size={11} color="#38bdf8" style={{ marginLeft: "4px", marginRight: "2px" }} />
          {[
            { code: "en", label: "EN" },
            { code: "hi", label: "हिन्दी" },
            { code: "gu", label: "ગુજરાતી" }
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLang(lang.code)}
              style={{
                background: currentLang === lang.code ? "#2563eb" : "transparent",
                color: currentLang === lang.code ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "10.5px",
                fontWeight: currentLang === lang.code ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-nav-toggle {
            display: inline-flex !important;
          }
          .navbar-center-pill {
            display: none !important;
          }
        }
        @media (min-width: 600px) {
          #statutory-badge {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}

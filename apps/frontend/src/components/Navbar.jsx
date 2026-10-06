import React, { useState, useEffect } from "react";
import {
  Shield, Globe, UserCheck, Clock, Menu, X, PanelLeftClose,
  PanelLeftOpen, Scale, Radio, KeyRound, Sun, Moon
} from "lucide-react";
import { translations } from "../translations";
import { api } from "../api";

export default function Navbar({
  currentLang,
  setLang,
  currentRole,
  setRole,
  theme,
  setTheme,
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
        return { label: "SHO Oversight", color: "#E5B061", bg: "rgba(201, 138, 44, 0.15)", border: "#C98A2C" };
      case "LEGAL_ADVISOR":
        return { label: "Prosecutor Scrutiny", color: "#E2AEC0", bg: "rgba(90, 42, 56, 0.25)", border: "#6C151E" };
      default:
        return { label: "IO Field Ops", color: "#F5DABF", bg: "rgba(108, 21, 30, 0.25)", border: "#6C151E" };
    }
  };

  const roleMeta = getRoleBadge();

  return (
    <header
      className="navbar-container"
      style={{
        height: "var(--navbar-height)",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-medium)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        position: "sticky",
        top: 0,
        zIndex: 100
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
          {isMobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="btn btn-secondary btn-icon"
          title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          style={{
            background: "var(--bg-surface-raised)",
            border: "1px solid var(--border-medium)",
            color: "var(--text-secondary)",
            width: "30px",
            height: "30px",
            borderRadius: "6px"
          }}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={14} color="#6C151E" /> : <PanelLeftClose size={14} />}
        </button>

        {/* Brand Emblem */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: "#6C151E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Shield size={17} color="#F5DABF" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  letterSpacing: "-0.2px",
                  color: "var(--text-heading)"
                }}
              >
                {t.appName}
              </span>
              <span className="badge badge-bns" style={{ fontSize: "9px", padding: "1px 5px" }} id="statutory-badge">
                BNS / BNSS
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {policeStation || "Navrangpura PS, Ahmedabad"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Clock (Clean, uncluttered) */}
      <div className="navbar-center-pill" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "var(--bg-surface-raised)",
            border: "1px solid var(--border-medium)",
            padding: "3px 9px",
            borderRadius: "4px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-secondary)"
          }}
        >
          <Clock size={11} color="var(--text-muted)" />
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
              fontSize: "12px",
              background: "var(--bg-surface-raised)",
              borderColor: "var(--border-medium)",
              color: "var(--text-primary)",
              fontWeight: "600"
            }}
          >
            <option value="IO">{t.roles.io}</option>
            <option value="SHO">{t.roles.sho}</option>
            <option value="LEGAL_ADVISOR">{t.roles.legalAdvisor}</option>
          </select>
        </div>

        {/* Language Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            background: "var(--bg-surface-raised)",
            padding: "2px",
            borderRadius: "4px",
            border: "1px solid var(--border-medium)"
          }}
        >
          <Globe size={11} color="var(--text-muted)" style={{ marginLeft: "4px", marginRight: "2px" }} />
          {[
            { code: "en", label: "EN" },
            { code: "hi", label: "हिन्दी" },
            { code: "gu", label: "ગુજરાતી" }
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLang(lang.code)}
              style={{
                background: currentLang === lang.code ? "#6C151E" : "transparent",
                color: currentLang === lang.code ? "#FDF3E7" : "var(--text-secondary)",
                border: "none",
                borderRadius: "3px",
                padding: "2px 6px",
                fontSize: "11px",
                fontWeight: currentLang === lang.code ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Theme Mode Switcher (Dark / Light) */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="btn btn-secondary btn-icon"
          title={theme === "light" ? "Switch to Institutional Dark Mode" : "Switch to Crisp Light Mode"}
          id="theme-mode-toggle"
          style={{
            background: "var(--bg-surface-raised)",
            border: "1px solid var(--border-medium)",
            color: "var(--text-secondary)",
            width: "30px",
            height: "30px",
            borderRadius: "4px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {theme === "light" ? (
            <Moon size={14} color="#6C151E" />
          ) : (
            <Sun size={14} color="#F5DABF" />
          )}
        </button>
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

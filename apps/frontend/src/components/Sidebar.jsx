import React from "react";
import {
  LayoutDashboard, FilePlus2, FolderSearch, BrainCircuit, BookOpen,
  Search, ShieldAlert, ChevronLeft, ChevronRight, Sparkles, Shield
} from "lucide-react";
import { translations } from "../translations";

export default function Sidebar({
  activePage,
  setActivePage,
  currentLang,
  activeCaseCount,
  isCollapsed = false,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen
}) {
  const t = translations[currentLang] || translations.en;

  const navItems = [
    { id: "dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { id: "cases", label: t.nav.cases, icon: FolderSearch, count: activeCaseCount },
    { id: "legal-intel", label: t.nav.legalIntel, icon: BrainCircuit, badge: "AI" },
    { id: "legal-corpus", label: t.nav.legalCorpus, icon: BookOpen },
    { id: "search", label: t.nav.search, icon: Search },
    { id: "audit", label: t.nav.auditLogs, icon: ShieldAlert }
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    if (isMobileOpen && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`mobile-sidebar ${!isMobileOpen ? "closed" : ""}`}
        style={{
          width: isCollapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-expanded-width)",
          minWidth: isCollapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-expanded-width)",
          background: "rgba(10, 15, 28, 0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid var(--border-subtle)",
          padding: isCollapsed ? "14px 6px" : "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          height: "calc(100vh - var(--navbar-height))",
          position: "sticky",
          top: "var(--navbar-height)",
          overflowY: "auto",
          overflowX: "hidden",
          transition: "width 0.24s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.24s cubic-bezier(0.4, 0, 0.2, 1), padding 0.24s ease",
          zIndex: 99
        }}
      >
        {/* Sidebar Section Header / Collapse Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: isCollapsed ? "4px 0 8px" : "0 4px 10px",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "8px"
          }}
        >
          {!isCollapsed ? (
            <div style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.8px", textTransform: "uppercase" }}>
              COMMAND CONSOLE
            </div>
          ) : (
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--police-blue)" }} />
          )}

          {setIsCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="btn btn-secondary btn-icon"
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "5px",
                background: "#141b2e",
                border: "1px solid var(--border-subtle)",
                display: isCollapsed ? "none" : "inline-flex"
              }}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              <ChevronLeft size={13} color="var(--text-secondary)" />
            </button>
          )}
        </div>

        {/* Primary Action Button: New FIR */}
        <div style={{ marginBottom: "10px" }}>
          <button
            onClick={() => handleNavClick("new-case")}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: isCollapsed ? "10px 0" : "9px 12px",
              justifyContent: isCollapsed ? "center" : "flex-start",
              fontSize: "12.5px",
              fontWeight: "700"
            }}
            title={isCollapsed ? t.nav.newCase : undefined}
          >
            <FilePlus2 size={16} />
            {!isCollapsed && <span>{t.nav.newCase}</span>}
          </button>
        </div>

        {/* Nav Items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={isCollapsed ? item.label : undefined}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "space-between",
                padding: isCollapsed ? "10px 0" : "8px 10px",
                borderRadius: "7px",
                background: isActive
                  ? "linear-gradient(90deg, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.05) 100%)"
                  : "transparent",
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                border: isActive
                  ? "1px solid rgba(56, 189, 248, 0.35)"
                  : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
                fontSize: "12.5px",
                fontWeight: isActive ? "700" : "500",
                transition: "all 0.15s ease",
                boxShadow: isActive ? "0 2px 10px rgba(37, 99, 235, 0.2)" : "none"
              }}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: "2px",
                    top: "5px",
                    bottom: "5px",
                    width: "3px",
                    borderRadius: "3px",
                    background: "var(--police-blue)",
                    boxShadow: "0 0 8px var(--police-blue)"
                  }}
                />
              )}

              <div style={{ display: "flex", alignItems: "center", gap: isCollapsed ? "0" : "10px" }}>
                <Icon
                  size={16}
                  color={isActive ? "var(--police-blue)" : "currentColor"}
                />
                {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </div>

              {!isCollapsed && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="badge badge-subtle" style={{ fontSize: "9px", padding: "1px 5px" }}>
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="badge badge-purple" style={{ fontSize: "8px", padding: "1px 4px" }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Compact Notification Dot on Collapsed */}
              {isCollapsed && item.count !== undefined && item.count > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "10px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--police-blue)",
                    boxShadow: "0 0 6px var(--police-blue)"
                  }}
                />
              )}
            </button>
          );
        })}

        {/* Statutory Reference Footer */}
        {!isCollapsed && (
          <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
            <div
              className="glass-panel"
              style={{
                padding: "10px 12px",
                background: "rgba(14, 20, 36, 0.7)",
                border: "1px solid rgba(56, 189, 248, 0.2)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", fontWeight: "700", color: "var(--police-blue)", marginBottom: "3px" }}>
                <Shield size={12} color="var(--police-blue)" /> BNSS 2023 Rules
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", lineHeight: "1.35" }}>
                Auto-enforcing 24h remand (Sec 187), Sec 105 videography & Sec 63 BSA certificates.
              </div>
            </div>
          </div>
        )}


      </aside>
    </>
  );
}


import React from "react";
import {
  LayoutDashboard, FilePlus2, FolderSearch, Scale, BookOpen,
  Search, ShieldAlert, ChevronLeft, Shield
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
    { id: "legal-intel", label: t.nav.legalIntel, icon: Scale },
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
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-medium)",
          padding: isCollapsed ? "14px 6px" : "14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          height: "calc(100vh - var(--navbar-height))",
          position: "sticky",
          top: "var(--navbar-height)",
          overflowY: "auto",
          overflowX: "hidden",
          transition: "width 0.2s ease, min-width 0.2s ease",
          zIndex: 99
        }}
      >
        {/* Sidebar Section Header / Collapse Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: isCollapsed ? "4px 0 8px" : "0 4px 8px",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "6px"
          }}
        >
          {!isCollapsed ? (
            <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Station Modules
            </div>
          ) : (
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--police-blue)" }} />
          )}

          {setIsCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="btn btn-secondary btn-icon"
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "4px",
                background: "var(--bg-surface-raised)",
                border: "1px solid var(--border-medium)",
                display: isCollapsed ? "none" : "inline-flex"
              }}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              <ChevronLeft size={12} color="var(--text-secondary)" />
            </button>
          )}
        </div>

        {/* Primary Action Button: New FIR */}
        <div style={{ marginBottom: "8px" }}>
          <button
            onClick={() => handleNavClick("new-case")}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: isCollapsed ? "8px 0" : "8px 10px",
              justifyContent: isCollapsed ? "center" : "flex-start",
              fontSize: "12.5px",
              fontWeight: "600"
            }}
            title={isCollapsed ? t.nav.newCase : undefined}
          >
            <FilePlus2 size={15} />
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
                padding: isCollapsed ? "9px 0" : "8px 10px",
                borderRadius: "5px",
                background: isActive ? "var(--bg-surface-raised)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                border: isActive ? "1px solid var(--border-medium)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
                fontSize: "12.5px",
                fontWeight: isActive ? "600" : "400",
                transition: "all 0.12s ease"
              }}
            >
              {/* Clean Active Left Bar */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "4px",
                    bottom: "4px",
                    width: "3px",
                    borderRadius: "0 2px 2px 0",
                    background: "#6C151E"
                  }}
                />
              )}

              <div style={{ display: "flex", alignItems: "center", gap: isCollapsed ? "0" : "10px" }}>
                <Icon
                  size={16}
                  color={isActive ? "#6C151E" : "currentColor"}
                />
                {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </div>

              {!isCollapsed && item.count !== undefined && item.count > 0 && (
                <span className="badge badge-subtle" style={{ fontSize: "10px", padding: "1px 5px" }}>
                  {item.count}
                </span>
              )}

              {/* Compact Notification Dot on Collapsed */}
              {isCollapsed && item.count !== undefined && item.count > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "10px",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#6C151E"
                  }}
                />
              )}
            </button>
          );
        })}
      </aside>
    </>
  );
}

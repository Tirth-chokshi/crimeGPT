import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import CaseExplorerPage from "./pages/CaseExplorerPage";
import NewCasePage from "./pages/NewCasePage";
import CaseDetailPage from "./pages/CaseDetailPage";
import LegalIntelPage from "./pages/LegalIntelPage";
import LegalCorpusPage from "./pages/LegalCorpusPage";
import SearchPage from "./pages/SearchPage";
import AuditPage from "./pages/AuditPage";
import { api } from "./api";

export default function App() {
  const [currentLang, setLang] = useState("en");
  const [currentRole, setRole] = useState("IO");
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Keyboard shortcut Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectCase = (id) => {
    setSelectedCaseId(id);
    setActivePage("case-detail");
  };

  const handleCaseCreated = (newCaseId) => {
    fetchCases();
    setSelectedCaseId(newCaseId);
    setActivePage("case-detail");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%", overflowX: "hidden" }}>
      {/* Top Police Command Navbar */}
      <Navbar
        currentLang={currentLang}
        setLang={setLang}
        currentRole={currentRole}
        setRole={setRole}
        policeStation="Navrangpura Police Station, Ahmedabad"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      {/* Main App Layout */}
      <div style={{ display: "flex", flex: 1, width: "100%", minWidth: 0, position: "relative" }}>
        {/* Left Navigation Rail */}
        <Sidebar
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page);
            if (page !== "case-detail") setSelectedCaseId(null);
          }}
          currentLang={currentLang}
          activeCaseCount={cases.length}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Content Area */}
        <main
          className="page-container"
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: "calc(100vh - var(--navbar-height))",
            padding: "20px 24px",
            boxSizing: "border-box"
          }}
        >
          {activePage === "dashboard" && (
            <DashboardPage
              cases={cases}
              onSelectCase={handleSelectCase}
              onNewCase={() => setActivePage("new-case")}
              onOpenLegalIntel={() => setActivePage("legal-intel")}
              currentLang={currentLang}
            />
          )}

          {activePage === "cases" && (
            <CaseExplorerPage
              cases={cases}
              onSelectCase={handleSelectCase}
              onNewCase={() => setActivePage("new-case")}
              onOpenLegalIntel={() => setActivePage("legal-intel")}
              currentLang={currentLang}
            />
          )}

          {activePage === "new-case" && (
            <NewCasePage
              onCaseCreated={handleCaseCreated}
              onCancel={() => setActivePage("dashboard")}
              currentLang={currentLang}
            />
          )}

          {activePage === "case-detail" && selectedCaseId && (
            <CaseDetailPage
              caseId={selectedCaseId}
              onBack={() => {
                fetchCases();
                setActivePage("cases");
              }}
              currentLang={currentLang}
              currentRole={currentRole}
            />
          )}

          {activePage === "legal-intel" && (
            <LegalIntelPage
              currentLang={currentLang}
              onStartCaseWithNarrative={() => setActivePage("new-case")}
            />
          )}

          {activePage === "legal-corpus" && (
            <LegalCorpusPage currentLang={currentLang} />
          )}

          {activePage === "search" && (
            <SearchPage
              onSelectCase={handleSelectCase}
              currentLang={currentLang}
            />
          )}

          {activePage === "audit" && (
            <AuditPage currentLang={currentLang} />
          )}
        </main>
      </div>
    </div>
  );
}

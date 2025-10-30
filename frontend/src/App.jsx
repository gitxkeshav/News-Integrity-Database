import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AddUser from "./components/AddUser";
import AddSource from "./components/AddSource";
import AddArticle from "./components/AddArticle";
import ReportArticle from "./components/ReportArticle";
import AddCredibilityCheck from "./components/AddCredibilityCheck";
import ViewCredibilityChecks from "./components/ViewCredibilityChecks";
import ViewReports from "./components/ViewReports";
import PerformCheck from "./components/PerformCheck";  // <-- new component for stored procedure

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh reports and credibility checks after performing check or marking reviewed
  const handleDataUpdate = () => setRefreshKey((prev) => prev + 1);

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">📰 Fake News Detection Database System</h2>

      {/* ---------- USERS ---------- */}
      <section className="mb-5">
        <h4>👤 User Management</h4>
        <AddUser />
      </section>

      <hr />

      {/* ---------- SOURCES ---------- */}
      <section className="mb-5">
        <h4>🏢 News Sources</h4>
        <AddSource />
      </section>

      <hr />

      {/* ---------- ARTICLES ---------- */}
      <section className="mb-5">
        <h4>🗞️ Articles</h4>
        <AddArticle />
      </section>

      <hr />

      {/* ---------- REPORTS ---------- */}
      <section className="mb-5">
        <h4>🚨 Report a Suspicious Article</h4>
        <ReportArticle />
      </section>

      <hr />

      {/* ---------- CREDIBILITY CHECK ---------- */}
      <section className="mb-5">
        <h4>🧠 Credibility Checks</h4>
        <AddCredibilityCheck />
      </section>

      <hr />

      {/* ---------- PERFORM CHECK (Stored Procedure) ---------- */}
      <section className="mb-5">
        <h4>⚙️ Perform Credibility Check (Stored Procedure)</h4>
        <PerformCheck onSuccess={handleDataUpdate} />
      </section>

      <hr />

      {/* ---------- VIEW DATA ---------- */}
      <section className="mb-5">
        <h4>📊 All Credibility Checks</h4>
        <ViewCredibilityChecks key={refreshKey} />
      </section>

      <hr />

      <section className="mb-5">
        <h4>📋 All Reports</h4>
        <ViewReports key={refreshKey} onReviewed={handleDataUpdate} />
      </section>
    </div>
  );
}

export default App;

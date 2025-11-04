import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import AddUser from "./components/AddUser";
import AddSource from "./components/AddSource";
import AddArticle from "./components/AddArticle";
import ReportArticle from "./components/ReportArticle";
import ViewCredibilityChecks from "./components/ViewCredibilitychecks";
import ViewReports from "./components/ViewReports";
import ViewArticles from "./components/ViewArticles";
import ViewSources from "./components/ViewSources";
import PerformCheck from "./components/PerformCheck";
import UnderReviewArticles from "./components/UnderReviewArticles";
import TopTrustedSources from "./components/TopTrustedSources";
import ActiveReporters from "./components/ActiveReporters";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh reports and credibility checks after performing check or marking reviewed
  const handleDataUpdate = () => setRefreshKey((prev) => prev + 1);

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="app-header text-center mb-5">
        <h2 className="mb-2">Fake News Detection Database System</h2>
        <p className="mb-0">Comprehensive news integrity management platform</p>
      </div>

      {/* ---------- USERS ---------- */}
      <div className="section-card card mb-4">
        <div className="card-header">
          <h5 className="mb-0">👤 User Management</h5>
        </div>
        <div className="card-body">
          <AddUser />
        </div>
      </div>

      {/* ---------- SOURCES ---------- */}
      <div className="section-card card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🏢 News Sources</h5>
        </div>
        <div className="card-body">
          <AddSource />
        </div>
      </div>

      {/* ---------- ARTICLES ---------- */}
      <div className="section-card card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🗞️ Articles</h5>
        </div>
        <div className="card-body">
          <AddArticle />
        </div>
      </div>

      {/* ---------- REPORTS ---------- */}
      <div className="section-card card mb-4">
        <div className="card-header bg-danger">
          <h5 className="mb-0">🚨 Report a Suspicious Article</h5>
        </div>
        <div className="card-body">
          <ReportArticle />
        </div>
      </div>

      {/* ---------- CREDIBILITY CHECK (Fact-Checkers Only) ---------- */}
      <div className="section-card card mb-4">
        <div className="card-header bg-primary">
          <h5 className="mb-0">🧠 Perform Credibility Check</h5>
        </div>
        <div className="card-body">
          <PerformCheck onSuccess={handleDataUpdate} />
        </div>
      </div>

      {/* ---------- VIEW DATA ---------- */}
      <div className="section-card card mb-4">
        <div className="card-header">
          <h5 className="mb-0">📰 View All Articles</h5>
        </div>
        <div className="card-body">
          <ViewArticles />
        </div>
      </div>

      <div className="section-card card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🏢 View All Sources</h5>
        </div>
        <div className="card-body">
          <ViewSources />
        </div>
      </div>

      <div className="section-card card mb-4">
        <div className="card-header bg-info">
          <h5 className="mb-0">📊 All Credibility Checks</h5>
        </div>
        <div className="card-body">
          <ViewCredibilityChecks key={refreshKey} />
        </div>
      </div>

      <div className="section-card card mb-4">
        <div className="card-header bg-warning">
          <h5 className="mb-0">📋 All Reports</h5>
        </div>
        <div className="card-body">
          <ViewReports key={refreshKey} onReviewed={handleDataUpdate} />
        </div>
      </div>

      {/* ---------- TRIGGER EFFECTS & ANALYTICS ---------- */}
      <div className="section-card card mb-4 border-warning">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0">⚠️ Articles Under Review (Trigger Effect)</h5>
        </div>
        <div className="card-body">
          <div className="info-card mb-3">
            <strong>Trigger:</strong> <code>flag_article_after_report</code> - Automatically flags articles when they receive 3+ reports
          </div>
          <UnderReviewArticles />
        </div>
      </div>

      <div className="section-card card mb-4 border-success">
        <div className="card-header bg-success">
          <h5 className="mb-0">🏆 Top 5 Most Trusted Sources</h5>
        </div>
        <div className="card-body">
          <div className="info-card mb-3">
            <strong>Complex Query:</strong> Sources ranked by TrustRating (updated automatically by <code>update_source_trust_after_check</code> trigger)
          </div>
          <TopTrustedSources />
        </div>
      </div>

      <div className="section-card card mb-4 border-primary">
        <div className="card-header bg-primary">
          <h5 className="mb-0">📈 Active Reporters</h5>
        </div>
        <div className="card-body">
          <div className="info-card mb-3">
            <strong>Complex Query:</strong> Users who have submitted more than 2 reports
          </div>
          <ActiveReporters />
        </div>
      </div>

      {/* ---------- FUNCTION IMPLEMENTATIONS INFO ---------- */}
      <div className="section-card card mb-4">
        <div className="card-header bg-dark">
          <h5 className="mb-0">ℹ️ Database Functions & Procedures Implementation</h5>
        </div>
        <div className="card-body">
          <h6 className="mb-3">✅ Implemented Features:</h6>
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="info-card">
                <strong>Stored Procedures:</strong>
                <ul className="mb-0 mt-2">
                  <li><code>perform_credibility_check</code> - Available in "Perform Credibility Check" section (Fact-checkers and Admins only)</li>
                  <li><code>mark_report_reviewed</code> - Available in "All Reports" section</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="info-card">
                <strong>Functions:</strong>
                <ul className="mb-0 mt-2">
                  <li><code>avg_credibility_for_source(src_id)</code> - Shown in "View All Sources"</li>
                  <li><code>report_count_for_article(art_id)</code> - Shown in "View All Articles"</li>
                </ul>
              </div>
            </div>
            <div className="col-md-12">
              <div className="info-card">
                <strong>Triggers:</strong>
                <ul className="mb-0 mt-2">
                  <li><code>update_source_trust_after_check</code> - Auto-updates TrustRating when credibility checks are added</li>
                  <li><code>flag_article_after_report</code> - Auto-flags articles with 3+ reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

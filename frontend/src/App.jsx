import React, { useMemo, useState, useEffect, useContext } from "react";
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

// Simple Auth Context (local state persisted to localStorage)
const AuthContext = React.createContext(null);

function useAuth() {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem("nid_auth");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (auth) localStorage.setItem("nid_auth", JSON.stringify(auth));
    else localStorage.removeItem("nid_auth");
  }, [auth]);

  const logout = () => setAuth(null);
  return { auth, setAuth, logout };
}

function LoginSignup({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup"
            ? { name: form.name, email: form.email, password: form.password, role: form.role }
            : { email: form.email, password: form.password }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-card" className="section-card card mb-4">
      <div className="card-header bg-dark">
        <h5 className="mb-0">🔐 {mode === "signup" ? "Create Account" : "Sign In"}</h5>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-warning mb-3">{error}</div>}
        <form onSubmit={submit} className="row g-3">
          {mode === "signup" && (
            <div className="col-md-6">
              <label className="form-label">Full Name</label>
              <input className="form-control" required value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
            </div>
          )}
          <div className={mode === "signup" ? "col-md-6" : "col-12"}>
            <label className="form-label">Email</label>
            <input type="email" className="form-control" required value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" required value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} />
          </div>
          {mode === "signup" && (
            <div className="col-md-6">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={(e)=>setForm({...form, role:e.target.value})}>
                <option value="user">user</option>
                <option value="reporter">reporter</option>
                <option value="fact-checker">fact-checker</option>
                <option value="admin">admin</option>
              </select>
            </div>
          )}
          <div className="col-12 d-flex gap-2">
            <button className="btn btn-primary" disabled={loading} type="submit">{loading ? "Please wait..." : (mode === "signup" ? "Create Account" : "Sign In")}</button>
            <button className="btn btn-outline-primary" type="button" onClick={()=>setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Have an account? Sign in" : "New here? Sign up"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Navbar() {
  const authState = useContext(AuthContext);
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top navbar-shadow mb-4">
      <div className="container-fluid" style={{ maxWidth: '1400px' }}>
        <span className="navbar-brand fw-semibold">News Integrity</span>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>
          <div className="d-flex align-items-center gap-3">
            {authState?.auth ? (
              <>
                <span className="text-white-50 small">Signed in as <strong className="text-white">{authState.auth.user.Name}</strong> ({authState.auth.user.Role})</span>
                <button className="btn btn-sm btn-outline-light" onClick={authState.logout}>Logout</button>
              </>
            ) : (
              <a href="#auth-card" className="btn btn-sm btn-outline-light">Sign in / Sign up</a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const authState = useAuth();

  // Function to refresh reports and credibility checks after performing check or marking reviewed
  const handleDataUpdate = () => setRefreshKey((prev) => prev + 1);

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '100%', margin: 0 }}>
      <AuthContext.Provider value={authState}>
        <Navbar />
      </AuthContext.Provider>
      <div className="container-fluid px-4 py-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="app-header text-center mb-5">
        <h2 className="mb-2">News Integrity Database</h2>
        <p className="mb-1">Comprehensive news integrity management platform</p>
        
      </div>
      <AuthContext.Provider value={authState}>
      {!authState.auth ? (
        <LoginSignup onAuth={(data)=>authState.setAuth(data)} />
      ) : (
        <>
      {/* ---------- USERS ---------- */}
      {(authState.auth.user.Role === 'admin') && (
        <div className="section-card card mb-4">
          <div className="card-header">
            <h5 className="mb-0">👤 User Management</h5>
          </div>
          <div className="card-body">
            <AddUser />
          </div>
        </div>
      )}

      {/* ---------- SOURCES ---------- */}
      {(authState.auth.user.Role === 'admin') && (
        <div className="section-card card mb-4">
          <div className="card-header">
            <h5 className="mb-0">🏢 News Sources</h5>
          </div>
          <div className="card-body">
            <AddSource />
          </div>
        </div>
      )}

      {/* ---------- ARTICLES ---------- */}
      {(authState.auth.user.Role === 'admin' || authState.auth.user.Role === 'reporter') && (
        <div className="section-card card mb-4">
          <div className="card-header">
            <h5 className="mb-0">🗞️ Articles</h5>
          </div>
          <div className="card-body">
            <AddArticle />
          </div>
        </div>
      )}

      {/* ---------- REPORTS ---------- */}
      <div className="section-card card mb-4">
        <div className="card-header bg-danger">
          <h5 className="mb-0">🚨 Report a Suspicious Article</h5>
        </div>
        <div className="card-body">
          {authState.auth && <ReportArticle />}
        </div>
      </div>

      {/* ---------- CREDIBILITY CHECK (Fact-Checkers Only) ---------- */}
      {(authState.auth.user.Role === 'fact-checker' || authState.auth.user.Role === 'admin') && (
        <div className="section-card card mb-4">
          <div className="card-header bg-primary">
            <h5 className="mb-0">🧠 Perform Credibility Check</h5>
          </div>
          <div className="card-body">
            <PerformCheck onSuccess={handleDataUpdate} />
          </div>
        </div>
      )}

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

      {(authState.auth.user.Role === 'fact-checker' || authState.auth.user.Role === 'admin') && (
        <div className="section-card card mb-4">
          <div className="card-header bg-info">
            <h5 className="mb-0">📊 All Credibility Checks</h5>
          </div>
          <div className="card-body">
            <ViewCredibilityChecks key={refreshKey} />
          </div>
        </div>
      )}

      {(authState.auth.user.Role === 'fact-checker' || authState.auth.user.Role === 'admin') && (
        <div className="section-card card mb-4">
          <div className="card-header bg-warning">
            <h5 className="mb-0">📋 All Reports</h5>
          </div>
          <div className="card-body">
            <ViewReports key={refreshKey} onReviewed={handleDataUpdate} />
          </div>
        </div>
      )}

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
        </>
      )}
      </AuthContext.Provider>
      </div>
    </div>
  );
}

export default App;

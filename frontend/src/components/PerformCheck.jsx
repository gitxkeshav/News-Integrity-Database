import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PerformCheck({ onSuccess }) {
  const [form, setForm] = useState({
    article_id: "",
    factcheck_score: "0.50",
    final_verdict: "Unverified",
    checked_by: "",
  });
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [factCheckers, setFactCheckers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/articles").then((res) => setArticles(res.data)).catch(() => setArticles([]));
    axios.get("/api/users").then((res) => {
      setUsers(res.data);
      // Filter only fact-checkers and admins
      const authorizedUsers = res.data.filter(u => u.Role === 'fact-checker' || u.Role === 'admin');
      setFactCheckers(authorizedUsers);
    }).catch(() => {
      setUsers([]);
      setFactCheckers([]);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate that selected user is a fact-checker or admin
    const selectedUser = users.find(u => u.UserID === parseInt(form.checked_by));
    if (selectedUser && selectedUser.Role !== 'fact-checker' && selectedUser.Role !== 'admin') {
      setError("Only fact-checkers and admins can perform credibility checks. Please select an authorized user.");
      return;
    }
    
    try {
      setLoading(true);
      const res = await axios.post("/api/perform_check", {
        article_id: parseInt(form.article_id),
        factcheck_score: parseFloat(form.factcheck_score),
        final_verdict: form.final_verdict,
        checked_by: parseInt(form.checked_by),
      });
      alert(res.data.message || "Check recorded");
      setForm({
        article_id: "",
        factcheck_score: "0.50",
        final_verdict: "Unverified",
        checked_by: "",
      });
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err.message;
      setError(errorMsg);
      alert("Failed to record check: " + errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <div className="alert alert-info mb-3">
        <strong>🔒 Authorization Required:</strong> Only <strong>fact-checkers</strong> and <strong>admins</strong> can perform credibility checks. 
      </div>
      {error && (
        <div className="alert alert-warning mb-3">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}
      {factCheckers.length === 0 && (
        <div className="alert alert-warning mb-3">
          <strong>⚠️ No authorized users found:</strong> Please create a user with role "fact-checker" or "admin" to perform credibility checks.
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Article</label>
          <select
            className="form-control"
            value={form.article_id}
            onChange={(e) => setForm({ ...form, article_id: e.target.value })}
            required
          >
            <option value="">-- Select an article --</option>
            {articles.map((a) => (
              <option key={a.ArticleID} value={a.ArticleID}>
                {a.Title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Fact-Check Score (0-1)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            className="form-control"
            value={form.factcheck_score}
            onChange={(e) => setForm({ ...form, factcheck_score: e.target.value })}
            required
          />
          <small className="form-text text-muted">Score between 0 (fake) and 1 (real)</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Final Verdict</label>
          <select
            className="form-control"
            value={form.final_verdict}
            onChange={(e) => setForm({ ...form, final_verdict: e.target.value })}
            required
          >
            <option value="Unverified">Unverified</option>
            <option value="Real">Real</option>
            <option value="Fake">Fake</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Checked By (Fact-Checker/Admin Only)</label>
          <select
            className="form-control"
            value={form.checked_by}
            onChange={(e) => {
              setForm({ ...form, checked_by: e.target.value });
              setError("");
            }}
            required
            disabled={factCheckers.length === 0}
          >
            <option value="">-- Select a fact-checker or admin --</option>
            {factCheckers.map((u) => (
              <option key={u.UserID} value={u.UserID}>
                {u.Name} ({u.Role})
              </option>
            ))}
          </select>
          <small className="form-text text-muted">
            Only fact-checkers and admins are authorized to perform credibility checks
          </small>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              Record Credibility Check
            </>
          )}
        </button>
      </form>
    </div>
  );
}

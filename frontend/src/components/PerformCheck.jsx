import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PerformCheck({ onSuccess }) {
  const [form, setForm] = useState({
    article_id: "",
    ai_score: "0.50",
    factcheck_score: "0.50",
    final_verdict: "Unverified",
    checked_by: "",
  });
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("/api/articles").then((res) => setArticles(res.data)).catch(() => setArticles([]));
    axios.get("/api/users").then((res) => setUsers(res.data)).catch(() => setUsers([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("/api/perform_check", {
        article_id: parseInt(form.article_id),
        ai_score: parseFloat(form.ai_score),
        factcheck_score: parseFloat(form.factcheck_score),
        final_verdict: form.final_verdict,
        checked_by: parseInt(form.checked_by),
      });
      alert(res.data.message || "Check recorded");
      setForm({
        article_id: "",
        ai_score: "0.50",
        factcheck_score: "0.50",
        final_verdict: "Unverified",
        checked_by: "",
      });
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      alert("Failed to record check: " + (err?.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-3 mb-3">
      <form onSubmit={handleSubmit}>
        <label>Article</label>
        <select
          className="form-control mb-2"
          value={form.article_id}
          onChange={(e) => setForm({ ...form, article_id: e.target.value })}
        >
          <option value="">-- select article --</option>
          {articles.map((a) => (
            <option key={a.ArticleID} value={a.ArticleID}>
              {a.Title}
            </option>
          ))}
        </select>

        <label>AI Score (0–1)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          className="form-control mb-2"
          value={form.ai_score}
          onChange={(e) => setForm({ ...form, ai_score: e.target.value })}
        />

        <label>Fact-Check Score (0–1)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          className="form-control mb-2"
          value={form.factcheck_score}
          onChange={(e) => setForm({ ...form, factcheck_score: e.target.value })}
        />

        <label>Final Verdict</label>
        <select
          className="form-control mb-2"
          value={form.final_verdict}
          onChange={(e) => setForm({ ...form, final_verdict: e.target.value })}
        >
          <option value="Unverified">Unverified</option>
          <option value="Real">Real</option>
          <option value="Fake">Fake</option>
        </select>

        <label>Checked By (User)</label>
        <select
          className="form-control mb-3"
          value={form.checked_by}
          onChange={(e) => setForm({ ...form, checked_by: e.target.value })}
        >
          <option value="">-- select user --</option>
          {users.map((u) => (
            <option key={u.UserID} value={u.UserID}>
              {u.Name} ({u.Role})
            </option>
          ))}
        </select>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Record Credibility Check"}
        </button>
      </form>
    </div>
  );
}

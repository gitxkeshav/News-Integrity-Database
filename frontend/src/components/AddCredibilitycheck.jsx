import React, { useState } from "react";
import axios from "axios";

export default function AddCredibilityCheck() {
  const [form, setForm] = useState({
    article_id: "",
    factcheck_score: "",
    final_verdict: "Unverified",
    checked_by: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/credibility", form);
      alert("✅ Credibility check added successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add credibility check. Check backend or connection.");
    }
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Article ID</label>
          <input 
            type="number"
            className="form-control" 
            placeholder="Enter article ID" 
            value={form.article_id}
            onChange={(e) => setForm({ ...form, article_id: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Fact-Check Score (0-1)</label>
          <input 
            type="number"
            step="0.01"
            min="0"
            max="1"
            className="form-control" 
            placeholder="0.00 - 1.00" 
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
          >
            <option value="Unverified">Unverified</option>
            <option value="Real">Real</option>
            <option value="Fake">Fake</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Checked By (User ID)</label>
          <input 
            type="number"
            className="form-control" 
            placeholder="Enter checker user ID" 
            value={form.checked_by}
            onChange={(e) => setForm({ ...form, checked_by: e.target.value })} 
          />
          <small className="form-text text-muted">Optional - Leave blank if not assigned to a specific user</small>
        </div>
        <button type="submit" className="btn btn-warning w-100">
          <i className="bi bi-check-circle me-2"></i>
          Add Credibility Check
        </button>
      </form>
    </div>
  );
}

import React, { useState } from "react";
import axios from "axios";

export default function ReportArticle() {
  const [form, setForm] = useState({ user_id: "", article_id: "", reason: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/reports", form);
      alert("🚨 Report submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit report. Check backend or connection.");
    }
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <div className="alert alert-warning">
          <strong>⚠️ Note:</strong> Articles with 3+ reports will be automatically flagged for review.
        </div>
        <div className="mb-3">
          <label className="form-label">User ID</label>
          <input 
            type="number"
            className="form-control" 
            placeholder="Enter your user ID" 
            value={form.user_id}
            onChange={(e) => setForm({ ...form, user_id: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Article ID</label>
          <input 
            type="number"
            className="form-control" 
            placeholder="Enter article ID to report" 
            value={form.article_id}
            onChange={(e) => setForm({ ...form, article_id: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Reason for Reporting</label>
          <textarea 
            className="form-control" 
            rows="3"
            placeholder="Explain why you're reporting this article..." 
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })} 
            required
          ></textarea>
        </div>
        <button type="submit" className="btn btn-danger w-100">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Submit Report
        </button>
      </form>
    </div>
  );
}

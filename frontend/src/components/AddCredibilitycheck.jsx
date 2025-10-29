import React, { useState } from "react";
import axios from "axios";

export default function AddCredibilityCheck() {
  const [form, setForm] = useState({
    article_id: "",
    ai_score: "",
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
    <div>
      <h4>Add Credibility Check</h4>
      <form onSubmit={handleSubmit}>
        <input className="form-control mb-2" placeholder="Article ID" onChange={(e) => setForm({ ...form, article_id: e.target.value })} />
        <input className="form-control mb-2" placeholder="AI Score (0–1)" onChange={(e) => setForm({ ...form, ai_score: e.target.value })} />
        <input className="form-control mb-2" placeholder="Fact-Check Score (0–1)" onChange={(e) => setForm({ ...form, factcheck_score: e.target.value })} />
        <select className="form-control mb-2" onChange={(e) => setForm({ ...form, final_verdict: e.target.value })}>
          <option value="Unverified">Unverified</option>
          <option value="Real">Real</option>
          <option value="Fake">Fake</option>
        </select>
        <input className="form-control mb-2" placeholder="Checked By (User ID)" onChange={(e) => setForm({ ...form, checked_by: e.target.value })} />
        <button className="btn btn-warning">Add Check</button>
      </form>
    </div>
  );
}

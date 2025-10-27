import React, { useState } from "react";
import axios from "axios";

export default function ReportArticle() {
  const [form, setForm] = useState({ user_id: "", article_id: "", reason: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/reports", form);
    alert("🚨 Report submitted successfully!");
  };

  return (
    <div>
      <h4>Report an Article</h4>
      <form onSubmit={handleSubmit}>
        <input className="form-control mb-2" placeholder="User ID" onChange={(e) => setForm({ ...form, user_id: e.target.value })} />
        <input className="form-control mb-2" placeholder="Article ID" onChange={(e) => setForm({ ...form, article_id: e.target.value })} />
        <input className="form-control mb-2" placeholder="Reason" onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <button className="btn btn-danger">Submit Report</button>
      </form>
    </div>
  );
}

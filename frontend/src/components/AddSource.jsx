import React, { useState } from "react";
import axios from "axios";

export default function AddSource() {
  const [form, setForm] = useState({ name: "", domain: "", trust: 50 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/sources", form);
      alert("✅ Source added successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add source. Check backend or connection.");
    }
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Source Name</label>
          <input 
            className="form-control" 
            placeholder="e.g. CNN, BBC News" 
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Domain</label>
          <input 
            className="form-control" 
            placeholder="e.g. cnn.com" 
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Initial Trust Rating (0-100)</label>
          <input 
            type="number"
            min="0"
            max="100"
            className="form-control" 
            placeholder="50" 
            value={form.trust}
            onChange={(e) => setForm({ ...form, trust: e.target.value })} 
          />
          <small className="form-text text-muted">Default: 50. Will be updated automatically by triggers</small>
        </div>
        <button type="submit" className="btn btn-success w-100">
          <i className="bi bi-building me-2"></i>
          Add Source
        </button>
      </form>
    </div>
  );
}

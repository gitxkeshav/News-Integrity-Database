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
    <div>
      <h4>Add Source</h4>
      <form onSubmit={handleSubmit}>
        <input className="form-control mb-2" placeholder="Source Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="form-control mb-2" placeholder="Domain (e.g. cnn.com)" onChange={(e) => setForm({ ...form, domain: e.target.value })} />
        <input className="form-control mb-2" placeholder="Trust Rating (0–100)" onChange={(e) => setForm({ ...form, trust: e.target.value })} />
        <button className="btn btn-success">Add Source</button>
      </form>
    </div>
  );
}

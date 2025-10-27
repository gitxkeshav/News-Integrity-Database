import React, { useState } from "react";
import axios from "axios";

export default function AddArticle() {
  const [form, setForm] = useState({ title: "", content: "", url: "", source_id: "", publish_date: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/articles", form);
    alert("✅ Article added successfully!");
  };

  return (
    <div>
      <h4>Add Article</h4>
      <form onSubmit={handleSubmit}>
        <input className="form-control mb-2" placeholder="Title" onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="form-control mb-2" placeholder="Content" onChange={(e) => setForm({ ...form, content: e.target.value })}></textarea>
        <input className="form-control mb-2" placeholder="URL" onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <input className="form-control mb-2" placeholder="Source ID" onChange={(e) => setForm({ ...form, source_id: e.target.value })} />
        <input className="form-control mb-2" placeholder="Publish Date (YYYY-MM-DD)" onChange={(e) => setForm({ ...form, publish_date: e.target.value })} />
        <button className="btn btn-info">Add Article</button>
      </form>
    </div>
  );
}

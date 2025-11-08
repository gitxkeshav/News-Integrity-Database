import React, { useState } from "react";
import axios from "axios";

export default function AddArticle() {
  const [form, setForm] = useState({
    title: "",
    content: "",
    url: "",
    source_id: "",
    publish_date: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/articles", form);
      alert("✅ Article added successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add article. Check backend or connection.");
    }
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Article Title</label>
          <input 
            className="form-control" 
            placeholder="Enter article title" 
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Content</label>
          <textarea 
            className="form-control" 
            rows="4"
            placeholder="Enter article content..." 
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })} 
            required
          ></textarea>
        </div>
        <div className="mb-3">
          <label className="form-label">Article URL</label>
          <input 
            type="url"
            className="form-control" 
            placeholder="https://example.com/article" 
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Source ID</label>
          <input 
            type="number"
            className="form-control" 
            placeholder="Enter source ID" 
            value={form.source_id}
            onChange={(e) => setForm({ ...form, source_id: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Publish Date</label>
          <input 
            type="date"
            className="form-control" 
            value={form.publish_date}
            onChange={(e) => setForm({ ...form, publish_date: e.target.value })} 
            required
          />
        </div>
        <button type="submit" className="btn btn-info w-100">
          <i className="bi bi-file-text me-2"></i>
          Add Article
        </button>
      </form>
    </div>
  );
}

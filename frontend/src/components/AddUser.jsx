import React, { useState } from "react";
import axios from "axios";

export default function AddUser() {
  const [form, setForm] = useState({ name: "", email: "", role: "user", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending payload:", form);
      const res = await axios.post("/api/users", form); // proxy -> 127.0.0.1:5000
      console.log("Response:", res);
      alert("✅ User added successfully!");
    } catch (err) {
      console.error("AXIOS ERROR:", err);
      // show server message if available
      const serverMsg = err?.response?.data || err?.message || "Unknown error";
      alert("❌ Failed to add user: " + JSON.stringify(serverMsg));
    }
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input 
            className="form-control" 
            placeholder="Enter full name" 
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email Address</label>
          <input 
            type="email"
            className="form-control" 
            placeholder="user@example.com" 
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-control" 
            placeholder="Enter password" 
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} 
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Role</label>
          <select 
            className="form-control" 
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="fact-checker">Fact-checker</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-100">
          <i className="bi bi-person-plus me-2"></i>
          Add User
        </button>
      </form>
    </div>
  );
}

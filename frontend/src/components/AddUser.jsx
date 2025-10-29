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
    <div>
      <h4>Add New User</h4>
      <form onSubmit={handleSubmit}>
        <input className="form-control mb-2" placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="form-control mb-2" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="form-control mb-2" type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="form-control mb-2" onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="fact-checker">Fact-checker</option>
        </select>
        <button className="btn btn-primary">Add User</button>
      </form>
    </div>
  );
}

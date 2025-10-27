import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ViewCredibilityChecks() {
  const [checks, setChecks] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/credibility").then((res) => setChecks(res.data));
  }, []);

  return (
    <div>
      <h4>All Credibility Checks</h4>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Article</th>
            <th>AI Score</th>
            <th>FactCheck Score</th>
            <th>Verdict</th>
            <th>Checked By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.CheckID}>
              <td>{c.CheckID}</td>
              <td>{c.ArticleTitle}</td>
              <td>{c.AI_Score}</td>
              <td>{c.FactCheckScore}</td>
              <td>{c.FinalVerdict}</td>
              <td>{c.CheckedBy || "N/A"}</td>
              <td>{new Date(c.CheckDate).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

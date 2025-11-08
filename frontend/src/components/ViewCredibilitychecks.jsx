import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ViewCredibilityChecks() {
  const [checks, setChecks] = useState([]);

  useEffect(() => {
    axios.get("/api/credibility").then((res) => setChecks(res.data));
  }, []);

  const getVerdictBadge = (verdict) => {
    if (verdict === 'Real') return 'badge bg-success';
    if (verdict === 'Fake') return 'badge bg-danger';
    return 'badge bg-secondary';
  };

  return (
    <div>
      {checks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p>No credibility checks found.</p>
        </div>
      ) : (
        <div className="scrollable-container">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Article</th>
                <th>FactCheck Score</th>
                <th>Verdict</th>
                <th>Checked By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.CheckID}>
                  <td><strong>{c.CheckID}</strong></td>
                  <td>{c.ArticleTitle}</td>
                  <td>
                    <span className="badge bg-info">
                      {(c.FactCheckScore * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <span className={getVerdictBadge(c.FinalVerdict)}>
                      {c.FinalVerdict}
                    </span>
                  </td>
                  <td>{c.CheckedBy || <span className="text-muted">N/A</span>}</td>
                  <td>{new Date(c.CheckDate).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

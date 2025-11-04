import React, { useState } from "react";
import axios from "axios";

export default function ReportRow({ report, onReviewed }) {
  const [loading, setLoading] = useState(false);

  const markReviewed = async () => {
    if (!window.confirm("Mark this report as reviewed?")) return;
    setLoading(true);
    try {
      const res = await axios.post(`/api/reports/${report.ReportID}/review`);
      alert(res.data.message || "Report marked reviewed");
      if (typeof onReviewed === "function") onReviewed();
    } catch (err) {
      console.error(err);
      alert("Failed to mark reviewed: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Reviewed') return 'badge bg-success';
    if (status === 'Dismissed') return 'badge bg-secondary';
    return 'badge bg-warning text-dark';
  };

  return (
    <tr>
      <td><strong>{report.ReportID}</strong></td>
      <td>{report.Reporter}</td>
      <td>{report.ArticleTitle}</td>
      <td>{report.Reason || <span className="text-muted">No reason provided</span>}</td>
      <td>
        <span className={getStatusBadge(report.Status)}>
          {report.Status}
        </span>
      </td>
      <td>{new Date(report.ReportDate).toLocaleString()}</td>
      <td>
        {report.Status === 'Open' ? (
          <button 
            className="btn btn-sm btn-success" 
            disabled={loading} 
            onClick={markReviewed}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-1"></i>
                Mark Reviewed
              </>
            )}
          </button>
        ) : (
          <span className="text-muted">Already reviewed</span>
        )}
      </td>
    </tr>
  );
}

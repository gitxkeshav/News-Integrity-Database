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

  return (
    <tr>
      <td>{report.ReportID}</td>
      <td>{report.Reporter}</td>
      <td>{report.ArticleTitle}</td>
      <td>{report.Reason}</td>
      <td>{report.Status}</td>
      <td>{new Date(report.ReportDate).toLocaleString()}</td>
      <td>
        <button className="btn btn-sm btn-success" disabled={loading} onClick={markReviewed}>
          {loading ? "..." : "Mark Reviewed"}
        </button>
      </td>
    </tr>
  );
}

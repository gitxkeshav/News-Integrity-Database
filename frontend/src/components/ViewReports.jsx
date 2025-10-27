import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ViewReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/reports").then((res) => setReports(res.data));
  }, []);

  return (
    <div>
      <h4>All Reports</h4>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Reporter</th>
            <th>Article</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.ReportID}>
              <td>{r.ReportID}</td>
              <td>{r.Reporter}</td>
              <td>{r.ArticleTitle}</td>
              <td>{r.Reason}</td>
              <td>{r.Status}</td>
              <td>{new Date(r.ReportDate).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

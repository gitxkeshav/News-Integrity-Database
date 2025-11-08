import React, { useEffect, useState } from "react";
import axios from "axios";
import ReportRow from "./ReportRow";

export default function ViewReports() {
  const [reports, setReports] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch reports on load or when refreshKey changes
  useEffect(() => {
    axios.get("/api/reports")
      .then((res) => setReports(res.data))
      .catch((err) => console.error("Error fetching reports:", err));
  }, [refreshKey]);

  // Function to refresh list after marking reviewed
  const refreshReports = () => setRefreshKey((prev) => prev + 1);

  const getStatusBadge = (status) => {
    if (status === 'Reviewed') return 'badge bg-success';
    if (status === 'Dismissed') return 'badge bg-secondary';
    return 'badge bg-warning text-dark';
  };

  return (
    <div>
      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No reports found.</p>
        </div>
      ) : (
        <div className="scrollable-container">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Article</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <ReportRow key={r.ReportID} report={r} onReviewed={refreshReports} />
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

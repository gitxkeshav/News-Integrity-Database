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
            <th>Action</th> {/* new column for the button */}
          </tr>
        </thead>
        <tbody>
          {reports.length > 0 ? (
            reports.map((r) => (
              <ReportRow key={r.ReportID} report={r} onReviewed={refreshReports} />
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center text-muted">
                No reports found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

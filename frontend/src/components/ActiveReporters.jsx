import React, { useState, useEffect } from 'react';

const ActiveReporters = () => {
  const [reporters, setReporters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveReporters();
  }, []);

  const fetchActiveReporters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/active_reporters');
      if (!response.ok) {
        throw new Error('Failed to fetch active reporters');
      }
      const data = await response.json();
      setReporters(data);
    } catch (error) {
      console.error('Error fetching active reporters:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'admin') return 'badge bg-danger';
    if (role === 'fact-checker') return 'badge bg-primary';
    return 'badge bg-secondary';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <span className="loading-spinner"></span>
        <p className="text-muted mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {reporters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <p>No active reporters found.</p>
          <small className="text-muted">Users who submit more than 2 reports will appear here.</small>
        </div>
      ) : (
        <div className="scrollable-container">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Total Reports</th>
            </tr>
          </thead>
          <tbody>
            {reporters.map((reporter) => (
              <tr key={reporter.UserID}>
                <td>{reporter.UserID}</td>
                <td>
                  <strong>{reporter.Name}</strong>
                </td>
                <td>{reporter.Email}</td>
                <td>
                  <span className={getRoleBadgeClass(reporter.Role)}>
                    {reporter.Role}
                  </span>
                </td>
                <td>
                  <span className="badge bg-warning text-dark">
                    {reporter.TotalReports} reports
                  </span>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveReporters;


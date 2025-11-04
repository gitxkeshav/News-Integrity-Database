import React, { useState, useEffect } from 'react';

const TopTrustedSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopSources();
  }, []);

  const fetchTopSources = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/top_trusted_sources');
      if (!response.ok) {
        throw new Error('Failed to fetch top trusted sources');
      }
      const data = await response.json();
      setSources(data);
    } catch (error) {
      console.error('Error fetching top trusted sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustRatingClass = (rating) => {
    if (rating >= 70) return 'text-success';
    if (rating >= 40) return 'text-warning';
    return 'text-danger';
  };

  const getTrustIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '⭐';
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
      {sources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <p>No sources found.</p>
        </div>
      ) : (
        <div className="scrollable-container">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Source Name</th>
              <th>Domain</th>
              <th>Trust Rating</th>
              <th>Source ID</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source, index) => (
              <tr key={source.SourceID}>
                <td>
                  <strong>{getTrustIcon(index)} #{index + 1}</strong>
                </td>
                <td>
                  <strong>{source.SourceName}</strong>
                </td>
                <td>{source.Domain}</td>
                <td>
                  <span className={getTrustRatingClass(source.TrustRating)}>
                    <strong>{source.TrustRating}%</strong>
                  </span>
                </td>
                <td>{source.SourceID}</td>
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

export default TopTrustedSources;


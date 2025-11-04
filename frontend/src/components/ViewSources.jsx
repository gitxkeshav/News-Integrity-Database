import React, { useState, useEffect } from 'react';

const ViewSources = () => {
  const [sources, setSources] = useState([]);
  const [credibilityScores, setCredibilityScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sources');
      if (!response.ok) {
        throw new Error('Failed to fetch sources');
      }
      const data = await response.json();
      setSources(data);
      
      // Fetch average credibility for each source using the function (in parallel)
      const scorePromises = data.map(async (source) => {
        try {
          const scoreResponse = await fetch(`http://localhost:5000/api/sources/${source.SourceID}/avg_credibility`);
          if (scoreResponse.ok) {
            const scoreData = await scoreResponse.json();
            return { sourceId: source.SourceID, score: scoreData.avg_credibility };
          }
        } catch (err) {
          console.error(`Error fetching credibility for source ${source.SourceID}:`, err);
        }
        return null;
      });
      
      const scoreResults = await Promise.all(scorePromises);
      const scores = {};
      scoreResults.forEach(result => {
        if (result) {
          scores[result.sourceId] = result.score;
        }
      });
      setCredibilityScores(scores);
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustRatingClass = (rating) => {
    if (rating >= 70) return 'text-success';
    if (rating >= 40) return 'text-warning';
    return 'text-danger';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <span className="loading-spinner"></span>
        <p className="text-muted mt-2">Loading sources...</p>
      </div>
    );
  }

  return (
    <div>
      {sources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <p>No sources found.</p>
        </div>
      ) : (
        <div className="scrollable-container">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Source ID</th>
              <th>Name</th>
              <th>Domain</th>
              <th>Trust Rating</th>
              <th>Avg Credibility Score</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.SourceID}>
                <td>{source.SourceID}</td>
                <td>{source.Name}</td>
                <td>{source.Domain}</td>
                <td>
                  <span className={getTrustRatingClass(source.TrustRating)}>
                    <strong>{source.TrustRating}%</strong>
                  </span>
                  <small className="text-muted ms-1">
                    (Auto-updated by trigger)
                  </small>
                </td>
                <td>
                  {credibilityScores[source.SourceID] !== undefined ? (
                    <span className={getTrustRatingClass(credibilityScores[source.SourceID])}>
                      <strong>{credibilityScores[source.SourceID].toFixed(2)}%</strong>
                    </span>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td>{source.CreatedAt ? new Date(source.CreatedAt).toLocaleDateString() : 'N/A'}</td>
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

export default ViewSources;
import React, { useState, useEffect } from 'react';

const UnderReviewArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnderReviewArticles();
  }, []);

  const fetchUnderReviewArticles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/under_review_articles');
      if (!response.ok) {
        throw new Error('Failed to fetch under review articles');
      }
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching under review articles:', error);
    } finally {
      setLoading(false);
    }
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
      {articles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p>No articles are currently under review.</p>
          <small className="text-muted">Articles will be flagged automatically when they receive 3 or more reports.</small>
        </div>
      ) : (
        <div className="scrollable-container">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
          <thead>
              <tr>
                <th>Article ID</th>
                <th>Title</th>
                <th>Source</th>
                <th>Total Reports</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.ArticleID}>
                  <td><strong>{article.ArticleID}</strong></td>
                  <td>{article.Title}</td>
                  <td>{article.SourceName}</td>
                  <td>
                    <span className="badge bg-danger">
                      {article.TotalReports} reports
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-warning text-dark">
                      {article.ReviewStatus}
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

export default UnderReviewArticles;


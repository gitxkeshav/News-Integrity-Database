import React, { useState, useEffect } from 'react';

const ViewArticles = () => {
  const [articles, setArticles] = useState([]);
  const [articlesWithReports, setArticlesWithReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
    fetchArticlesWithReportCount();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/articles');
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticlesWithReportCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/articles_with_report_count');
      if (!response.ok) {
        throw new Error('Failed to fetch articles with report count');
      }
      const data = await response.json();
      // Create a map for quick lookup
      const reportCountMap = {};
      data.forEach(item => {
        reportCountMap[item.ArticleID] = item.ReportCount;
      });
      setArticlesWithReports(reportCountMap);
    } catch (error) {
      console.error('Error fetching report counts:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Under Review') return 'badge bg-warning text-dark';
    return 'badge bg-success';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <span className="loading-spinner"></span>
        <p className="text-muted mt-2">Loading articles...</p>
      </div>
    );
  }

  return (
    <div>
      {articles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📰</div>
          <p>No articles found.</p>
        </div>
      ) : (
        <div className="scrollable-container">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Title</th>
              <th>Source</th>
              <th>Publish Date</th>
              <th>Review Status</th>
              <th>Reports</th>
              <th>Credibility</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.ArticleID}>
                <td>{article.Title}</td>
                <td>{article.SourceName}</td>
                <td>{new Date(article.PublishDate).toLocaleDateString()}</td>
                <td>
                  <span className={getStatusBadgeClass(article.ReviewStatus || 'Normal')}>
                    {article.ReviewStatus || 'Normal'}
                  </span>
                </td>
                <td>
                  <span className="badge bg-info">
                    {articlesWithReports[article.ArticleID] || 0} reports
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    article.CredibilityVerdict === 'Real' ? 'bg-success' :
                    article.CredibilityVerdict === 'Fake' ? 'bg-danger' : 'bg-secondary'
                  }`}>
                    {article.CredibilityVerdict || 'Unverified'}
                  </span>
                </td>
                <td>
                  <a href={article.URL} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-box-arrow-up-right me-1"></i>
                    View
                  </a>
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

export default ViewArticles;
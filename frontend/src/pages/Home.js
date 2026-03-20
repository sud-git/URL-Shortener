import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

const API_URL = 'http://localhost:8001';

function Home({ isAuthenticated }) {
  const [urls, setUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedShortId, setGeneratedShortId] = useState('');

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const response = await axios.get(`${API_URL}/`);
      // Extract URLs from the rendered HTML response
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'text/html');
      const rows = Array.from(doc.querySelectorAll('tbody tr'));
      
      const urlsList = rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          shortId: cells[1]?.textContent.trim() || '',
          redirectURL: cells[2]?.textContent.trim() || '',
          clicks: parseInt(cells[3]?.textContent.trim() || '0')
        };
      });
      setUrls(urlsList);
    } catch (err) {
      console.error('Error fetching URLs:', err);
    }
  };

  const isValidURL = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleGenerateURL = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratedShortId('');

    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidURL(urlInput)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('url', urlInput);

      const response = await axios.post(`${API_URL}/url`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 0
      });

      // Extract the short ID from the redirect URL
      const urlParams = new URL(response.request.responseURL).searchParams;
      const shortId = urlParams.get('id');
      
      setGeneratedShortId(shortId);
      setSuccess('URL shortened successfully!');
      setUrlInput('');
      
      setTimeout(() => {
        fetchUrls();
      }, 500);
    } catch (err) {
      if (err.response?.status === 302 || err.response?.status === 301) {
        setSuccess('URL shortened successfully!');
        setUrlInput('');
        setTimeout(() => {
          fetchUrls();
        }, 500);
      } else {
        setError(err.response?.data?.error || 'Failed to shorten URL');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortId) => {
    const shortUrl = `http://localhost:8001/url/${shortId}`;
    navigator.clipboard.writeText(shortUrl);
    setSuccess('Short URL copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getAnalytics = async (shortId) => {
    try {
      const response = await axios.get(`${API_URL}/url/analytics/${shortId}`);
      alert(`Analytics for ${shortId}:\nTotal Clicks: ${response.data.totalClicks}`);
    } catch (err) {
      setError('Failed to fetch analytics');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>🔗 URL Shortener</h1>
        <p className="subtitle">Shorten your long URLs into concise, easy-to-share links</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleGenerateURL} className="url-form">
          <div className="form-group">
            <label htmlFor="url">Enter Your URL</label>
            <input
              type="url"
              id="url"
              placeholder="https://example.com/very/long/url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Generating...' : 'Generate Short URL'}
          </button>
        </form>

        {generatedShortId && (
          <div className="generated-url-box">
            <p>
              <strong>✓ Your Short URL:</strong>
            </p>
            <div className="short-url-display">
              <input 
                type="text" 
                value={`http://localhost:8001/url/${generatedShortId}`}
                readOnly
                className="short-url-input"
              />
              <button 
                onClick={() => copyToClipboard(generatedShortId)}
                className="btn btn-secondary"
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}

        {urls.length > 0 && (
          <div className="urls-section">
            <h2>Recent URLs</h2>
            <div className="table-wrapper">
              <table className="urls-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Short ID</th>
                    <th>Original URL</th>
                    <th>Clicks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map((url, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="short-id">{url.shortId}</span>
                      </td>
                      <td className="url-cell">
                        <a href={url.redirectURL} target="_blank" rel="noopener noreferrer">
                          {url.redirectURL.length > 50 ? url.redirectURL.substring(0, 50) + '...' : url.redirectURL}
                        </a>
                      </td>
                      <td>
                        <span className="clicks-badge">{url.clicks}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => copyToClipboard(url.shortId)}
                            className="btn-small btn-copy"
                            title="Copy short URL"
                          >
                            📋
                          </button>
                          <button 
                            onClick={() => getAnalytics(url.shortId)}
                            className="btn-small btn-analytics"
                            title="View analytics"
                          >
                            📊
                          </button>
                          <a 
                            href={`http://localhost:8001/url/${url.shortId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-small btn-visit"
                            title="Visit short URL"
                          >
                            🔗
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="info-box">
            <p>📝 <strong>Tip:</strong> Sign up or login to save and track your URLs!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;

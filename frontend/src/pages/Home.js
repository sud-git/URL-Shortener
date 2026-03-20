import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

const API_URL = 'http://localhost:8000';

function Home({ isAuthenticated }) {
  const [urls, setUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(`http://localhost:8000/url/${text}`);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleGenerateURL = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCopySuccess('');

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

      await axios.post(`${API_URL}/url`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setSuccess('✓ URL shortened successfully!');
      setUrlInput('');
      
      setTimeout(() => {
        fetchUrls();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="header-section">
          <h1>🔗 URL Shortener</h1>
          <p>Transform long URLs into short, shareable links instantly</p>
        </div>

        <div className="main-section">
          <div className="shortener-card">
            <h2>Create Short URL</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleGenerateURL} className="url-form">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="https://example.com/very/long/url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={loading}
                  className="url-input"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Processing...' : 'Shorten URL'}
                </button>
              </div>
            </form>
          </div>

          {urls.length > 0 && (
            <div className="urls-section">
              <h2>Your Shortened URLs</h2>
              <div className="urls-grid">
                {urls.map((url, index) => (
                  <div key={index} className="url-card">
                    <div className="url-card-content">
                      <div className="short-url">
                        <span className="label">Short URL:</span>
                        <a 
                          href={`${API_URL}/url/${url.shortId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="short-link"
                        >
                          {url.shortId}
                        </a>
                        <button
                          onClick={() => copyToClipboard(url.shortId)}
                          className="btn-copy"
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </div>
                      
                      <div className="original-url">
                        <span className="label">Original URL:</span>
                        <a 
                          href={url.redirectURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="original-link"
                          title={url.redirectURL}
                        >
                          {url.redirectURL.length > 50 
                            ? url.redirectURL.substring(0, 50) + '...'
                            : url.redirectURL}
                        </a>
                      </div>
                      
                      <div className="clicks-info">
                        <span className="clicks-count">{url.clicks}</span>
                        <span className="clicks-label">Clicks</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {urls.length === 0 && !success && (
            <div className="empty-state">
              <p>No URLs shortened yet. Create your first short URL above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;

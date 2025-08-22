import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  const languages = [
    'javascript', 'python', 'java', 'cpp', 'typescript',
    'ruby', 'go', 'rust', 'php', 'csharp'
  ];

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        setServerStatus('connected');
      } else {
        setServerStatus('error');
      }
    } catch (err) {
      setServerStatus('error');
    }
  };

  const analyzeCode = async () => {
    if (serverStatus !== 'connected') {
      setError('Server is not connected. Please ensure the backend is running.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/analyze-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language, code }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnalysis(data.analysis);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch' 
          ? 'Cannot connect to server. Please ensure the backend is running on port 3000.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>AI Code Review Assistant</h1>
      
      <div className="server-status">
        Status: {' '}
        <span className={`status-${serverStatus}`}>
          {serverStatus === 'checking' ? 'Checking server...' :
           serverStatus === 'connected' ? 'Connected' : 
           'Server not connected'}
        </span>
      </div>

      <div className="input-section">
        <div className="language-selector">
          <label htmlFor="language">Programming Language:</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className="code-input">
          <label htmlFor="code">Enter your code:</label>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            rows="10"
          />
        </div>

        <button 
          onClick={analyzeCode}
          disabled={loading || !code.trim()}
        >
          {loading ? 'Analyzing...' : 'Analyze Code'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {analysis && (
        <div className="analysis-results">
          <div className="result-section">
            <h3>Code Correctness</h3>
            <p>{analysis.correctness}</p>
          </div>

          <div className="result-section">
            <h3>Suggested Improvements</h3>
            <p>{analysis.improvements}</p>
          </div>

          <div className="result-section">
            <h3>Corrected Code</h3>
            <pre><code>{analysis.correctedCode}</code></pre>
          </div>

          <div className="result-section">
            <h3>Reasoning</h3>
            <p>{analysis.reasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
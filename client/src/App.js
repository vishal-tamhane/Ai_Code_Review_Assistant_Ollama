import React, { useState } from 'react';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnalysis('Analyzing your code...');

    try {
      const response = await fetch('http://localhost:3000/analyze-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language, code }),
      });

      const data = await response.json();

      if (data.error) {
        setAnalysis(`Error: ${data.error}`);
      } else {
        setAnalysis(data.analysis);
      }
      
    } catch (error) {
      setAnalysis('Failed to connect to backend server. Please check the console for details.');
      console.error('Frontend Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Ollama Code Assistant</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="language">Select Language:</label>
          <select 
            id="language" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="code">Enter your code:</label>
          <textarea
            id="code"
            rows="15"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your code here..."
          ></textarea>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Code'}
        </button>
      </form>
      <div className="response-container">
        <h3>Analysis:</h3>
        <pre>{analysis}</pre>
      </div>
    </div>
  );
}

export default App;
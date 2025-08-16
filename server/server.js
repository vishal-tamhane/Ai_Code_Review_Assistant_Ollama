const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests from the React frontend
app.use(bodyParser.json());

app.post('/analyze-code', async (req, res) => {
    const { language, code } = req.body;

    // Define the prompt for the LLM
    const prompt = `
        You are an AI code assistant. Your task is to analyze the following code snippet.
        Language: ${language}
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Please provide a detailed analysis.
        1. State clearly whether the code is correct.
        2. Suggest specific corrections and improvements for best practices.
        3. Provide the corrected code snippet directly.
        4. Explain the reasoning behind your suggestions.
    `;

    try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gemma:2b', // Replace with the name of your local model
                prompt: prompt,
                stream: false, // Set to true for streaming responses
            }),
        });

        const data = await ollamaResponse.json();
        if (data.error) {
            return res.status(500).json({ error: data.error });
        }

        res.json({ analysis: data.response });

    } catch (error) {
        console.error('Error connecting to Ollama:', error);
        res.status(500).json({ error: 'Could not connect to the Ollama server. Please ensure it is running.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
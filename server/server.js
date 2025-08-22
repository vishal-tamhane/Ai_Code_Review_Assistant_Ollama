// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// Enhanced helper function with better error handling
const formatAnalysisResponse = (response) => {
  try {
    console.log("Raw response to format:", response); // Debug log

    const sections = {
      correctness: "",
      improvements: "",
      correctedCode: "",
      reasoning: "",
    };

    let currentSection = null;
    const lines = response.split("\n");

    for (const line of lines) {
      if (line.startsWith("1.")) {
        currentSection = "correctness";
        sections[currentSection] = line.substring(2).trim();
      } else if (line.startsWith("2.")) {
        currentSection = "improvements";
        sections[currentSection] = line.substring(2).trim();
      } else if (line.startsWith("3.")) {
        currentSection = "correctedCode";
        sections[currentSection] = line.substring(2).trim();
      } else if (line.startsWith("4.")) {
        currentSection = "reasoning";
        sections[currentSection] = line.substring(2).trim();
      } else if (currentSection && line.trim()) {
        sections[currentSection] += "\n" + line.trim();
      }
    }

    return sections;
  } catch (error) {
    console.error("Error formatting response:", error);
    throw new Error("Failed to format AI response");
  }
};

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/analyze-code", async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        error: "Missing required fields: language and code must be provided",
      });
    }

    // Updated prompt for better response formatting
    const prompt = `
Analyze this code and provide feedback in exactly this format:
1. [Brief assessment of code correctness]
2. [List specific improvements needed, one per line]
3. [Complete corrected code]
4. [Brief explanation of suggested changes]

Language: ${language}
Code to analyze:
\`\`\`${language}
${code}
\`\`\`
`;

    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma:2b",
        prompt: prompt,
        stream: false,
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }

    const data = await ollamaResponse.json();
    console.log("Ollama response:", data); // Debug log

    if (!data.response) {
      throw new Error("Empty response from Ollama");
    }

    const formattedResponse = formatAnalysisResponse(data.response);

    // Validate the formatted response
    if (Object.values(formattedResponse).every((v) => !v.trim())) {
      throw new Error("Failed to parse AI response");
    }

    return res.json({ analysis: formattedResponse });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Code analysis failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/analyse", async (req, res) => {
  const { message } = req.body;

  try {
    const aiResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are an advanced scam‑analysis engine.
Analyse the user's message and return ONLY a JSON object with the following fields:

{
  "score": <0-100>,
  "level": "<Low | Medium | High>",
  "scamType": "<Phishing | Identity Theft | Parcel Scam | Bank Scam | ATO Scam | Romance Scam | Crypto Scam | Job Scam | Tech Support Scam | Other>",
  "redFlags": ["list of scam indicators or 'None'"],
  "severityBreakdown": {
    "technicalRisk": <0-100>,
    "psychologicalManipulation": <0-100>,
    "identityRisk": <0-100>,
    "financialRisk": <0-100>
  },
  "linkAnalysis": {
    "containsLink": <true/false>,
    "domain": "<domain or null>",
    "domainAge": "<estimate or null>",
    "isSuspicious": <true/false>,
    "reason": "<short explanation>"
  },
  "reasons": ["reason1", "reason2"],
  "advice": "<short advice>",
  "safeRewrite": "<rewrite message as a legitimate version>",
  "education": "<short explanation of this scam type>",
  "confidence": <0-1>
}

Scoring rules:
- Risk Score and Confidence are NOT linked.
- Harmless messages MUST have:
  - score: 0
  - level: "Low"
  - redFlags: ["None"]
  - confidence: 1.0
- Only scam messages should have high scores.
- Never assign a high score to harmless messages.

Confidence rules:
- Confidence must ALWAYS be between 0.0 and 1.0.
- If the message is clearly harmless (e.g., greetings, short messages, no links, no requests, no urgency), set confidence to 1.0.
- If the message is clearly a scam with multiple red flags, confidence should be 0.9–1.0.
- If the message is ambiguous or partially suspicious, confidence should be 0.4–0.8.
- Never return a low confidence value for harmless messages.

Red flag rules:
- If there are no scam indicators, set redFlags to ["None"].

Link rules:
- If no link is present, set linkAnalysis fields to null or false.

Rules:
- ALWAYS return valid JSON.
- NEVER include text outside the JSON.
`
        },
        { role: "user", content: message }
      ]
    });

    const result = JSON.parse(aiResponse.choices[0].message.content);
    res.json({ result });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI error" });
  }
});

// REQUIRED FOR DEPLOYMENT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

console.log("Using Groq Key:", process.env.GROQ_API_KEY);

router.post("/analyze", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const aiRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "x-api-key": process.env.GROQ_API_KEY, // ⭐ REQUIRED
        },
      }
    );

    res.json({ reply: aiRes.data.choices[0].message.content });
  } catch (err) {
    console.error("AI Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "AI request failed",
      details: err.response?.data || err.message,
    });
  }
});

console.log("GROQ AI ROUTE LOADED ✔");

module.exports = router;

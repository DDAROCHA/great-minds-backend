require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const connectDB = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// ROOT
// ===============================
app.get("/", (req, res) => {
  res.send("Great Minds backend is running");
});

// ===============================
// GET last 15 conversations
// ===============================
app.get("/api/conversations", async (req, res) => {
  try {
    const db = await connectDB();
    const conversations = await db
      .collection("conversations")
      .find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();

    res.json(conversations);
  } catch (err) {
    console.error("Error loading conversations:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

// ===============================
// SAVE conversation
// ===============================
app.post("/api/conversations", async (req, res) => {
  try {
    const { topic, messages } = req.body;

    if (!topic || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const db = await connectDB();

    const entry = {
      topic,
      messages,
      createdAt: new Date(),
    };

    await db.collection("conversations").insertOne(entry);

    // Keep last 15 only
    const count = await db.collection("conversations").countDocuments();
    if (count > 15) {
      const excess = count - 15;

      const oldest = await db
        .collection("conversations")
        .find({})
        .sort({ createdAt: 1 })
        .limit(excess)
        .toArray();

      const idsToDelete = oldest.map((x) => x._id);

      await db
        .collection("conversations")
        .deleteMany({ _id: { $in: idsToDelete } });
    }

    res.status(201).json(entry);
  } catch (err) {
    console.error("Error saving conversation:", err);
    res.status(500).json({ error: "Failed to save conversation" });
  }
});

// ===============================
// AI: GEMINI
// ===============================
app.post("/ai/gemini", async (req, res) => {
  try {
    const { topic, messages } = req.body;

    const last = messages?.[messages.length - 1]?.text || "Hello.";

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: `Topic: ${topic}\nMessage: ${last}` }],
        },
      ],
    };

    const result = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await result.json();

    // IMPORTANT: Return EMPTY STRING on failure.
    // Fallbacks MUST be handled in the FRONTEND.
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Gemini error" });
  }
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

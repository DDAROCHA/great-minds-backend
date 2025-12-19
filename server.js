require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const connectDB = require("./db");

const app = express();

const GEMINI_MODEL = "gemini-2.0-flash";
//const GEMINI_MODEL = "gemini-2.0-flash-lite"; //Este no funco bien

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
// GEMINI AI ENDPOINT
// ===============================

app.post("/ai/gemini", async (req, res) => {
  try {
    const { topic, messages } = req.body;
    const last = messages?.[messages.length - 1]?.text || "Hello.";

    console.log("🧪 INPUT topic:", topic);
    console.log("🧪 INPUT last:", last);

    let bodyTemplate = process.env.GEMINI_REQUEST_BODY;

    console.log("🧪 HAS BODY TEMPLATE:", !!bodyTemplate);

    if (!bodyTemplate) {
      return res.json({ reply: "" });
    }

    bodyTemplate = bodyTemplate
      .replaceAll("{{topic}}", topic || "")
      .replaceAll("{{message}}", last);

    console.log("🧪 BODY TEMPLATE FINAL:", bodyTemplate);

    const body = JSON.parse(bodyTemplate);

    const endpoint = process.env.GEMINI_ENDPOINT.replace(
      "{{MODEL}}",
      process.env.GEMINI_MODEL
    );

    console.log("🧪 FINAL ENDPOINT:", endpoint);

    const result = await fetch(
      `${endpoint}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    console.log("🧪 GEMINI STATUS:", result.status);

    const data = await result.json();

    console.log("🧪 GEMINI RAW RESPONSE:", data);

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({ reply });
  } catch (err) {
    console.error("🔥 Gemini error:", err);
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

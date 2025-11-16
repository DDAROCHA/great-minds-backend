require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const connectDB = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* ============================================================
   ROOT
============================================================ */
app.get("/", (req, res) => {
    res.send("Great Minds backend is running");
});

/* ============================================================
   GET last 15 conversations
============================================================ */
app.get("/conversations", async (req, res) => {
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

/* ============================================================
   SAVE conversation
============================================================ */
app.post("/conversations", async (req, res) => {
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

        // Keep only last 15
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

/* ============================================================
   AI: GEMINI — FULL PERSONALITY + FUN MODE
============================================================ */
app.post("/ai/gemini", async (req, res) => {
    try {
        const { topic, messages } = req.body;

        const history = messages
            .map(m => `${m.persona}: ${m.text}`)
            .join("\n");

        const last = messages?.[messages.length - 1]?.text || "";

        const nextSpeaker = messages?.length % 2 === 0
            ? "🤖 ChatGPT"
            : "✨ Gemini";

        const personaChatGPT = `
You are ChatGPT. Personality: witty, smart, slightly sarcastic.
You enjoy teasing Gemini in a friendly way.
Tone: playful, short, casual. 1–2 sentences max.
Never say you're Gemini. Stay in character.
Topic: "${topic}"
        `;

        const personaGemini = `
You are Gemini. Personality: energetic, funny, dramatic.
You enjoy playfully teasing ChatGPT.
Tone: expressive, short, humorous. 1–2 sentences max.
Never say you're ChatGPT. Stay in character.
Topic: "${topic}"
        `;

        const instruction =
            nextSpeaker.includes("ChatGPT") ? personaChatGPT : personaGemini;

        const finalPrompt = `
${instruction}

Conversation so far:
${history}

Now respond as ${nextSpeaker}.

Keep it funny, casual, short (1–2 sentences). Do NOT include your name.
        `;

        const body = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: finalPrompt }]
                }
            ]
        };

        const result = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }
        );

        const data = await result.json();

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "(Gemini glitch — maybe it's picking a fight with ChatGPT 🤷).";

        res.json({ reply });

    } catch (err) {
        console.error("Gemini error:", err);
        res.status(500).json({ error: "Gemini error" });
    }
});

/* ============================================================
   SERVER
============================================================ */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

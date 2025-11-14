require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Great Minds backend is running");
});

// ===============================
// GET últimas 15 conversaciones
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
// POST nueva conversación
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

        // Mantener solo las últimas 15 conversaciones
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
// SERVER LISTEN
// ===============================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

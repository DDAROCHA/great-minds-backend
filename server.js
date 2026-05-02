require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const OpenAI = require('openai');

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GEMINI_MODEL = 'gemini-2.0-flash';
//const GEMINI_MODEL = "gemini-2.0-flash-lite"; //Este no funco bien

app.use(cors());
app.use(express.json());

// ===============================
// ROOT
// ===============================
app.get('/', (req, res) => {
  res.send('Great Minds backend is running');
});

// ===============================
// GET last 15 conversations
// ===============================
app.get('/api/conversations', async (req, res) => {
  try {
    const db = await connectDB();
    const conversations = await db
      .collection('conversations')
      .find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();

    res.json(conversations);
  } catch (err) {
    console.error('Error loading conversations:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// ===============================
// SAVE conversation
// ===============================
app.post('/api/conversations', async (req, res) => {
  try {
    const { topic, messages } = req.body;

    if (!topic || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const db = await connectDB();

    const entry = {
      topic,
      messages,
      createdAt: new Date(),
    };

    await db.collection('conversations').insertOne(entry);

    // Keep last 15 only
    const count = await db.collection('conversations').countDocuments();
    if (count > 15) {
      const excess = count - 15;

      const oldest = await db
        .collection('conversations')
        .find({})
        .sort({ createdAt: 1 })
        .limit(excess)
        .toArray();

      const idsToDelete = oldest.map(x => x._id);

      await db.collection('conversations').deleteMany({ _id: { $in: idsToDelete } });
    }

    res.status(201).json(entry);
  } catch (err) {
    console.error('Error saving conversation:', err);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// ===============================
// AI - OpenAI
// ===============================
app.post('/ai/openai', async (req, res) => {
  try {
    const { topic, messages } = req.body;

    const last = messages?.[messages.length - 1]?.text || 'Hello.';

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL,
      input: `Topic: ${topic}\nMessage: ${last}`,
      max_output_tokens: 200,
    });

    const reply = response.output[0]?.content[0]?.text || '';

    res.json({ reply });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'OpenAI error' });
  }
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

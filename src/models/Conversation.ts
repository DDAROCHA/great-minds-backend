import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  persona: String,
  text: String,
  timestamp: Number,
});

const conversationSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Conversation", conversationSchema);

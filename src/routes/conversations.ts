import { Router, Request, Response } from "express";
import Conversation from "../models/Conversation";

const router = Router();

// GET → obtener las últimas 15 conversaciones
router.get("/", async (req: Request, res: Response) => {
  try {
    const conversations = await Conversation.find()
      .sort({ createdAt: -1 })
      .limit(15);

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Error fetching conversations" });
  }
});

// POST → guardar nueva conversación
router.post("/", async (req: Request, res: Response) => {
  try {
    const { topic, messages } = req.body;

    const conversation = new Conversation({
      topic,
      messages,
    });

    await conversation.save();

    // Mantener solo 15 conversaciones en DB
    const count = await Conversation.countDocuments();
    if (count > 15) {
      const overflow = count - 15;

      const oldest = await Conversation.find()
        .sort({ createdAt: 1 })
        .limit(overflow);

      const idsToDelete = oldest.map((c) => c._id);

      await Conversation.deleteMany({ _id: { $in: idsToDelete } });
    }

    res.status(201).json(conversation);
  } catch (err) {
    console.error("Error saving conversation:", err);
    res.status(500).json({ error: "Error saving conversation" });
  }
});

export default router;

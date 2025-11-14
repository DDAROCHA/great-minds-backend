import { Router, Request, Response } from "express";
import Conversation from "../models/Conversation";

const router = Router();

// Obtener las últimas 15 conversaciones
router.get("/", async (req: Request, res: Response) => {
  const conversations = await Conversation.find()
    .sort({ createdAt: -1 })
    .limit(15);
  res.json(conversations);
});

// Guardar una nueva conversación
router.post("/", async (req: Request, res: Response) => {
  const { topic, messages } = req.body;
  const conversation = new Conversation({ topic, messages });
  await conversation.save();

  // Mantener solo las últimas 15
  const count = await Conversation.countDocuments();
  if (count > 15) {
    const oldest = await Conversation.find().sort({ createdAt: 1 }).limit(count - 15);
    const idsToDelete = oldest.map((c) => c._id);
    await Conversation.deleteMany({ _id: { $in: idsToDelete } });
  }

  res.status(201).json(conversation);
});

export default router;

import express from "express";
import cors from "cors";
import { connectDB } from "./db";
import conversationsRouter from "./routes/conversations";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/conversations", conversationsRouter);

connectDB();

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

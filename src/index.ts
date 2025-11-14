import express, { Request, Response } from "express";
import cors from "cors";
import "./db";
import conversationRoutes from "./routes/conversations";

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/conversations", conversationRoutes);

// Ruta de prueba
app.get("/", (req: Request, res: Response) => {
  res.send("Backend funcionando correctamente 🚀");
});

// Puerto Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

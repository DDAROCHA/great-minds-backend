import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import conversationsRouter from "./routes/conversations";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------
// Conexión a MongoDB
// ---------------------------
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ ERROR: MONGO_URI no está definida en las variables de entorno");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => {
    console.error("Error conectando a MongoDB:", err);
    process.exit(1);
  });

// ---------------------------
// Rutas principales
// ---------------------------
app.use("/conversations", conversationsRouter);

// ---------------------------
// DEBUG: listar archivos del servidor
// ---------------------------
app.get("/debug/files", (req: Request, res: Response) => {
  function listDir(dir: string): any {
    const result: any = {};
    fs.readdirSync(dir).forEach((item) => {
      const full = path.join(dir, item);
      try {
        if (fs.statSync(full).isDirectory()) {
          result[item] = listDir(full);
        } else {
          result[item] = "file";
        }
      } catch (e) {
        result[item] = "unreadable";
      }
    });
    return result;
  }

  try {
    const tree = listDir(".");
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: "Error leyendo archivos", details: err });
  }
});

// ---------------------------
// DEBUG: ver variables de entorno
// ---------------------------
app.get("/debug/env", (req: Request, res: Response) => {
  const safeEnv = Object.fromEntries(
    Object.entries(process.env).map(([k, v]) => [k, k.includes("KEY") || k.includes("TOKEN") ? "***hidden***" : v])
  );

  res.json(safeEnv);
});

// ---------------------------
// Servidor
// ---------------------------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));

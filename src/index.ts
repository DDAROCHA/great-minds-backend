import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API funcionando");
});

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor escuchando en " + PORT));

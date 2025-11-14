import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("❌ ERROR: MONGO_URI no está definida.");
  process.exit(1);
}

export const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB conectado");
  } catch (err) {
    console.error("Error al conectar MongoDB:", err);
    process.exit(1);
  }
};

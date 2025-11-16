const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URL;

if (!uri) {
    console.error("❌ ERROR: Missing MONGO_URL environment variable");
    process.exit(1);
}

let db = null;
let client = null;

async function connectDB() {
    try {
        if (db) return db; // <- cached!

        client = new MongoClient(uri, {
            maxPoolSize: 10,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
        });

        await client.connect();
        console.log("✅ MongoDB connected");

        db = client.db("greatminds");
        return db;
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
        throw err;
    }
}

module.exports = connectDB;

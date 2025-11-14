const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URL;

if (!uri) {
    console.error("❌ ERROR: Missing MONGO_URL environment variable");
    process.exit(1);
}

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
});

async function connectDB() {
    try {
        if (!client.topology || !client.topology.isConnected()) {
            await client.connect();
            console.log("✅ MongoDB connected");
        }
        return client.db("greatminds"); // database name
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        throw err;
    }
}

module.exports = connectDB;

/* ==========================================================================
   MONGODB CONNECTION HELPER (mongodb.js)
   Uses native MongoDB Node.js driver.
   Reads MONGODB_URI from .env file.
   ========================================================================== */

const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeathon_db';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

let db = null;

// Connect once when the server starts
async function connectToDatabase() {
  if (db) return db;

  try {
    await client.connect();
    // Default to database name in URI or 'codeathon_db'
    db = client.db('codeathon_db');
    console.log(`🍃 MongoDB connected successfully to database: "${db.databaseName}"`);
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   ➜ Ensure MongoDB is running and check MONGODB_URI in backend/.env');
    throw err;
  }
}

// Get the active database instance
function getDb() {
  return db;
}

// Quick helper to grab any collection directly
function getCollection(name) {
  if (!db) {
    throw new Error('Database not connected. Please call connectToDatabase() first.');
  }
  return db.collection(name);
}

module.exports = { connectToDatabase, getDb, getCollection, ObjectId };
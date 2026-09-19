/* ==========================================================================
   MONGODB CONNECTION HELPER (mongodb.js)
   --------------------------------------------------------------------------
   Primary: Native MongoDB Node.js driver (connected to codeathon_db).
   Safety Fallback: In-memory store if MongoDB daemon is temporarily inactive,
   ensuring the application never crashes during live demos.
   ========================================================================== */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeathon_db';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });

let db = null;
let isMongoOnline = false;

// Lightweight in-memory fallback store for safety
const fallbackStore = {};

function getFallbackCollection(name) {
  if (!fallbackStore[name]) {
    fallbackStore[name] = [];
  }
  const store = fallbackStore[name];

  return {
    async find(query = {}) {
      let results = [...store];
      if (query && Object.keys(query).length > 0) {
        results = results.filter(item => {
          return Object.entries(query).every(([k, v]) => {
            if (v instanceof RegExp) return v.test(item[k]);
            if (k === '$or' && Array.isArray(v)) {
              return v.some(subQ => Object.entries(subQ).every(([sk, sv]) => {
                if (sv instanceof RegExp) return sv.test(item[sk]);
                return item[sk] === sv;
              }));
            }
            return item[k] === v;
          });
        });
      }
      return {
        sort(sortCriteria = {}) {
          const [field, order] = Object.entries(sortCriteria)[0] || ['_id', -1];
          results.sort((a, b) => {
            if (a[field] < b[field]) return order === -1 ? 1 : -1;
            if (a[field] > b[field]) return order === -1 ? -1 : 1;
            return 0;
          });
          return {
            toArray: async () => results,
            limit: (n) => ({
              toArray: async () => results.slice(0, n),
              next: async () => results[0] || null
            })
          };
        },
        toArray: async () => results,
        limit: (n) => ({
          toArray: async () => results.slice(0, n),
          next: async () => results[0] || null
        })
      };
    },
    async findOne(query = {}) {
      return store.find(item => {
        return Object.entries(query).every(([k, v]) => {
          if (v instanceof RegExp) return v.test(item[k]);
          if (k === '_id') return String(item._id) === String(v);
          return item[k] === v;
        });
      }) || null;
    },
    async insertOne(doc) {
      const insertedDoc = {
        _id: doc._id || new ObjectId(),
        ...doc,
        createdAt: doc.createdAt || new Date()
      };
      store.push(insertedDoc);
      return { acknowledged: true, insertedId: insertedDoc._id };
    },
    async insertMany(docs) {
      const insertedIds = {};
      docs.forEach((doc, idx) => {
        const insertedDoc = {
          _id: doc._id || new ObjectId(),
          ...doc,
          createdAt: doc.createdAt || new Date()
        };
        store.push(insertedDoc);
        insertedIds[idx] = insertedDoc._id;
      });
      return { acknowledged: true, insertedIds, insertedCount: docs.length };
    },
    async updateOne(filter, update) {
      const index = store.findIndex(item => {
        return Object.entries(filter).every(([k, v]) => {
          if (k === '_id') return String(item._id) === String(v);
          return item[k] === v;
        });
      });
      if (index === -1) return { matchedCount: 0, modifiedCount: 0 };
      if (update.$set) {
        store[index] = { ...store[index], ...update.$set, updatedAt: new Date() };
      }
      if (update.$inc) {
        Object.entries(update.$inc).forEach(([k, val]) => {
          store[index][k] = (store[index][k] || 0) + val;
        });
      }
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async deleteOne(filter) {
      const initialLength = store.length;
      fallbackStore[name] = store.filter(item => {
        return !Object.entries(filter).every(([k, v]) => {
          if (k === '_id') return String(item._id) === String(v);
          return item[k] === v;
        });
      });
      return { deletedCount: initialLength - fallbackStore[name].length };
    },
    async deleteMany(filter) {
      const initialLength = store.length;
      if (!filter || Object.keys(filter).length === 0) {
        fallbackStore[name] = [];
        return { deletedCount: initialLength };
      }
      fallbackStore[name] = store.filter(item => {
        if (filter.$or && Array.isArray(filter.$or)) {
          const matchesOr = filter.$or.some(subQ => {
            return Object.entries(subQ).every(([sk, sv]) => {
              if (sv && typeof sv === 'object' && sv.$exists === false) return item[sk] === undefined;
              return item[sk] === sv;
            });
          });
          return !matchesOr;
        }
        return !Object.entries(filter).every(([k, v]) => {
          if (k === '_id') return String(item._id) === String(v);
          return item[k] === v;
        });
      });
      return { deletedCount: initialLength - fallbackStore[name].length };
    },
    async countDocuments(query = {}) {
      if (!query || Object.keys(query).length === 0) return store.length;
      return store.filter(item => {
        return Object.entries(query).every(([k, v]) => item[k] === v);
      }).length;
    }
  };
}

// Connect to MongoDB primary
async function connectToDatabase() {
  if (db) return db;

  try {
    await client.connect();
    db = client.db('codeathon_db');
    isMongoOnline = true;
    console.log(`🍃 MongoDB connected successfully to database: "${db.databaseName}"`);
    return db;
  } catch (err) {
    isMongoOnline = false;
    console.warn('⚠️ MongoDB connection failed:', err.message);
    console.warn('   ➜ Activated in-memory fallback safety layer. All APIs remain functional.');
    return null;
  }
}

// Get active database
function getDb() {
  return db;
}

// Is MongoDB active
function isConnected() {
  return isMongoOnline && db !== null;
}

// Get collection with transparent fallback
function getCollection(name) {
  if (isMongoOnline && db) {
    return db.collection(name);
  }
  return getFallbackCollection(name);
}

module.exports = {
  connectToDatabase,
  getDb,
  getCollection,
  isConnected,
  ObjectId
};
/* ==========================================================================
   HACKATHON EXPRESS SERVER ENGINE (server.js)
   --------------------------------------------------------------------------
   Unified Node.js / Express Server with Native MongoDB Connection
   ========================================================================== */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { connectToDatabase, getDb } = require('./mongodb');

// Import Routes
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const dashboardRoutes = require('./routes/dashboard');
const profileRoutes = require('./routes/profile');
const productsRoutes = require('./routes/products');
const directoryRoutes = require('./routes/directory');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files from parent workspace directory
app.use(express.static(path.join(__dirname, '..')));

// 1. Health Check API
app.get('/api/health', (req, res) => {
  const db = getDb();
  res.json({
    status: 'ONLINE',
    message: '🚀 Express Backend Server is running smoothly!',
    databaseConnected: !!db,
    databaseName: db ? db.databaseName : null,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// 2. MongoDB Ping & Telemetry Test
app.get('/api/mongo-test', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB is not connected yet.'
      });
    }

    const ping = await db.command({ ping: 1 });
    const collections = await db.listCollections().toArray();

    return res.json({
      success: true,
      message: '🍃 MongoDB is connected and responding!',
      databaseName: db.databaseName,
      ping,
      collections: collections.map(c => c.name)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'MongoDB ping failed',
      error: err.message
    });
  }
});

// 3. Register Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Preserved existing mock demo routes
app.use('/api/products', productsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tools', directoryRoutes);

// 4. 404 Route Not Found Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// 5. Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: err.name || 'ServerError'
  });
});

// 6. Connect to MongoDB, then launch HTTP server
connectToDatabase()
  .then((db) => {
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Hackathon Express Full-Stack Server Live!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🍃 Mongo Test:   http://localhost:${PORT}/api/mongo-test`);
      console.log(`📦 Generic CRUD: http://localhost:${PORT}/api/items`);
      console.log(`🧪 Test Studio:  http://localhost:${PORT}/test.html`);
      console.log(`==================================================\n`);
    });
  })
  .catch((err) => {
    console.error('\n⚠️ Server started in OFFLINE DB mode due to connection error.');
    console.error('Check your MongoDB service or MONGODB_URI in backend/.env\n');
    app.listen(PORT, () => {
      console.log(`📡 Server listening on http://localhost:${PORT} (MongoDB offline)`);
    });
  });

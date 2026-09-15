/* ==========================================================================
   HACKATHON EXPRESS SERVER ENGINE (server.js)
   Zero-Config Single File Express Server pairing 1-to-1 with Hackathon UI
   ========================================================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const productsRoutes = require('./routes/products');
const dashboardRoutes = require('./routes/dashboard');
const directoryRoutes = require('./routes/directory');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    message: '🚀 Hackathon Express Backend Server is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tools', directoryRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Hackathon Express Backend Server Live!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================\n`);
});

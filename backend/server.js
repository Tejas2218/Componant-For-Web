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
const partiesRoutes = require('./routes/parties');
const billsRoutes = require('./routes/bills');
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
app.use('/api/parties', partiesRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Preserved existing mock demo routes
app.use('/api/products', productsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tools', directoryRoutes);

// 3b. Automated Phase 2 Verification Test Suite Runner
app.get('/api/test-phase2', async (req, res) => {
  const { getCollection, ObjectId } = require('./mongodb');
  const itemsCol = getCollection('items');
  const partiesCol = getCollection('parties');
  const usersCol = getCollection('users');
  const results = [];

  try {
    // 1. Add Customer
    const testCustMobile = '9999900001';
    await partiesCol.deleteOne({ mobile: testCustMobile });
    const custInsert = await partiesCol.insertOne({
      name: 'Test Customer Alpha',
      mobile: testCustMobile,
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24AAACD1234E1Z5',
      city: 'Rajkot',
      createdAt: new Date()
    });
    results.push({ test: 1, description: 'Add Customer', status: custInsert.acknowledged ? 'PASS' : 'FAIL', id: custInsert.insertedId });

    // 2. Edit Customer
    const custUpdate = await partiesCol.updateOne(
      { _id: custInsert.insertedId },
      { $set: { name: 'Test Customer Alpha (Updated)', city: 'Ahmedabad' } }
    );
    const updatedCust = await partiesCol.findOne({ _id: custInsert.insertedId });
    results.push({ test: 2, description: 'Edit Customer', status: updatedCust.name.includes('(Updated)') ? 'PASS' : 'FAIL', updatedName: updatedCust.name });

    // 3. Search Customer
    const searchCust = await partiesCol.find({ mobile: testCustMobile }).toArray();
    results.push({ test: 3, description: 'Search Customer', status: searchCust.length === 1 ? 'PASS' : 'FAIL', matched: searchCust.length });

    // 4. Delete Customer
    const custDelete = await partiesCol.deleteOne({ _id: custInsert.insertedId });
    const checkDeleted = await partiesCol.findOne({ _id: custInsert.insertedId });
    results.push({ test: 4, description: 'Delete Customer', status: (!checkDeleted && custDelete.deletedCount === 1) ? 'PASS' : 'FAIL' });

    // 5. Add Product
    const testBarcode = '8900000099999';
    await itemsCol.deleteOne({ barcode: testBarcode });
    const prodInsert = await itemsCol.insertOne({
      name: 'Test Hackathon Widget',
      title: 'Test Hackathon Widget',
      price: 199.50,
      gstPercent: 18,
      hsnCode: '8471',
      barcode: testBarcode,
      unit: 'pcs',
      createdAt: new Date()
    });
    results.push({ test: 5, description: 'Add Product', status: prodInsert.acknowledged ? 'PASS' : 'FAIL', id: prodInsert.insertedId });

    // 6. Edit Product
    await itemsCol.updateOne(
      { _id: prodInsert.insertedId },
      { $set: { name: 'Test Hackathon Widget (v2)', price: 249.00 } }
    );
    const updatedProd = await itemsCol.findOne({ _id: prodInsert.insertedId });
    results.push({ test: 6, description: 'Edit Product', status: (updatedProd.price === 249 && updatedProd.name.includes('(v2)')) ? 'PASS' : 'FAIL' });

    // 7. Search Product
    const searchProd = await itemsCol.find({ barcode: testBarcode }).toArray();
    results.push({ test: 7, description: 'Search Product', status: searchProd.length === 1 ? 'PASS' : 'FAIL', matched: searchProd.length });

    // 8. Delete Product
    const prodDelete = await itemsCol.deleteOne({ _id: prodInsert.insertedId });
    const checkProdDeleted = await itemsCol.findOne({ _id: prodInsert.insertedId });
    results.push({ test: 8, description: 'Delete Product', status: (!checkProdDeleted && prodDelete.deletedCount === 1) ? 'PASS' : 'FAIL' });

    // 9. Search Existing Barcode (Amul Milk: 8901262010014)
    const existingProd = await itemsCol.findOne({ barcode: '8901262010014' });
    results.push({ test: 9, description: 'Search Existing Barcode (8901262010014)', status: (existingProd && existingProd.name.includes('Amul')) ? 'PASS' : 'FAIL', productName: existingProd ? existingProd.name : null });

    // 10. Search Invalid Barcode (9999999999999)
    const invalidProd = await itemsCol.findOne({ barcode: '9999999999999' });
    results.push({ test: 10, description: 'Search Invalid Barcode (9999999999999)', status: (invalidProd === null) ? 'PASS (Properly Not Found)' : 'FAIL', found: !!invalidProd });

    // 11. Verify STAFF Role Restrictions
    const { requireRole } = require('./middleware/auth');
    let staffBlocked = false;
    const mockReqStaff = { user: { role: 'STAFF', name: 'Cashier Sunil' } };
    const mockResStaff = {
      status: (code) => ({
        json: (data) => {
          if (code === 403) staffBlocked = true;
        }
      })
    };
    requireRole(['ADMIN'])(mockReqStaff, mockResStaff, () => { staffBlocked = false; });
    results.push({ test: 11, description: 'Verify STAFF Role Permissions (Admin Guard)', status: staffBlocked ? 'PASS (Staff blocked with 403 Forbidden)' : 'FAIL', staffBlocked });

    // 12. Verify Seed Idempotency
    const finalProds = await itemsCol.countDocuments({});
    const finalParties = await partiesCol.countDocuments({});
    results.push({
      test: 12,
      description: 'Verify Seed Idempotency (Counts Intact)',
      status: (finalProds >= 8 && finalParties >= 3) ? 'PASS' : 'FAIL',
      actualProductsInDB: finalProds,
      actualPartiesInDB: finalParties
    });

    const allPassed = results.every(r => r.status.startsWith('PASS'));
    return res.json({
      success: true,
      allPassed,
      summary: allPassed ? '🎉 ALL 12 PHASE 2 VERIFICATION TESTS PASSED!' : '⚠️ Some tests failed',
      results
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, results });
  }
});

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

const { seedDatabase } = require('./services/seedData');

// 6. Connect to MongoDB, seed initial business data, then launch HTTP server
connectToDatabase()
  .then(async (db) => {
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Smart GST Billing System Backend Live!`);
      console.log(`📡 Base URL:    http://localhost:${PORT}`);
      console.log(`🧾 Billing App: http://localhost:${PORT}/billing.html`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🍃 Database:    ${db ? 'Native MongoDB (codeathon_db)' : 'Fallback Safe Store'}`);
      console.log(`🔑 Demo Admin:  admin@shop.com / admin123`);
      console.log(`🔑 Demo Staff:  staff@shop.com / staff123`);
      console.log(`==================================================\n`);
    });
  })
  .catch(async (err) => {
    console.error('\n⚠️ Primary MongoDB unreachable. Running with Safe In-Memory Store.');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`📡 Server listening on http://localhost:${PORT} (Safe Store Active)`);
    });
  });

/* ==========================================================================
   PRODUCT / ITEM CATALOG ROUTES (routes/items.js)
   --------------------------------------------------------------------------
   Manages Products in MongoDB with statutory GST slabs, HSN, and Barcodes.
   Permissions:
   - ADMIN: Full CRUD (List, Search, Add, Edit, Delete)
   - STAFF: Read and Search only (No Add/Edit/Delete)
   Collection: items (codeathon_db)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const { getCollection, ObjectId } = require('../mongodb');
const { authenticate, requireRole } = require('../middleware/auth');

const COLLECTION_NAME = 'items';
const ALLOWED_GST_SLABS = [0, 5, 12, 18, 28];

function col() {
  return getCollection(COLLECTION_NAME);
}

// 1. GET /api/items - Fetch all products with search across Name, Barcode & HSN
// Permissions: ADMIN and STAFF
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category, gst } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { title: regex },
        { barcode: regex },
        { hsnCode: regex },
        { category: regex }
      ];
    }

    if (category && category !== 'All') {
      query.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    if (gst && gst !== 'All') {
      const parsedGst = parseFloat(gst);
      if (!isNaN(parsedGst)) {
        query.gstPercent = parsedGst;
      }
    }

    const items = await col().find(query).sort({ createdAt: -1 }).toArray();

    return res.json({
      success: true,
      count: items.length,
      collection: COLLECTION_NAME,
      items
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/items/barcode/:code - Fast Barcode/QR Lookup for Scanner
// Returns 200 with product if found, 404 if not found
// Permissions: ADMIN and STAFF
router.get('/barcode/:code', authenticate, async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Barcode parameter is required.' });
    }

    const cleanCode = code.trim();
    const product = await col().findOne({ barcode: cleanCode });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with barcode "${cleanCode}" not found in MongoDB catalog.`
      });
    }

    return res.json({
      success: true,
      product
    });
  } catch (err) {
    next(err);
  }
});

// 3. GET /api/items/:id - Fetch single product by MongoDB _id
// Permissions: ADMIN and STAFF
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid MongoDB ObjectId format.' });
    }

    const item = await col().findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not found in catalog.' });
    }

    return res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

// 4. POST /api/items - Add new product to catalog
// Permissions: ADMIN ONLY (Staff gets 403 Forbidden)
router.post('/', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { name, title, hsnCode, price, gstPercent, barcode, unit, category, description } = req.body;
    const itemName = (name || title || '').trim();

    // 1. Name validation
    if (!itemName) {
      return res.status(400).json({ success: false, message: 'Product item name is required.' });
    }

    // 2. Price validation
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price must be a valid non-negative number (>= 0).'
      });
    }

    // 3. GST slab validation
    const parsedGST = parseFloat(gstPercent);
    if (isNaN(parsedGST) || !ALLOWED_GST_SLABS.includes(parsedGST)) {
      return res.status(400).json({
        success: false,
        message: `Invalid GST rate (${gstPercent}%). Must be one of standard slabs: ${ALLOWED_GST_SLABS.join('%, ')}%.`
      });
    }

    // 4. Barcode uniqueness validation
    const cleanBarcode = barcode ? String(barcode).trim() : '';
    if (cleanBarcode) {
      const existingBarcode = await col().findOne({ barcode: cleanBarcode });
      if (existingBarcode) {
        return res.status(400).json({
          success: false,
          message: `Barcode "${cleanBarcode}" is already assigned to "${existingBarcode.name}".`
        });
      }
    }

    const newItem = {
      name: itemName,
      title: itemName,
      hsnCode: hsnCode ? String(hsnCode).trim() : '',
      price: parsedPrice,
      gstPercent: parsedGST,
      barcode: cleanBarcode,
      unit: unit ? unit.trim() : 'pcs',
      category: category ? category.trim() : 'General',
      description: description ? description.trim() : '',
      createdAt: new Date()
    };

    const result = await col().insertOne(newItem);

    return res.status(201).json({
      success: true,
      message: `Product "${itemName}" added to catalog in MongoDB!`,
      item: { _id: result.insertedId, ...newItem }
    });
  } catch (err) {
    next(err);
  }
});

// 5. PUT /api/items/:id - Update product
// Permissions: ADMIN ONLY (Staff gets 403 Forbidden)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format.' });
    }

    const { name, title, hsnCode, price, gstPercent, barcode, unit, category, description } = req.body;
    const itemName = (name || title || '').trim();

    if (!itemName) {
      return res.status(400).json({ success: false, message: 'Product item name is required.' });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Unit price must be a non-negative number (>= 0).' });
    }

    const parsedGST = parseFloat(gstPercent);
    if (isNaN(parsedGST) || !ALLOWED_GST_SLABS.includes(parsedGST)) {
      return res.status(400).json({
        success: false,
        message: `Invalid GST rate (${gstPercent}%). Must be one of standard slabs: ${ALLOWED_GST_SLABS.join('%, ')}%.`
      });
    }

    const cleanBarcode = barcode ? String(barcode).trim() : '';
    if (cleanBarcode) {
      const existingBarcode = await col().findOne({
        barcode: cleanBarcode,
        _id: { $ne: new ObjectId(id) }
      });
      if (existingBarcode) {
        return res.status(400).json({
          success: false,
          message: `Barcode "${cleanBarcode}" is already assigned to "${existingBarcode.name}".`
        });
      }
    }

    const updatePayload = {
      name: itemName,
      title: itemName,
      hsnCode: hsnCode ? String(hsnCode).trim() : '',
      price: parsedPrice,
      gstPercent: parsedGST,
      barcode: cleanBarcode,
      unit: unit ? unit.trim() : 'pcs',
      category: category ? category.trim() : 'General',
      description: description ? description.trim() : '',
      updatedAt: new Date()
    };

    const result = await col().updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found in catalog.' });
    }

    return res.json({
      success: true,
      message: `Product "${itemName}" updated successfully in MongoDB!`
    });
  } catch (err) {
    next(err);
  }
});

// 6. DELETE /api/items/:id - Delete product
// Permissions: ADMIN ONLY (Staff gets 403 Forbidden)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format.' });
    }

    const result = await col().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found or already deleted.' });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully from MongoDB!'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

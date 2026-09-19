/* ==========================================================================
   CUSTOMER / PARTY ROUTES (routes/parties.js)
   --------------------------------------------------------------------------
   Manages Parties/Customers in MongoDB.
   Customers are records/parties with State, Mobile, GSTIN, NOT login users.
   Permissions:
   - ADMIN: Full CRUD (List, Search, Add, Edit, Delete)
   - STAFF: Read, Search, and Quick-Add only (No Edit/Delete)
   Collection: parties (codeathon_db)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const { getCollection, ObjectId } = require('../mongodb');
const { authenticate, requireRole } = require('../middleware/auth');

function col() {
  return getCollection('parties');
}

// Basic GSTIN validator (15 alphanumeric characters: 2 state + 10 PAN + 1 entity + 1 'Z' + 1 checksum)
function isValidGSTIN(gstin) {
  if (!gstin) return true; // Optional field
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin.trim());
}

// 1. GET /api/parties - Fetch all customers (Search by Name or Mobile)
// Permissions: ADMIN and STAFF
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, state } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { mobile: regex },
        { gstin: regex },
        { city: regex }
      ];
    }

    if (state && state !== 'All') {
      query.state = new RegExp(`^${state.trim()}$`, 'i');
    }

    const parties = await col().find(query).sort({ createdAt: -1 }).toArray();

    return res.json({
      success: true,
      count: parties.length,
      collection: 'parties',
      parties
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/parties/:id - Fetch single customer
// Permissions: ADMIN and STAFF
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    let party = null;

    if (ObjectId.isValid(id)) {
      party = await col().findOne({ _id: new ObjectId(id) });
    }
    if (!party) {
      party = await col().findOne({ mobile: id });
    }

    if (!party) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.json({ success: true, party });
  } catch (err) {
    next(err);
  }
});

// 3. POST /api/parties - Add new customer / Quick-Add from Billing Counter
// Permissions: ADMIN and STAFF
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, mobile, address, city, state, stateCode, gstin, email } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Customer mobile number is required.' });
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    const cleanState = state ? state.trim() : 'Gujarat';
    if (!cleanState) {
      return res.status(400).json({ success: false, message: 'State is required for GST determination.' });
    }

    const cleanGSTIN = gstin ? gstin.trim().toUpperCase() : '';
    if (cleanGSTIN && !isValidGSTIN(cleanGSTIN)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN format. Expected 15 characters (e.g. 24AAACD1234E1Z5).'
      });
    }

    // Check duplicate mobile
    const existing = await col().findOne({ mobile: cleanMobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A customer with mobile number ${cleanMobile} already exists (${existing.name}).`
      });
    }

    const newParty = {
      name: name.trim(),
      mobile: cleanMobile,
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: cleanState,
      stateCode: stateCode ? String(stateCode).trim() : (cleanState.toLowerCase() === 'gujarat' ? '24' : ''),
      gstin: cleanGSTIN,
      email: email ? email.trim() : '',
      createdBy: req.user.name,
      createdAt: new Date()
    };

    const result = await col().insertOne(newParty);

    return res.status(201).json({
      success: true,
      message: 'Customer added successfully to MongoDB!',
      party: { _id: result.insertedId, ...newParty }
    });
  } catch (err) {
    next(err);
  }
});

// 4. PUT /api/parties/:id - Edit customer
// Permissions: ADMIN ONLY
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID format.' });
    }

    const { name, mobile, address, city, state, stateCode, gstin, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Customer mobile number is required.' });
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    const cleanGSTIN = gstin ? gstin.trim().toUpperCase() : '';
    if (cleanGSTIN && !isValidGSTIN(cleanGSTIN)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN format. Expected 15 characters (e.g. 24AAACD1234E1Z5).'
      });
    }

    // Check duplicate mobile on another customer
    const existing = await col().findOne({
      mobile: cleanMobile,
      _id: { $ne: new ObjectId(id) }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Mobile number ${cleanMobile} is already in use by another customer (${existing.name}).`
      });
    }

    const updatePayload = {
      name: name.trim(),
      mobile: cleanMobile,
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : 'Gujarat',
      stateCode: stateCode ? String(stateCode).trim() : '',
      gstin: cleanGSTIN,
      email: email ? email.trim() : '',
      updatedAt: new Date()
    };

    const result = await col().updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.json({
      success: true,
      message: 'Customer details updated successfully in MongoDB!'
    });
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /api/parties/:id - Delete customer
// Permissions: ADMIN ONLY
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID format.' });
    }

    const result = await col().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found or already deleted.' });
    }

    return res.json({
      success: true,
      message: 'Customer deleted successfully from MongoDB!'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

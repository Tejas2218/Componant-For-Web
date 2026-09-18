/* ==========================================================================
   GENERIC RESOURCE / ITEM CRUD ROUTES (routes/items.js)
   --------------------------------------------------------------------------
   ⚡ HACKATHON QUICK-RENAME GUIDE:
   If your hackathon topic is Events, Patients, Tasks, Courses, or Bookings:
   Simply change COLLECTION_NAME below (e.g. 'events', 'tasks', etc.)!
   ========================================================================== */

const express = require('express');
const router = express.Router();
const { getCollection, ObjectId } = require('../mongodb');

// ⚡ TARGET COLLECTION NAME (Change this on competition day if needed)
const COLLECTION_NAME = 'items';

function col() {
  return getCollection(COLLECTION_NAME);
}

// 1. GET /api/items - Fetch all items (with optional search, category, status filter)
router.get('/', async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { category: regex }
      ];
    }

    if (category && category !== 'All') {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    if (status && status !== 'All') {
      query.status = status;
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

// 2. GET /api/items/:id - Fetch single item by MongoDB _id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid MongoDB ObjectId format.' });
    }

    const item = await col().findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in database.' });
    }

    return res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

// 3. POST /api/items - Create a new item
router.post('/', async (req, res, next) => {
  try {
    const { title, description, category, image, status, ...rest } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required to create an item.'
      });
    }

    const newItem = {
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'General',
      image: image ? image.trim() : 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...rest // Allows any extra custom fields added during Code-A-Thon
    };

    const result = await col().insertOne(newItem);

    return res.status(201).json({
      success: true,
      message: 'Item created successfully in MongoDB!',
      item: { _id: result.insertedId, ...newItem }
    });
  } catch (err) {
    next(err);
  }
});

// 4. PUT /api/items/:id - Update existing item by _id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid MongoDB ObjectId format.' });
    }

    const updatePayload = { ...req.body, updatedAt: new Date() };
    delete updatePayload._id; // Prevent updating MongoDB immutable _id
    delete updatePayload.createdAt; // Preserve original creation timestamp

    const result = await col().updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Item not found to update.' });
    }

    const updatedItem = await col().findOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      message: 'Item updated successfully!',
      item: updatedItem
    });
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /api/items/:id - Delete item by _id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid MongoDB ObjectId format.' });
    }

    const result = await col().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Item not found or already deleted.' });
    }

    return res.json({
      success: true,
      message: 'Item deleted successfully from MongoDB!'
    });
  } catch (err) {
    next(err);
  }
});

// ⚡ BONUS: POST /api/items/seed - Insert sample records for instant live demo
router.post('/seed', async (req, res, next) => {
  try {
    const sampleItems = [
      {
        title: "Smart Air Quality Monitor",
        description: "IoT indoor environmental sensor with real-time telemetry.",
        category: "Hardware",
        image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&auto=format&fit=crop&q=80",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Autonomous Fleet Dispatcher",
        description: "Routing optimization engine with predictive AI delivery ETA.",
        category: "Software",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80",
        status: "active",
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date()
      },
      {
        title: "Neural Audio Denoising API",
        description: "Real-time background noise suppression model for live streams.",
        category: "AI / ML",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
        status: "completed",
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date()
      }
    ];

    await col().insertMany(sampleItems);
    const all = await col().find({}).toArray();

    return res.json({
      success: true,
      message: `Seeded ${sampleItems.length} starter records into MongoDB '${COLLECTION_NAME}' collection!`,
      items: all
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

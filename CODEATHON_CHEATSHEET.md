# ⚡ Code-A-Thon Rapid Deployment Cheatsheet

Your fast-reference survival guide for building and submitting your full-stack app in **3.5 hours**.

---

## A. How to Start the Project

### 1. Launch the Backend
Open a terminal in the `backend/` folder:
```bash
cd backend
npm start
```
*(Or use auto-reload during development: `npm run dev`)*

Backend will start on: **`http://localhost:5000`**

### 2. Launch the Frontend
You can open the app in two ways:
- **Direct in browser**: Double-click `test.html` or `index.html` or open via VSCode Live Server.
- **Via Express server**: Visit **`http://localhost:5000/test.html`** or **`http://localhost:5000/index.html`** in your browser.

---

## B. Where MongoDB Connection is Configured

- **Environment File**: `backend/.env`
  ```env
  PORT=5000
  MONGODB_URI=mongodb://localhost:27017/codeathon_db
  ```
- **Connection Helper**: `backend/mongodb.js`
  - Database name is set to `codeathon_db`.
  - To change database name or use MongoDB Atlas: simply update `MONGODB_URI` in `backend/.env`.

---

## C. How to Change "items" to Your Assigned Topic in 60 Seconds

Suppose your Code-A-Thon topic is **"Campus Events"**:

### Step 1: In `backend/routes/items.js`
Change line 11:
```javascript
// BEFORE:
const COLLECTION_NAME = 'items';

// AFTER:
const COLLECTION_NAME = 'events';
```

### Step 2: In `test.html` or your chosen component
Change field labels from `Title` / `Category` to your entity fields:
- For Events: `event_name`, `date`, `venue`, `ticket_price`
- For Hospital/Patients: `patient_name`, `age`, `doctor`, `room_number`
- For Tasks: `task_title`, `priority`, `assigned_to`, `deadline`

*(Because MongoDB is schema-less, any extra fields you send from `api.post('/items', {...})` are automatically saved!)*

---

## D. How to Add a New API Route

Create a new file `backend/routes/orders.js`:
```javascript
const express = require('express');
const router = express.Router();
const { getCollection } = require('../mongodb');

router.get('/', async (req, res, next) => {
  try {
    const orders = await getCollection('orders').find({}).toArray();
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

Mount it in `backend/server.js`:
```javascript
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);
```

---

## E. How to Call the API from Frontend

Include `js/api.js` and `js/hackathon-ui.js` in your HTML:
```html
<script src="js/hackathon-ui.js"></script>
<script src="js/api.js"></script>
```

Then use the clean, promise-based `api` helper:

### 1. Read (GET)
```javascript
async function loadData() {
  try {
    const res = await api.get('/items');
    console.log('Items from MongoDB:', res.items);
  } catch (err) {
    Toast.show({ title: 'Error', message: err.message, type: 'danger' });
  }
}
```

### 2. Create (POST)
```javascript
async function createRecord() {
  try {
    const res = await api.post('/items', {
      title: 'Hackathon Final Presentation',
      category: 'Stage 1',
      status: 'active'
    });
    Toast.show({ title: 'Success', message: res.message, type: 'success' });
  } catch (err) {
    Toast.show({ title: 'Error', message: err.message, type: 'danger' });
  }
}
```

### 3. Update (PUT)
```javascript
await api.put(`/items/${id}`, { status: 'completed' });
```

### 4. Delete (DELETE)
```javascript
await api.delete(`/items/${id}`);
```

---

## F. Common MongoDB Native CRUD Snippets

In any route using `{ getCollection, ObjectId } = require('../mongodb')`:

```javascript
const col = getCollection('my_collection');

// 1. Find all sorted newest first
const list = await col.find({}).sort({ createdAt: -1 }).toArray();

// 2. Search by keyword
const results = await col.find({
  title: { $regex: 'searchKeyword', $options: 'i' }
}).toArray();

// 3. Find one by ID
const item = await col.findOne({ _id: new ObjectId(id) });

// 4. Insert one document
const result = await col.insertOne({ name: 'Alpha', createdAt: new Date() });

// 5. Update one document
await col.updateOne(
  { _id: new ObjectId(id) },
  { $set: { status: 'approved', updatedAt: new Date() } }
);

// 6. Delete one document
await col.deleteOne({ _id: new ObjectId(id) });

// 7. Count documents
const total = await col.countDocuments({ status: 'active' });
```

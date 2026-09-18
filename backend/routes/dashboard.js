/* ==========================================================================
   DASHBOARD & TELEMETRY ROUTES (routes/dashboard.js)
   --------------------------------------------------------------------------
   Dynamic statistics aggregated directly from live MongoDB collections
   ========================================================================== */

const express = require('express');
const router = express.Router();
const { getCollection } = require('../mongodb');
const db = require('../db'); // preserved fallback for kanban mock demo

// 1. GET /api/dashboard/stats - Real-time telemetry from MongoDB
router.get('/stats', async (req, res, next) => {
  try {
    const itemsCol = getCollection('items');
    const usersCol = getCollection('users');

    const [totalItems, totalUsers, activeItems, recentItems] = await Promise.all([
      itemsCol.countDocuments().catch(() => 0),
      usersCol.countDocuments().catch(() => 0),
      itemsCol.countDocuments({ status: 'active' }).catch(() => 0),
      itemsCol.find({}).sort({ createdAt: -1 }).limit(5).toArray().catch(() => [])
    ]);

    return res.json({
      success: true,
      stats: {
        totalItems,
        totalUsers,
        activeItems,
        recentItems,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/dashboard/kanban/tasks (Preserved for existing dashboard components)
router.get('/kanban/tasks', (req, res) => {
  const tasks = db.get('kanbanTasks');
  return res.json({ success: true, tasks });
});

// 3. POST /api/dashboard/kanban/tasks (Preserved)
router.post('/kanban/tasks', (req, res) => {
  const { title, description, priority = 'Medium', column = 'todo' } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Task title is required.' });
  }
  const newTask = db.create('kanbanTasks', { title, description: description || '', priority, column });
  return res.status(201).json({ success: true, message: 'Task added to board!', task: newTask });
});

// 4. PUT /api/dashboard/kanban/tasks/:id (Preserved)
router.put('/kanban/tasks/:id', (req, res) => {
  const { column, priority } = req.body;
  const task = db.findOne('kanbanTasks', t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }
  const updatedTask = db.update('kanbanTasks', task.id, {
    column: column || task.column,
    priority: priority || task.priority
  });
  return res.json({ success: true, message: 'Task column updated!', task: updatedTask });
});

module.exports = router;

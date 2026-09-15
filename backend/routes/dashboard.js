/* ==========================================================================
   DASHBOARD & KANBAN ROUTES (routes/dashboard.js)
   KPI Telemetry, Kanban Board Tasks Creation & State Updates
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  const stats = db.get('dashboardStats');
  return res.json({ success: true, stats });
});

// GET /api/kanban/tasks
router.get('/kanban/tasks', (req, res) => {
  const tasks = db.get('kanbanTasks');
  return res.json({ success: true, tasks });
});

// POST /api/kanban/tasks
router.post('/kanban/tasks', (req, res) => {
  const { title, description, priority = 'Medium', column = 'todo' } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Task title is required.' });
  }

  const newTask = db.create('kanbanTasks', {
    title,
    description: description || '',
    priority,
    column
  });

  return res.status(201).json({
    success: true,
    message: 'Task added to board!',
    task: newTask
  });
});

// PUT /api/kanban/tasks/:id (Move column status)
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

  return res.json({
    success: true,
    message: 'Task column updated!',
    task: updatedTask
  });
});

module.exports = router;

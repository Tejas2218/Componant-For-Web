/* ==========================================================================
   DIRECTORY & UPVOTING ROUTES (routes/directory.js)
   Tool directory listing & Upvote Counter Handler
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/tools
router.get('/', (req, res) => {
  const tools = db.get('tools');
  return res.json({ success: true, tools });
});

// POST /api/tools/:id/upvote
router.post('/:id/upvote', (req, res) => {
  const tool = db.findOne('tools', t => t.id === req.params.id);

  if (!tool) {
    return res.status(404).json({ success: false, message: 'Tool not found.' });
  }

  const updatedTool = db.update('tools', tool.id, {
    upvotes: tool.upvotes + 1
  });

  return res.json({
    success: true,
    message: `Upvoted ${tool.name}!`,
    upvotes: updatedTool.upvotes
  });
});

module.exports = router;

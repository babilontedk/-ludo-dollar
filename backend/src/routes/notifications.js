const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get notifications
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    );
    
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    logger.error('Get notifications error', error);
    next(error);
  }
});

// Mark as read
router.put('/:notificationId/read', authenticateToken, async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2`,
      [req.params.notificationId, req.userId]
    );
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

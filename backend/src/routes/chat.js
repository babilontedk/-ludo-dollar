const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get chat history
router.get('/:friendId/messages', authenticateToken, async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Get or create chat
    const chatResult = await query(
      `SELECT id FROM chats 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [req.userId, friendId]
    );
    
    let chatId;
    if (chatResult.rows.length === 0) {
      const createResult = await query(
        `INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING id`,
        [Math.min(req.userId, friendId), Math.max(req.userId, friendId)]
      );
      chatId = createResult.rows[0].id;
    } else {
      chatId = chatResult.rows[0].id;
    }
    
    // Get messages
    const messagesResult = await query(
      `SELECT id, sender_id, content, is_read, created_at
       FROM chat_messages
       WHERE chat_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    );
    
    // Mark as read
    await query(
      `UPDATE chat_messages SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE chat_id = $1 AND sender_id = $2 AND is_read = false`,
      [chatId, friendId]
    );
    
    res.json({
      success: true,
      chat_id: chatId,
      messages: messagesResult.rows.reverse(),
      pagination: { limit: parseInt(limit), offset: parseInt(offset) }
    });
  } catch (error) {
    logger.error('Get chat history error', error);
    next(error);
  }
});

module.exports = router;

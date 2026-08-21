const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Search players
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, players: [] });
    }
    
    const result = await query(
      `SELECT u.id, u.username, u.profile_image_url, p.online_status, p.total_games, p.total_wins
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE (u.username ILIKE $1 OR u.email ILIKE $1) AND u.status = 'active'
       LIMIT $2`,
      [`%${q}%`, limit]
    );
    
    res.json({ success: true, players: result.rows });
  } catch (error) {
    logger.error('Search players error', error);
    next(error);
  }
});

// Send friend request
router.post('/request', authenticateToken, async (req, res, next) => {
  try {
    const { to_user_id } = req.body;
    
    if (to_user_id === req.userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot add yourself as friend' }
      });
    }
    
    // Check if already friends or request exists
    const existingResult = await query(
      `SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [req.userId, to_user_id]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Already friends' }
      });
    }
    
    const requestResult = await query(
      `INSERT INTO friend_requests (from_user_id, to_user_id, status)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [req.userId, to_user_id, 'pending']
    );
    
    logger.info('Friend request sent', { from: req.userId, to: to_user_id });
    
    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      request_id: requestResult.rows[0].id
    });
  } catch (error) {
    logger.error('Send friend request error', error);
    next(error);
  }
});

// Get friend requests
router.get('/requests/pending', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT fr.id, u.id as user_id, u.username, u.profile_image_url, fr.created_at
       FROM friend_requests fr
       JOIN users u ON fr.from_user_id = u.id
       WHERE fr.to_user_id = $1 AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [req.userId]
    );
    
    res.json({ success: true, requests: result.rows });
  } catch (error) {
    next(error);
  }
});

// Accept friend request
router.post('/request/:requestId/accept', authenticateToken, async (req, res, next) => {
  const client = await require('../config/database').getClient();
  try {
    const { requestId } = req.params;
    
    await client.query('BEGIN');
    
    // Get friend request
    const requestResult = await client.query(
      'SELECT from_user_id, to_user_id FROM friend_requests WHERE id = $1 AND to_user_id = $2 FOR UPDATE',
      [requestId, req.userId]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Request not found' }
      });
    }
    
    const { from_user_id, to_user_id } = requestResult.rows[0];
    
    // Create friendship (lower ID first)
    const [minId, maxId] = from_user_id < to_user_id ? [from_user_id, to_user_id] : [to_user_id, from_user_id];
    
    await client.query(
      'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)',
      [minId, maxId, 'active']
    );
    
    // Update request
    await client.query(
      'UPDATE friend_requests SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['accepted', requestId]
    );
    
    await client.query('COMMIT');
    
    logger.info('Friend request accepted', { userId: req.userId, friendId: from_user_id });
    
    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Accept friend request error', error);
    next(error);
  } finally {
    client.release();
  }
});

// Get friends list
router.get('/list', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT CASE 
               WHEN user_id = $1 THEN friend_id
               ELSE user_id
             END as id,
             u.username, u.profile_image_url, p.online_status, p.total_games, p.total_wins
       FROM friends f
       JOIN users u ON u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'active'
       ORDER BY p.online_status DESC, u.username ASC`,
      [req.userId]
    );
    
    res.json({ success: true, friends: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

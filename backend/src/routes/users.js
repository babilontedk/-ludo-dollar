const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get current user profile
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.phone, u.profile_image_url, u.country, 
              p.first_name, p.last_name, p.bio, p.total_games, p.total_wins, p.total_losses,
              p.total_draws, p.coins_won, p.coins_lost, p.online_status
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [req.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    res.json({
      success: true,
      user: userResult.rows[0]
    });
  } catch (error) {
    logger.error('Get user profile error', error);
    next(error);
  }
});

// Get user by ID
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.profile_image_url,
              p.first_name, p.last_name, p.total_games, p.total_wins, p.total_losses,
              p.total_draws, p.online_status
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1 AND u.status = 'active'`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }
    
    res.json({
      success: true,
      user: userResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/me', authenticateToken, async (req, res, next) => {
  try {
    const { first_name, last_name, bio, phone } = req.body;
    
    await query(
      'UPDATE profiles SET first_name = $1, last_name = $2, bio = $3 WHERE user_id = $4',
      [first_name, last_name, bio, req.userId]
    );
    
    if (phone) {
      await query('UPDATE users SET phone = $1 WHERE id = $2', [phone, req.userId]);
    }
    
    logger.info('User profile updated', { userId: req.userId });
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Update profile error', error);
    next(error);
  }
});

module.exports = router;

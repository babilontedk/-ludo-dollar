const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, adminOnly, superAdminOnly } = require('../middleware/auth');
const logger = require('../utils/logger');

// Admin Dashboard Stats
router.get('/dashboard/stats', authenticateToken, adminOnly, async (req, res, next) => {
  try {
    const statsResult = await query(
      `SELECT 
       (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
       (SELECT COUNT(*) FROM profiles WHERE online_status = 'online') as online_users,
       (SELECT COUNT(*) FROM games WHERE status = 'active') as active_games,
       (SELECT COUNT(*) FROM games WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE) as completed_games_today,
       (SELECT SUM(platform_fee) FROM game_results WHERE DATE(created_at) = CURRENT_DATE) as platform_fees_today,
       (SELECT COUNT(*) FROM payment_transactions WHERE status = 'pending' AND transaction_type = 'withdrawal') as pending_withdrawals`
    );
    
    res.json({ success: true, stats: statsResult.rows[0] });
  } catch (error) {
    logger.error('Dashboard stats error', error);
    next(error);
  }
});

// Get users list
router.get('/users', authenticateToken, adminOnly, async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, search, status = 'active' } = req.query;
    
    let whereClause = 'WHERE u.status = $1';
    const params = [status];
    
    if (search) {
      whereClause += ` AND (u.username ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    const result = await query(
      `SELECT u.id, u.username, u.email, u.phone, u.status, u.created_at, p.total_games, p.total_wins
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      [status]
    );
    
    res.json({ success: true, users: result.rows, total: parseInt(countResult.rows[0].total) });
  } catch (error) {
    next(error);
  }
});

// Suspend user
router.post('/users/:userId/suspend', authenticateToken, superAdminOnly, async (req, res, next) => {
  try {
    const { reason, duration_days } = req.body;
    
    await query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['suspended', req.params.userId]
    );
    
    // Log admin action
    await query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.userId, 'suspend_user', 'users', req.params.userId, JSON.stringify({ reason, duration_days })]
    );
    
    logger.info('User suspended', { admin: req.userId, user: req.params.userId, reason });
    
    res.json({ success: true, message: 'User suspended successfully' });
  } catch (error) {
    next(error);
  }
});

// Ban user
router.post('/users/:userId/ban', authenticateToken, superAdminOnly, async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    await query('UPDATE users SET status = $1 WHERE id = $2', ['banned', req.params.userId]);
    
    await query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.userId, 'ban_user', 'users', req.params.userId, JSON.stringify({ reason })]
    );
    
    logger.info('User banned', { admin: req.userId, user: req.params.userId, reason });
    
    res.json({ success: true, message: 'User banned successfully' });
  } catch (error) {
    next(error);
  }
});

// Get pending withdrawals
router.get('/withdrawals/pending', authenticateToken, adminOnly, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT pt.id, u.username, u.email, pt.amount, pt.created_at
       FROM payment_transactions pt
       JOIN wallets w ON pt.wallet_id = w.id
       JOIN users u ON w.user_id = u.id
       WHERE pt.status = 'pending' AND pt.transaction_type = 'withdrawal'
       ORDER BY pt.created_at ASC`
    );
    
    res.json({ success: true, withdrawals: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

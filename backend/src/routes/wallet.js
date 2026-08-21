const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get wallet
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const walletResult = await query(
      `SELECT id, available_coins, locked_coins, bonus_coins,
              (available_coins + locked_coins + bonus_coins) as total_coins,
              total_withdrawn, total_deposited
       FROM wallets WHERE user_id = $1`,
      [req.userId]
    );
    
    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Wallet not found' }
      });
    }
    
    res.json({
      success: true,
      wallet: walletResult.rows[0]
    });
  } catch (error) {
    logger.error('Get wallet error', error);
    next(error);
  }
});

// Get transactions
router.get('/transactions', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, type } = req.query;
    
    let whereClause = 'WHERE w.user_id = $1';
    const params = [req.userId];
    
    if (type) {
      whereClause += ` AND wt.transaction_type = $${params.length + 1}`;
      params.push(type);
    }
    
    const txResult = await query(
      `SELECT wt.id, wt.transaction_type, wt.amount, wt.fee, wt.balance_before, wt.balance_after,
              wt.status, wt.description, wt.created_at
       FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       ${whereClause}
       ORDER BY wt.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    
    const countResult = await query(
      `SELECT COUNT(*) as total FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       ${whereClause}`,
      params
    );
    
    res.json({
      success: true,
      transactions: txResult.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    logger.error('Get transactions error', error);
    next(error);
  }
});

// Get specific transaction
router.get('/transactions/:txId', authenticateToken, async (req, res, next) => {
  try {
    const txResult = await query(
      `SELECT wt.* FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       WHERE wt.id = $1 AND w.user_id = $2`,
      [req.params.txId, req.userId]
    );
    
    if (txResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaction not found' }
      });
    }
    
    res.json({
      success: true,
      transaction: txResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

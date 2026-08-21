const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Get game levels
router.get('/levels', async (req, res, next) => {
  try {
    const levels = process.env.GAME_ENTRY_LEVELS.split(',').map((level, index) => ({
      id: index + 1,
      entry_amount: parseInt(level),
      min_players: 2,
      max_players: 4,
      enabled: true
    }));
    
    res.json({
      success: true,
      levels
    });
  } catch (error) {
    next(error);
  }
});

// Join matchmaking queue / Play Now
router.post('/play-now', authenticateToken, async (req, res, next) => {
  const client = await getClient();
  try {
    const { level_id } = req.body;
    
    // Get level amount
    const levels = process.env.GAME_ENTRY_LEVELS.split(',').map(l => parseInt(l));
    const entryAmount = levels[level_id - 1];
    
    if (!entryAmount) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid level' }
      });
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Get wallet
    const walletResult = await client.query(
      'SELECT id, available_coins FROM wallets WHERE user_id = $1 FOR UPDATE',
      [req.userId]
    );
    
    if (walletResult.rows.length === 0) {
      throw new Error('Wallet not found');
    }
    
    const wallet = walletResult.rows[0];
    
    if (wallet.available_coins < entryAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient coins',
          required: entryAmount,
          available: wallet.available_coins
        }
      });
    }
    
    // Deduct coins (lock them)
    const newBalance = wallet.available_coins - entryAmount;
    await client.query(
      'UPDATE wallets SET available_coins = $1, locked_coins = locked_coins + $2 WHERE id = $3',
      [newBalance, entryAmount, wallet.id]
    );
    
    // Record transaction
    await client.query(
      `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [wallet.id, 'game_entry', entryAmount, wallet.available_coins, newBalance, 'pending', `Game entry - Level ${level_id}`]
    );
    
    // Create game
    const gameCode = uuidv4().substring(0, 8).toUpperCase();
    const gameResult = await client.query(
      `INSERT INTO games (game_code, game_level, entry_amount, total_pot, platform_fee, player_count, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [gameCode, level_id, entryAmount, entryAmount, 0, 1, 'matchmaking', req.userId]
    );
    
    // Add player to game
    await client.query(
      `INSERT INTO game_players (game_id, user_id, player_position, player_color, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [gameResult.rows[0].id, req.userId, 1, 'red', 'waiting']
    );
    
    await client.query('COMMIT');
    
    logger.info('Player joined matchmaking', {
      userId: req.userId,
      levelId: level_id,
      gameId: gameResult.rows[0].id
    });
    
    res.json({
      success: true,
      message: 'Added to matchmaking queue',
      gameId: gameResult.rows[0].id,
      gameCode
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Play now error', error);
    next(error);
  } finally {
    client.release();
  }
});

// Get game status
router.get('/:gameId/status', authenticateToken, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    
    const gameResult = await query(
      `SELECT g.*, 
              json_agg(json_build_object('id', gp.user_id, 'color', gp.player_color, 'status', gp.status, 'position', gp.player_position)) as players
       FROM games g
       LEFT JOIN game_players gp ON g.id = gp.game_id
       WHERE g.id = $1
       GROUP BY g.id`,
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Game not found' }
      });
    }
    
    res.json({
      success: true,
      game: gameResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Get game history
router.get('/history/list', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const historyResult = await query(
      `SELECT g.*, gr.winner_id, gr.winner_payout
       FROM games g
       LEFT JOIN game_results gr ON g.id = gr.game_id
       WHERE g.id IN (SELECT game_id FROM game_players WHERE user_id = $1)
       ORDER BY g.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    );
    
    res.json({
      success: true,
      games: historyResult.rows,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

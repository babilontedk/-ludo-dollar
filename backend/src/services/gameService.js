// Ludo Game Service - Manages game state and logic

const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class GameService {
  // Create or get matchmaking game
  static async findOrCreateGameForPlayer(userId, levelId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check for existing incomplete game with same level
      const existingGameResult = await client.query(
        `SELECT g.id FROM games g
         JOIN game_players gp ON g.id = gp.game_id
         WHERE gp.user_id = $1 AND g.status IN ('matchmaking', 'waiting', 'active')
         LIMIT 1 FOR UPDATE`,
        [userId]
      );

      if (existingGameResult.rows.length > 0) {
        await client.query('COMMIT');
        return existingGameResult.rows[0].id;
      }

      // Create new game
      const gameCode = uuidv4().substring(0, 8).toUpperCase();
      const levels = process.env.GAME_ENTRY_LEVELS.split(',').map(l => parseInt(l));
      const entryAmount = levels[levelId - 1];

      const gameResult = await client.query(
        `INSERT INTO games (game_code, game_level, entry_amount, total_pot, platform_fee, player_count, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [gameCode, levelId, entryAmount, entryAmount, 0, 1, 'matchmaking', userId]
      );

      const gameId = gameResult.rows[0].id;

      // Add player to game
      await client.query(
        `INSERT INTO game_players (game_id, user_id, player_position, player_color, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [gameId, userId, 1, 'red', 'waiting']
      );

      await client.query('COMMIT');
      return gameId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Find matching players
  static async findMatchingPlayers(gameId, maxPlayers = 4) {
    const gameResult = await query(
      'SELECT game_level, entry_amount FROM games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return [];
    }

    const game = gameResult.rows[0];

    // Find players waiting in queue
    const matchingPlayersResult = await query(
      `SELECT mq.user_id, u.username FROM matchmaking_queue mq
       JOIN users u ON mq.user_id = u.id
       WHERE mq.level = $1 AND mq.status = 'waiting' AND u.status = 'active'
       LIMIT $2`,
      [game.game_level, maxPlayers - 1]
    );

    return matchingPlayersResult.rows;
  }

  // Start game with matched players
  static async startGame(gameId, playerIds) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const colors = ['red', 'blue', 'green', 'yellow'];

      // Update game status
      await client.query(
        `UPDATE games SET status = 'active', player_count = $1, started_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [playerIds.length, gameId]
      );

      // Update game players with colors and positions
      for (let i = 0; i < playerIds.length; i++) {
        await client.query(
          `UPDATE game_players SET player_color = $1, player_position = $2, status = 'active'
           WHERE game_id = $3 AND user_id = $4`,
          [colors[i], i + 1, gameId, playerIds[i]]
        );
      }

      // Update matchmaking queue status
      for (const playerId of playerIds) {
        await client.query(
          `UPDATE matchmaking_queue SET status = 'matched', matched_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND status = 'waiting'`,
          [playerId]
        );
      }

      await client.query('COMMIT');

      logger.info('Game started', { gameId, playerCount: playerIds.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Process player move
  static async processMove(gameId, playerId, diceValue, move) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get game and player info
      const gameResult = await client.query(
        'SELECT g.*, gp.player_color FROM games g JOIN game_players gp ON g.id = gp.game_id WHERE g.id = $1 AND gp.user_id = $2 FOR UPDATE',
        [gameId, playerId]
      );

      if (gameResult.rows.length === 0) {
        throw new Error('Game or player not found');
      }

      const game = gameResult.rows[0];
      const playerColor = game.player_color;

      // Record move
      const moveCountResult = await client.query(
        'SELECT COUNT(*) as count FROM game_moves WHERE game_id = $1',
        [gameId]
      );

      const moveNumber = parseInt(moveCountResult.rows[0].count) + 1;

      await client.query(
        `INSERT INTO game_moves (game_id, player_id, move_number, dice_value, piece_position, action, is_valid)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [gameId, playerId, moveNumber, diceValue, move.piece_position || null, move.action || null, true]
      );

      await client.query('COMMIT');

      logger.info('Move processed', { gameId, playerId, diceValue });
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // End game and distribute payouts
  static async endGame(gameId, winnerId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get game details
      const gameResult = await client.query(
        'SELECT * FROM games WHERE id = $1 FOR UPDATE',
        [gameId]
      );

      const game = gameResult.rows[0];
      const totalPot = game.total_pot;
      const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || 25);
      const platformFee = Math.ceil((totalPot * platformFeePercent) / 100);
      const winnerPayout = totalPot - platformFee;

      // Update game
      await client.query(
        `UPDATE games SET status = 'completed', winner_id = $1, ended_at = CURRENT_TIMESTAMP, winner_payout = $2, platform_fee = $3 WHERE id = $4`,
        [winnerId, winnerPayout, platformFee, gameId]
      );

      // Get all players
      const playersResult = await client.query(
        'SELECT user_id, player_color FROM game_players WHERE game_id = $1',
        [gameId]
      );

      // Credit winner
      const winnerWalletResult = await client.query(
        'SELECT id, available_coins FROM wallets WHERE user_id = $1 FOR UPDATE',
        [winnerId]
      );

      const winnerWallet = winnerWalletResult.rows[0];
      const beforeBalance = winnerWallet.available_coins;
      const afterBalance = beforeBalance + winnerPayout;

      await client.query(
        'UPDATE wallets SET available_coins = $1, locked_coins = locked_coins - $2 WHERE id = $3',
        [afterBalance, game.entry_amount, winnerWallet.id]
      );

      // Record winner transaction
      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, status, description, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [winnerWallet.id, 'game_winning', winnerPayout, beforeBalance, afterBalance, 'completed', `Game winning - ${game.game_code}`, `WIN-${gameId}`]
      );

      // Refund other players
      for (const player of playersResult.rows) {
        if (player.user_id !== winnerId) {
          const playerWalletResult = await client.query(
            'SELECT id, available_coins FROM wallets WHERE user_id = $1 FOR UPDATE',
            [player.user_id]
          );

          const playerWallet = playerWalletResult.rows[0];
          const playerBefore = playerWallet.available_coins;
          const playerAfter = playerBefore; // No coins back for losers

          await client.query(
            'UPDATE wallets SET locked_coins = locked_coins - $1 WHERE id = $2',
            [game.entry_amount, playerWallet.id]
          );
        }
      }

      // Create game result
      const gameDurationResult = await client.query(
        'SELECT EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - g.started_at)) as duration FROM games g WHERE g.id = $1',
        [gameId]
      );

      const gameDuration = parseInt(gameDurationResult.rows[0].duration) || 0;

      const movesResult = await client.query(
        'SELECT COUNT(*) as count FROM game_moves WHERE game_id = $1',
        [gameId]
      );

      const totalMoves = parseInt(movesResult.rows[0].count);

      await client.query(
        `INSERT INTO game_results (game_id, winner_id, winner_payout, platform_fee_collected, game_duration_seconds, total_moves)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [gameId, winnerId, winnerPayout, platformFee, gameDuration, totalMoves]
      );

      await client.query('COMMIT');

      logger.info('Game ended', { gameId, winnerId, payout: winnerPayout, platformFee });
      
      return {
        winnerId,
        payout: winnerPayout,
        platformFee
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = GameService;

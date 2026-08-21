const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { validateRequest, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Register
router.post('/register', validateRequest(schemas.register), async (req, res, next) => {
  try {
    const { username, email, password, phone, first_name, last_name, date_of_birth, country } = req.validated.body;
    
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Email or username already exists'
        }
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userResult = await query(
      `INSERT INTO users (username, email, phone, password_hash, country, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, created_at`,
      [username, email, phone, passwordHash, country, date_of_birth]
    );
    
    const userId = userResult.rows[0].id;
    
    // Create profile
    await query(
      `INSERT INTO profiles (user_id, first_name, last_name)
       VALUES ($1, $2, $3)`,
      [userId, first_name, last_name]
    );
    
    // Create wallet
    const initialCoins = process.env.DEMO_MODE === 'true' ? 50000 : 0;
    await query(
      `INSERT INTO wallets (user_id, available_coins)
       VALUES ($1, $2)`,
      [userId, initialCoins]
    );
    
    // Log transaction
    const walletResult = await query('SELECT id FROM wallets WHERE user_id = $1', [userId]);
    await query(
      `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [walletResult.rows[0].id, 'bonus', initialCoins, 0, initialCoins, 'Demo account initial bonus', 'completed']
    );
    
    // Generate token
    const token = jwt.sign(
      { id: userId, email, username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
    
    logger.info('User registered', { userId, email });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResult.rows[0],
      token
    });
  } catch (error) {
    logger.error('Registration error', error);
    next(error);
  }
});

// Login
router.post('/login', validateRequest(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    
    // Get user
    const userResult = await query(
      'SELECT id, username, email, password_hash, status FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        }
      });
    }
    
    const user = userResult.rows[0];
    
    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Account is ${user.status}`
        }
      });
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        }
      });
    }
    
    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
    
    logger.info('User logged in', { userId: user.id });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    logger.error('Login error', error);
    next(error);
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Forgot Password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If account exists, password reset link will be sent to email'
      });
    }
    
    // TODO: Send reset email
    logger.info('Password reset requested', { email });
    
    res.json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    logger.error('Forgot password error', error);
    next(error);
  }
});

module.exports = router;

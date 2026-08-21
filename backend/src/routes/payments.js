const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { query, getClient } = require('../config/database');
const { authenticateToken, superAdminOnly } = require('../middleware/auth');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_MODE = process.env.PAYSTACK_MODE || 'test';
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

// Initiate deposit
router.post('/deposit/initiate', authenticateToken, async (req, res, next) => {
  const client = await getClient();
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid amount' }
      });
    }
    
    // Check payment mode
    if (process.env.PAYMENT_MODE === 'disabled') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_DISABLED',
          message: 'Payments are currently disabled'
        }
      });
    }
    
    // Get wallet
    const walletResult = await query('SELECT id FROM wallets WHERE user_id = $1', [req.userId]);
    const walletId = walletResult.rows[0].id;
    
    // Create payment transaction
    const reference = `DEP-${uuidv4().substring(0, 8).toUpperCase()}`;
    const paymentResult = await query(
      `INSERT INTO payment_transactions (wallet_id, transaction_type, amount, currency, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [walletId, 'deposit', amount, 'NGN', 'pending', JSON.stringify({ reference })]
    );
    
    // If payment mode is disabled, return mock response
    if (process.env.PAYMENT_MODE === 'disabled') {
      return res.json({
        success: true,
        message: 'Payment processing disabled in demo mode',
        paystack_reference: reference,
        amount,
        currency: 'NGN'
      });
    }
    
    // Initialize Paystack transaction
    try {
      const paystackResponse = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email: req.user.email || 'player@ludodollar.test',
          amount: amount * 100, // Convert to kobo
          reference,
          metadata: {
            user_id: req.userId,
            payment_id: paymentResult.rows[0].id
          }
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (paystackResponse.data.status) {
        res.json({
          success: true,
          payment_url: paystackResponse.data.data.authorization_url,
          paystack_reference: reference,
          amount,
          currency: 'NGN'
        });
      } else {
        throw new Error('Paystack initialization failed');
      }
    } catch (paystackError) {
      logger.error('Paystack initialization error', paystackError);
      
      // Mark transaction as failed
      await query(
        'UPDATE payment_transactions SET status = $1 WHERE id = $2',
        ['failed', paymentResult.rows[0].id]
      );
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_FAILED',
          message: 'Failed to initialize payment. Please try again.'
        }
      });
    }
  } catch (error) {
    logger.error('Deposit initiate error', error);
    next(error);
  } finally {
    client.release();
  }
});

// Verify deposit
router.get('/deposit/verify', authenticateToken, async (req, res, next) => {
  const client = await getClient();
  try {
    const { reference } = req.query;
    
    if (!reference) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Reference required' }
      });
    }
    
    // In demo mode, auto-complete
    if (process.env.PAYMENT_MODE === 'disabled') {
      const walletResult = await query('SELECT id FROM wallets WHERE user_id = $1', [req.userId]);
      const walletId = walletResult.rows[0].id;
      
      // Extract amount from reference or use default
      const amount = 1000; // Default for demo
      const fee = Math.ceil(amount * (parseInt(process.env.DEPOSIT_FEE_PERCENTAGE || 3) / 100));
      const creditedAmount = amount - fee;
      
      // Credit wallet
      await client.query('BEGIN');
      
      const currentWallet = await client.query(
        'SELECT available_coins FROM wallets WHERE id = $1 FOR UPDATE',
        [walletId]
      );
      
      const newBalance = currentWallet.rows[0].available_coins + creditedAmount;
      
      await client.query(
        'UPDATE wallets SET available_coins = $1, total_deposited = total_deposited + $2 WHERE id = $3',
        [newBalance, amount, walletId]
      );
      
      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, fee, balance_before, balance_after, status, reference_id, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [walletId, 'deposit', amount, fee, currentWallet.rows[0].available_coins, newBalance, 'completed', reference, 'Deposit via Paystack']
      );
      
      await client.query('COMMIT');
      
      logger.info('Demo deposit verified', { userId: req.userId, amount });
      
      return res.json({
        success: true,
        status: 'completed',
        amount,
        credited_amount: creditedAmount,
        fee
      });
    }
    
    // Verify with Paystack
    try {
      const verifyResponse = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
          }
        }
      );
      
      const { status, data } = verifyResponse.data;
      
      if (!status || data.status !== 'success') {
        return res.json({
          success: true,
          status: 'pending',
          message: 'Payment not yet confirmed'
        });
      }
      
      // Payment successful - credit wallet
      await client.query('BEGIN');
      
      const amount = data.amount / 100; // Convert from kobo
      const fee = Math.ceil(amount * (parseInt(process.env.DEPOSIT_FEE_PERCENTAGE || 3) / 100));
      const creditedAmount = amount - fee;
      
      const walletResult = await client.query(
        'SELECT id, available_coins FROM wallets WHERE user_id = $1 FOR UPDATE',
        [req.userId]
      );
      
      const walletId = walletResult.rows[0].id;
      const beforeBalance = walletResult.rows[0].available_coins;
      const newBalance = beforeBalance + creditedAmount;
      
      await client.query(
        'UPDATE wallets SET available_coins = $1, total_deposited = total_deposited + $2 WHERE id = $3',
        [newBalance, amount, walletId]
      );
      
      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, fee, balance_before, balance_after, status, reference_id, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [walletId, 'deposit', amount, fee, beforeBalance, newBalance, 'completed', reference, 'Deposit via Paystack']
      );
      
      await client.query('COMMIT');
      
      logger.info('Deposit verified', { userId: req.userId, amount, reference });
      
      res.json({
        success: true,
        status: 'completed',
        amount,
        credited_amount: creditedAmount,
        fee
      });
    } catch (paystackError) {
      logger.error('Paystack verification error', paystackError);
      throw paystackError;
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Deposit verify error', error);
    next(error);
  } finally {
    client.release();
  }
});

// Paystack webhook
router.post('/paystack/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const hash = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET).update(JSON.stringify(req.body)).digest('hex');
    
    if (hash !== signature) {
      logger.warn('Invalid webhook signature', { signature, hash });
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
    
    const { event, data } = req.body;
    
    if (event === 'charge.success') {
      const { reference, amount, metadata } = data;
      
      const client = await getClient();
      await client.query('BEGIN');
      
      try {
        // Get payment transaction
        const paymentResult = await client.query(
          'SELECT id, wallet_id, amount FROM payment_transactions WHERE status = $1 LIMIT 1 FOR UPDATE',
          ['pending']
        );
        
        if (paymentResult.rows.length > 0) {
          const payment = paymentResult.rows[0];
          const depositAmount = amount / 100; // Convert from kobo
          const fee = Math.ceil(depositAmount * (parseInt(process.env.DEPOSIT_FEE_PERCENTAGE || 3) / 100));
          const creditedAmount = depositAmount - fee;
          
          // Update wallet
          const walletResult = await client.query(
            'SELECT available_coins FROM wallets WHERE id = $1 FOR UPDATE',
            [payment.wallet_id]
          );
          
          const beforeBalance = walletResult.rows[0].available_coins;
          const newBalance = beforeBalance + creditedAmount;
          
          await client.query(
            'UPDATE wallets SET available_coins = $1, total_deposited = total_deposited + $2 WHERE id = $3',
            [newBalance, depositAmount, payment.wallet_id]
          );
          
          // Update payment transaction
          await client.query(
            'UPDATE payment_transactions SET status = $1, verified_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['completed', payment.id]
          );
          
          // Create wallet transaction
          await client.query(
            `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, fee, balance_before, balance_after, status, reference_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [payment.wallet_id, 'deposit', depositAmount, fee, beforeBalance, newBalance, 'completed', reference, 'Paystack webhook deposit']
          );
        }
        
        await client.query('COMMIT');
        logger.info('Webhook processed successfully', { reference, amount });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook error', error);
    next(error);
  }
});

// Admin: Get Paystack settings
router.get('/admin/settings/paystack', authenticateToken, superAdminOnly, async (req, res, next) => {
  try {
    res.json({
      success: true,
      settings: {
        mode: PAYSTACK_MODE,
        enabled: process.env.PAYMENT_MODE !== 'disabled',
        deposit_fee: parseInt(process.env.DEPOSIT_FEE_PERCENTAGE || 3),
        withdrawal_fee: parseInt(process.env.WITHDRAWAL_FEE_PERCENTAGE || 5),
        min_deposit: 1000,
        max_deposit: 500000,
        min_withdrawal: 5000,
        max_withdrawal: 1000000,
        public_key_configured: !!PAYSTACK_PUBLIC_KEY,
        secret_key_configured: !!PAYSTACK_SECRET_KEY
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Test Paystack connection
router.get('/admin/settings/paystack/test', authenticateToken, superAdminOnly, async (req, res, next) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return res.json({
        success: false,
        status: 'error',
        message: 'Paystack secret key not configured'
      });
    }
    
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/bank`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
          }
        }
      );
      
      res.json({
        success: true,
        status: 'connected',
        message: 'Paystack connection successful',
        mode: PAYSTACK_MODE
      });
    } catch (error) {
      res.json({
        success: false,
        status: 'error',
        message: 'Failed to connect to Paystack. Check your API keys.'
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

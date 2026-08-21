-- Demo Accounts Seed Data
-- Creates 4 demo player accounts with 50,000 coins each

INSERT INTO users (username, email, phone, password_hash, status, email_verified, phone_verified, country, date_of_birth, created_at, updated_at)
VALUES 
  ('demo1', 'demo1@ludodollar.test', '+2348012345601', '$2b$10$HXOLbAm/58HpkR7h3I5v9OFJjJrWQpHNRkW7Z0H8.r.cSPrHVkw3m', 'active', true, true, 'Nigeria', '1990-01-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo2', 'demo2@ludodollar.test', '+2348012345602', '$2b$10$HXOLbAm/58HpkR7h3I5v9OFJjJrWQpHNRkW7Z0H8.r.cSPrHVkw3m', 'active', true, true, 'Nigeria', '1992-02-02', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo3', 'demo3@ludodollar.test', '+2348012345603', '$2b$10$HXOLbAm/58HpkR7h3I5v9OFJjJrWQpHNRkW7Z0H8.r.cSPrHVkw3m', 'active', true, true, 'Nigeria', '1994-03-03', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo4', 'demo4@ludodollar.test', '+2348012345604', '$2b$10$HXOLbAm/58HpkR7h3I5v9OFJjJrWQpHNRkW7Z0H8.r.cSPrHVkw3m', 'active', true, true, 'Nigeria', '1996-04-04', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create profiles for demo users
INSERT INTO profiles (user_id, first_name, last_name, bio, total_games, online_status)
VALUES 
  (1, 'Demo', 'Player One', 'First demo player', 0, 'offline'),
  (2, 'Demo', 'Player Two', 'Second demo player', 0, 'offline'),
  (3, 'Demo', 'Player Three', 'Third demo player', 0, 'offline'),
  (4, 'Demo', 'Player Four', 'Fourth demo player', 0, 'offline');

-- Create wallets with 50,000 demo coins
INSERT INTO wallets (user_id, available_coins, locked_coins, bonus_coins, total_deposited)
VALUES 
  (1, 50000, 0, 0, 0),
  (2, 50000, 0, 0, 0),
  (3, 50000, 0, 0, 0),
  (4, 50000, 0, 0, 0);

-- Create initial wallet transactions (demo bonus)
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, description, status)
VALUES 
  (1, 'bonus', 50000, 0, 50000, 'Demo account initial bonus', 'completed'),
  (2, 'bonus', 50000, 0, 50000, 'Demo account initial bonus', 'completed'),
  (3, 'bonus', 50000, 0, 50000, 'Demo account initial bonus', 'completed'),
  (4, 'bonus', 50000, 0, 50000, 'Demo account initial bonus', 'completed');

-- Create achievements
INSERT INTO achievements (name, description, requirement_type, requirement_value, reward_coins)
VALUES 
  ('First Win', 'Win your first game', 'wins', 1, 100),
  ('10 Wins', 'Achieve 10 wins', 'wins', 10, 500),
  ('50 Wins', 'Achieve 50 wins', 'wins', 50, 2000),
  ('100 Wins', 'Achieve 100 wins', 'wins', 100, 5000),
  ('Winning Streak', 'Win 5 games in a row', 'streak', 5, 1000),
  ('Champion', 'Achieve highest rank', 'rank', 1, 10000);

-- Create shop products
INSERT INTO shop_products (name, description, coin_amount, price_in_ngn, discount_percentage, is_active)
VALUES 
  ('1,000 Coins', 'Get 1,000 coins', 1000, 500.00, 0, true),
  ('5,000 Coins', 'Get 5,000 coins', 5000, 2000.00, 5, true),
  ('10,000 Coins', 'Get 10,000 coins', 10000, 3500.00, 10, true),
  ('50,000 Coins', 'Get 50,000 coins', 50000, 15000.00, 15, true),
  ('100,000 Coins', 'Get 100,000 coins', 100000, 25000.00, 20, true);

-- All passwords hash to 'demo1234'
-- Salt: $2b$10$HXOLbAm/58HpkR7h3I5v9O
-- Hash: $2b$10$HXOLbAm/58HpkR7h3I5v9OFJjJrWQpHNRkW7Z0H8.r.cSPrHVkw3m

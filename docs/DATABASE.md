# Ludo Dollar - Database Schema

## Overview

PostgreSQL database with comprehensive schema for a multiplayer gaming platform.

## Core Tables

### users

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended', 'banned', 'deleted') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  kyc_verified BOOLEAN DEFAULT false,
  profile_image_url TEXT,
  country VARCHAR(100),
  date_of_birth DATE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### profiles

```sql
CREATE TABLE profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  bio TEXT,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  coins_won BIGINT DEFAULT 0,
  coins_lost BIGINT DEFAULT 0,
  online_status ENUM('online', 'offline', 'away', 'in_game') DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### wallets

```sql
CREATE TABLE wallets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  available_coins BIGINT DEFAULT 0,
  locked_coins BIGINT DEFAULT 0,
  bonus_coins BIGINT DEFAULT 0,
  total_withdrawn BIGINT DEFAULT 0,
  total_deposited BIGINT DEFAULT 0,
  version INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### wallet_transactions

```sql
CREATE TABLE wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  wallet_id BIGINT REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_type ENUM('deposit', 'withdrawal', 'game_entry', 'game_winning', 
                        'game_refund', 'shop_purchase', 'bonus', 'adjustment') 
                        NOT NULL,
  amount BIGINT NOT NULL,
  fee BIGINT DEFAULT 0,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  reference_id VARCHAR(255),
  game_id BIGINT,
  status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(reference_id)
);

CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_game_id ON wallet_transactions(game_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
```

## Game Tables

### games

```sql
CREATE TABLE games (
  id BIGSERIAL PRIMARY KEY,
  game_code VARCHAR(20) UNIQUE NOT NULL,
  game_level INTEGER NOT NULL,
  entry_amount BIGINT NOT NULL,
  total_pot BIGINT NOT NULL,
  platform_fee BIGINT NOT NULL,
  winner_payout BIGINT,
  player_count INTEGER NOT NULL,
  status ENUM('matchmaking', 'waiting', 'active', 'completed', 'abandoned') 
           DEFAULT 'matchmaking',
  winner_id BIGINT,
  created_by BIGINT REFERENCES users(id),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_winner_id ON games(winner_id);
CREATE INDEX idx_games_created_at ON games(created_at);
```

### game_players

```sql
CREATE TABLE game_players (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  player_position INTEGER,
  player_color ENUM('red', 'blue', 'green', 'yellow') NOT NULL,
  status ENUM('waiting', 'active', 'won', 'lost', 'disconnected', 'forfeited') 
          DEFAULT 'waiting',
  pieces_home INTEGER DEFAULT 0,
  entry_locked_at TIMESTAMP,
  abandoned_at TIMESTAMP,
  reconnected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id)
);

CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
```

### game_moves

```sql
CREATE TABLE game_moves (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES users(id),
  move_number INTEGER NOT NULL,
  dice_value INTEGER NOT NULL,
  piece_position INTEGER,
  action VARCHAR(50),
  is_valid BOOLEAN DEFAULT true,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, move_number)
);

CREATE INDEX idx_game_moves_game_id ON game_moves(game_id);
```

### game_results

```sql
CREATE TABLE game_results (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
  winner_id BIGINT REFERENCES users(id),
  runner_up_id BIGINT,
  winner_payout BIGINT,
  platform_fee_collected BIGINT,
  game_duration_seconds INTEGER,
  total_moves INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id)
);
```

## Social Tables

### friends

```sql
CREATE TABLE friends (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  friend_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  status ENUM('active', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK(user_id < friend_id)
);

CREATE INDEX idx_friends_user_id ON friends(user_id);
```

### friend_requests

```sql
CREATE TABLE friend_requests (
  id BIGSERIAL PRIMARY KEY,
  from_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  to_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
```

### chats

```sql
CREATE TABLE chats (
  id BIGSERIAL PRIMARY KEY,
  user1_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  user2_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id),
  CHECK(user1_id < user2_id)
);

CREATE INDEX idx_chats_user1_id ON chats(user1_id);
CREATE INDEX idx_chats_user2_id ON chats(user2_id);
```

### chat_messages

```sql
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
  sender_id BIGINT REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

## Payment Tables

### payment_transactions

```sql
CREATE TABLE payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  wallet_id BIGINT REFERENCES wallets(id),
  transaction_type ENUM('deposit', 'withdrawal') NOT NULL,
  amount BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  paystack_reference VARCHAR(255) UNIQUE,
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  payment_method VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_payment_transactions_wallet_id ON payment_transactions(wallet_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_paystack_reference ON payment_transactions(paystack_reference);
```

### payment_webhooks

```sql
CREATE TABLE payment_webhooks (
  id BIGSERIAL PRIMARY KEY,
  payment_transaction_id BIGINT REFERENCES payment_transactions(id),
  webhook_signature VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Admin Tables

### admin_users

```sql
CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  role_id BIGINT,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### audit_logs

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## Constraints & Indexes

- All foreign keys have ON DELETE CASCADE or ON DELETE RESTRICT
- Indexes on frequently queried columns (user_id, game_id, status, created_at)
- Unique constraints where applicable
- Check constraints for data integrity
- Timestamps for audit trail

## Transactions

Atomic transactions required for:
- Wallet debit/credit operations
- Game entry/payout
- Payment processing
- Friend operations

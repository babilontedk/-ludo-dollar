# Ludo Dollar - Architecture Overview

## System Architecture

```
┌──────────────────────────────────┐
│   Flutter Android App            │
│   ├─ Auth Module                 │
│   ├─ Profile Module              │
│   ├─ Wallet Module               │
│   ├─ Ludo Game Module            │
│   ├─ Multiplayer Module          │
│   ├─ Social Module               │
│   ├─ Shop Module                 │
│   └─ Admin Module                │
└──────────────────────┬───────────┘
             │ HTTPS REST API
             │ Socket.IO (WebSocket)
             ↓
┌──────────────────────────────────────────────────┐
│  Node.js/Express Backend Server                 │
│  ├─ Authentication Service                      │
│  ├─ Game Engine Service                         │
│  ├─ Multiplayer/Matchmaking Service             │
│  ├─ Wallet/Ledger Service                       │
│  ├─ Payment Service (Paystack)                  │
│  ├─ User Service                                │
│  ├─ Social Service                              │
│  ├─ Notification Service                        │
│  ├─ Admin Service                               │
│  └─ Socket.IO Real-time Server                  │
└──────────────────────┬─────────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  PostgreSQL Database             │
│  ├─ Users                        │
│  ├─ Profiles                     │
│  ├─ Wallets                      │
│  ├─ Transactions                 │
│  ├─ Games                        │
│  ├─ Game Players                 │
│  ├─ Game Moves                   │
│  ├─ Friends                      │
│  ├─ Chat Messages                │
│  ├─ Notifications                │
│  ├─ Achievements                 │
│  ├─ Payment Transactions          │
│  └─ Audit Logs                   │
└──────────────────────┬───────────┘
             │
             ↓
┌──────────────────────────────────┐
│  Paystack API                    │
│  (Payment Gateway)               │
└──────────────────────────────────┘
```

## Security Architecture

- **Client-Side**: Secure storage of JWT, no sensitive data in SharedPreferences
- **Server-Side**: HTTPS/TLS, password hashing with bcrypt, rate limiting, SQL injection prevention
- **Wallet**: Atomic transactions, complete ledger, server-authoritative
- **Game**: Server-authoritative state, server-side dice generation, move validation
- **Payments**: Secret key never exposed to client, webhook signature verification

## Module Architecture

### Flutter Modules
```
lib/
├── features/
│   ├── auth/
│   ├── profile/
│   ├── wallet/
│   ├── game/
│   ├── multiplayer/
│   ├── friends/
│   ├── chat/
│   ├── shop/
│   ├── leaderboard/
│   ├── achievements/
│   ├── notifications/
│   └── admin/
├── core/
│   ├── api/
│   ├── services/
│   ├── models/
│   ├── utils/
│   └── widgets/
└── config/
    ├── theme/
    ├── routes/
    └── constants/
```

### Backend Structure
```
backend/
├── src/
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── games/
│   │       ├── wallet/
│   │       ├── payments/
│   │       ├── friends/
│   │       ├── chat/
│   │       ├── shop/
│   │       └── admin/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   └── app.js
└── package.json
```

## Database Schema

### Core Tables
- **users**: User accounts, authentication
- **profiles**: User profile data, stats
- **wallets**: Coin balance, locked coins, bonus coins
- **wallet_transactions**: Ledger entries for all wallet changes

### Game Tables
- **games**: Active/completed games
- **game_players**: Players in a game
- **game_moves**: Individual moves by players
- **game_results**: Winners, payouts

### Social Tables
- **friends**: Friend relationships
- **friend_requests**: Pending requests
- **blocked_users**: Blocked relationships
- **chats**: Chat conversations
- **chat_messages**: Individual messages

### Payment Tables
- **payment_transactions**: All payment operations
- **payment_webhooks**: Paystack webhook logs
- **deposits**: Deposit history
- **withdrawals**: Withdrawal requests

### Admin Tables
- **admin_users**: Admin accounts
- **admin_roles**: Admin roles
- **admin_permissions**: Role permissions
- **audit_logs**: All admin actions

## Real-Time Communication

Socket.IO handles:
- Game matchmaking
- Game state updates
- Dice rolls
- Player moves
- Notifications
- Friend presence
- Chat messages

## Payment Flow

```
User Deposit Request
    ↓
Backend creates Paystack reference
    ↓
Backend initializes Paystack transaction
    ↓
Flutter opens Paystack payment UI
    ↓
User completes payment (on Paystack servers)
    ↓
Paystack sends webhook to backend
    ↓
Backend verifies payment with Paystack
    ↓
Backend credits wallet
    ↓
Notification sent to client
```

Secret key NEVER exposed to client. All verification server-side.

# Ludo Dollar - API Documentation

## Base URL

```
https://api.MYDOMAIN.com/api/v1
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "secure_password",
  "phone": "+2348012345678",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-01",
  "country": "Nigeria"
}

Response: 201 Created
{
  "success": true,
  "user": {...},
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "secure_password"
}

Response: 200 OK
{
  "success": true,
  "user": {...},
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Logout
```
POST /auth/logout

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Games

#### Get Game Levels
```
GET /games/levels

Response: 200 OK
[
  {
    "id": 1,
    "entry_amount": 1000,
    "min_players": 2,
    "max_players": 4,
    "enabled": true
  },
  ...
]
```

#### Play Now (Join Matchmaking Queue)
```
POST /games/play-now
Content-Type: application/json

{
  "level_id": 1
}

Response: 200 OK
{
  "success": true,
  "message": "Added to matchmaking queue",
  "queue_position": 2
}
```

#### Get Game Status
```
GET /games/{gameId}/status

Response: 200 OK
{
  "id": "game_123",
  "status": "active",
  "players": [...],
  "current_turn": 1,
  "current_player_id": 123
}
```

#### Roll Dice
```
POST /games/{gameId}/dice

Response: 200 OK
{
  "success": true,
  "dice_value": 4,
  "moves_available": true
}
```

#### Move Piece
```
POST /games/{gameId}/move
Content-Type: application/json

{
  "piece_id": 1,
  "new_position": 5
}

Response: 200 OK
{
  "success": true,
  "game_state": {...},
  "current_turn": 2
}
```

### Wallet

#### Get Wallet
```
GET /wallet

Response: 200 OK
{
  "available_coins": 45000,
  "locked_coins": 1000,
  "bonus_coins": 5000,
  "total_coins": 51000
}
```

#### Get Transactions
```
GET /wallet/transactions?limit=20&offset=0

Response: 200 OK
{
  "success": true,
  "transactions": [
    {
      "id": "txn_123",
      "type": "game_entry",
      "amount": 1000,
      "balance_before": 46000,
      "balance_after": 45000,
      "created_at": "2024-01-01T10:00:00Z"
    },
    ...
  ],
  "total": 45
}
```

### Payments

#### Initiate Deposit
```
POST /payments/deposit/initiate
Content-Type: application/json

{
  "amount": 1000
}

Response: 200 OK
{
  "success": true,
  "payment_url": "https://checkout.paystack.com/...",
  "paystack_reference": "ref_123456",
  "amount": 1000,
  "currency": "NGN"
}
```

#### Verify Deposit
```
GET /payments/deposit/verify?reference=ref_123456

Response: 200 OK
{
  "success": true,
  "status": "completed",
  "amount": 1000,
  "credited_amount": 970,
  "fee": 30
}
```

#### Paystack Webhook
```
POST /payments/paystack/webhook
Content-Type: application/json
X-Paystack-Signature: <signature>

{
  "event": "charge.success",
  "data": {...}
}

Response: 200 OK
{
  "success": true
}
```

### Friends

#### Search Players
```
GET /friends/search?query=john&limit=10

Response: 200 OK
[
  {
    "id": 123,
    "username": "john_doe",
    "status": "online",
    "profile_image": "https://..."
  },
  ...
]
```

#### Send Friend Request
```
POST /friends/request
Content-Type: application/json

{
  "to_user_id": 456
}

Response: 201 Created
{
  "success": true,
  "request_id": "req_123"
}
```

#### Accept Friend Request
```
POST /friends/request/{requestId}/accept

Response: 200 OK
{
  "success": true,
  "friend": {...}
}
```

#### Get Friends List
```
GET /friends/list

Response: 200 OK
[
  {
    "id": 456,
    "username": "jane_doe",
    "status": "online",
    "profile_image": "https://..."
  },
  ...
]
```

### Chat

#### Get Chat History
```
GET /chats/{friendId}/messages?limit=20&offset=0

Response: 200 OK
{
  "success": true,
  "messages": [
    {
      "id": "msg_123",
      "sender_id": 123,
      "content": "Hello!",
      "is_read": true,
      "created_at": "2024-01-01T10:00:00Z"
    },
    ...
  ]
}
```

#### Send Message (Socket.IO)
```
event: chat:message
payload:
{
  "chat_id": 789,
  "content": "How are you?"
}

response:
{
  "success": true,
  "message_id": "msg_124"
}
```

### Notifications

#### Get Notifications
```
GET /notifications?limit=20

Response: 200 OK
[
  {
    "id": "notif_123",
    "type": "game_matched",
    "title": "Match Found",
    "message": "You have been matched with 3 players",
    "is_read": false,
    "created_at": "2024-01-01T10:00:00Z"
  },
  ...
]
```

#### Mark as Read
```
PUT /notifications/{notificationId}/read

Response: 200 OK
{
  "success": true
}
```

### Admin Endpoints

#### Get Dashboard Stats
```
GET /admin/dashboard/stats

Response: 200 OK
{
  "total_users": 1523,
  "online_users": 456,
  "active_games": 78,
  "completed_games_today": 234,
  "total_platform_fees": 5000000,
  "total_deposits_today": 2000000,
  "pending_withdrawals": 45
}
```

#### Get Users List
```
GET /admin/users?limit=20&offset=0&search=john&status=active

Response: 200 OK
{
  "users": [...],
  "total": 156
}
```

#### Suspend User
```
POST /admin/users/{userId}/suspend
Content-Type: application/json

{
  "reason": "Suspicious activity",
  "duration_days": 7
}

Response: 200 OK
{
  "success": true,
  "message": "User suspended for 7 days"
}
```

#### Configure Payment Settings
```
POST /admin/settings/paystack
Content-Type: application/json

{
  "public_key": "pk_test_...",
  "secret_key": "sk_test_...",
  "mode": "test",
  "deposit_fee": 3,
  "withdrawal_fee": 5,
  "min_deposit": 1000,
  "max_deposit": 500000,
  "min_withdrawal": 5000,
  "max_withdrawal": 1000000,
  "enabled": true
}

Response: 200 OK
{
  "success": true,
  "message": "Settings updated successfully"
}
```

#### Test Paystack Connection
```
GET /admin/settings/paystack/test

Response: 200 OK
{
  "success": true,
  "status": "connected",
  "message": "Paystack connection successful"
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Server error

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Pagination

Default limit: 20, max: 100

```
?limit=50&offset=0
```

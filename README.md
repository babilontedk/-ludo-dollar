# Ludo Dollar - Complete Multiplayer Gaming Platform

A complete Flutter Android application with Node.js backend for real-time multiplayer Ludo gaming with integrated Paystack payment processing.

## Architecture Overview

```
Flutter Mobile App (Android)
        ↓
    Express.js API + Socket.IO
        ↓
    PostgreSQL Database
        ↓
    Paystack (Payment Gateway)
```

## Project Structure

```
ludo-dollar/
├── mobile/              # Flutter Android application
│   ├── lib/
│   ├── android/
│   ├── ios/
│   ├── pubspec.yaml
│   └── ...
├── backend/             # Node.js/Express server
│   ├── src/
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── package.json
│   └── ...
├── database/            # PostgreSQL migrations
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── docs/                # Documentation
│   ├── SETUP.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   └── DEVELOPMENT.md
├── .gitignore
└── README.md
```

## Technology Stack

- **Mobile**: Flutter 3.x, Dart 3.x, Android
- **Backend**: Node.js 18+, Express.js, Socket.IO
- **Database**: PostgreSQL 14+
- **Payments**: Paystack API
- **Real-time**: Socket.IO for multiplayer
- **Authentication**: JWT + Session management

## Version

v0.1.0 - Functional Demo

## Quick Links

- [Setup Instructions](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)

## Key Features

### Core Game
- Complete Ludo game engine
- 2-4 player support
- Server-authoritative game logic
- Real-time multiplayer via Socket.IO

### User System
- Secure authentication
- User profiles with stats
- Friend system
- Real-time chat

### Wallet & Payments
- Virtual coin wallet system
- Paystack integration
- Deposit/withdrawal
- Transaction ledger
- Anti-fraud measures

### Social Features
- Friend requests
- Play with friends
- Real-time notifications
- Game history
- Leaderboards
- Achievements

### Admin Panel
- User management
- Game management
- Finance dashboard
- Paystack configuration
- Shop management
- Analytics

## Demo Accounts (Development)

```
Demo Player 1: demo1@ludodollar.test / demo1234
Demo Player 2: demo2@ludodollar.test / demo1234
Demo Player 3: demo3@ludodollar.test / demo1234
Demo Player 4: demo4@ludodollar.test / demo1234
```

All demo accounts start with 50,000 virtual coins.

## Environment Setup

1. Clone the repository
2. Copy `.env.example` files and configure
3. Set up PostgreSQL database
4. Run migrations
5. Start backend server
6. Build and run Flutter app

See [SETUP.md](docs/SETUP.md) for detailed instructions.

## API Base URL

The backend uses a configurable base URL (default: `https://api.MYDOMAIN.com`).
Configure via environment variables in both backend and mobile.

## Payment Mode

Two independent settings:

**Game Mode**: Demo / Production
**Payment Mode**: Disabled / Paystack Test / Paystack Live

This allows testing without real payments.

## Security

- Server-authoritative game logic
- Secure password hashing
- JWT authentication
- Rate limiting
- Input validation
- HTTPS/SSL enforced
- Wallet ledger with atomic transactions
- Paystack secret keys never exposed to client
- Comprehensive audit logging

## Development

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for development workflow and testing procedures.

## License

Proprietary - All Rights Reserved

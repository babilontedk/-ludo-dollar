# Ludo Dollar - Setup Instructions

## Prerequisites

### Backend
- Node.js 18+ (https://nodejs.org/)
- npm or yarn
- PostgreSQL 14+ (https://www.postgresql.org/)

### Mobile
- Flutter 3.x (https://flutter.dev/docs/get-started/install)
- Android SDK (API level 21+)
- Android Studio or similar IDE

## Step 1: Clone Repository

```bash
git clone https://github.com/babilontedk/-ludo-dollar.git
cd ludo-dollar
```

## Step 2: Setup Database

```bash
# Create database
psql -U postgres
CREATE DATABASE ludo_dollar;
CREATE USER ludo_user WITH PASSWORD 'secure_password';
ALTER ROLE ludo_user SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE ludo_dollar TO ludo_user;
\\q
```

## Step 3: Setup Backend

```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your configuration
npm run dev
```

## Step 4: Setup Flutter

```bash
cd mobile
flutter pub get
flutter run
```

## Demo Accounts

```
Email: demo1@ludodollar.test / Password: demo1234
Email: demo2@ludodollar.test / Password: demo1234
Email: demo3@ludodollar.test / Password: demo1234
Email: demo4@ludodollar.test / Password: demo1234
```

All start with 50,000 virtual coins.

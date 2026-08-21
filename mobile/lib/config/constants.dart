const String API_BASE_URL = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000/api/v1');
const String SOCKET_URL = String.fromEnvironment('SOCKET_URL', defaultValue: 'http://localhost:3000');
const String ENVIRONMENT = String.fromEnvironment('ENVIRONMENT', defaultValue: 'development');

const int HTTP_TIMEOUT = 30000; // 30 seconds
const int SOCKET_TIMEOUT = 5000; // 5 seconds

// Feature Flags
const bool DEMO_MODE = true;
const bool PAYMENT_MODE_DISABLED = true; // Set to false to enable real payments
const String PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxx';

// Game Configuration
const List<int> GAME_LEVELS = [1000, 4000, 10000, 25000, 50000, 100000];
const int PLATFORM_FEE_PERCENTAGE = 25;
const int DEPOSIT_FEE_PERCENTAGE = 3;
const int WITHDRAWAL_FEE_PERCENTAGE = 5;

// Game Timeouts
const int MATCHMAKING_TIMEOUT = 30000; // 30 seconds
const int TURN_TIMEOUT = 60000; // 60 seconds
const int DISCONNECT_TIMEOUT = 120000; // 120 seconds

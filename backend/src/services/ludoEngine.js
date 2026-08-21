// Ludo Game Engine - Server-Authoritative Logic

class LudoGameEngine {
  static const int BOARD_SIZE = 52;
  static const int HOME_SIZE = 4;
  static const int TOTAL_PIECES = 16; // 4 pieces per player
  
  static const Map<String, int> PLAYER_START_POSITIONS = {
    'red': 0,
    'blue': 13,
    'green': 26,
    'yellow': 39,
  };
  
  static const Map<String, List<int>> HOME_POSITIONS = {
    'red': [52, 53, 54, 55],
    'blue': [56, 57, 58, 59],
    'green': [60, 61, 62, 63],
    'yellow': [64, 65, 66, 67],
  };

  // Roll dice (1-6)
  static int rollDice() {
    return (DateTime.now().millisecond % 6) + 1;
  }

  // Validate if a move is legal
  static bool isValidMove({
    required String color,
    required int pieceId,
    required int currentPosition,
    required int diceValue,
    required List<int> playerPieces,
    required List<int> capturedPieces,
  }) {
    // Piece must be on board or in start position
    if (currentPosition == -1) {
      // Piece in home, can only move if dice is 6
      return diceValue == 6;
    }

    int newPosition = currentPosition + diceValue;

    // Cannot move past home
    if (newPosition > HOME_POSITIONS[color]![3]) {
      return false;
    }

    // Cannot capture own pieces
    if (playerPieces.contains(newPosition)) {
      return false;
    }

    return true;
  }

  // Calculate new position after move
  static int calculateNewPosition({
    required String color,
    required int currentPosition,
    required int diceValue,
  }) {
    if (currentPosition == -1) {
      // Move from home to starting position
      return PLAYER_START_POSITIONS[color] ?? 0;
    }
    return currentPosition + diceValue;
  }

  // Check if a position captures opponent pieces
  static List<int> checkCaptures({
    required int newPosition,
    required String playerColor,
    required Map<String, List<int>> allPieces,
  }) {
    List<int> capturedPieces = [];

    allPieces.forEach((color, pieces) {
      if (color != playerColor && pieces.contains(newPosition)) {
        capturedPieces.add(newPosition);
      }
    });

    return capturedPieces;
  }

  // Check if player has won
  static bool checkWin({
    required String playerColor,
    required List<int> playerPieces,
  }) {
    final homePositions = HOME_POSITIONS[playerColor] ?? [];
    int piecesInHome = 0;

    for (int piece in playerPieces) {
      if (homePositions.contains(piece)) {
        piecesInHome++;
      }
    }

    return piecesInHome == 4; // All pieces home
  }

  // Get valid moves for a player
  static List<int> getValidMoves({
    required String playerColor,
    required int diceValue,
    required Map<int, String> boardState, // position -> color
    required List<int> playerPieces,
  }) {
    List<int> validMoves = [];

    for (int piece in playerPieces) {
      int currentPos = piece;
      int newPos = calculateNewPosition(
        color: playerColor,
        currentPosition: currentPos,
        diceValue: diceValue,
      );

      if (isValidMove(
        color: playerColor,
        pieceId: piece,
        currentPosition: currentPos,
        diceValue: diceValue,
        playerPieces: playerPieces,
        capturedPieces: [],
      )) {
        validMoves.add(piece);
      }
    }

    return validMoves;
  }

  // Calculate game payout
  static Map<String, int> calculatePayout({
    required int totalPot,
    required String winnerId,
    required int platformFeePercentage,
  }) {
    int platformFee = (totalPot * platformFeePercentage) ~/ 100;
    int winnerPayout = totalPot - platformFee;

    return {
      'winner_payout': winnerPayout,
      'platform_fee': platformFee,
      'total_pot': totalPot,
    };
  }
}

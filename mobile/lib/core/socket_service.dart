import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  late IO.Socket _socket;
  bool _connected = false;

  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  bool get isConnected => _connected;
  IO.Socket get socket => _socket;

  void connect(String userId) {
    _socket = IO.io(
      SOCKET_URL,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    _socket.onConnect((_) {
      _connected = true;
      _socket.emit('player:connect', {'userId': userId});
    });

    _socket.onDisconnect((_) {
      _connected = false;
    });

    _socket.connect();
  }

  void disconnect() {
    if (_connected) {
      _socket.disconnect();
      _connected = false;
    }
  }

  void joinGame(String gameId) {
    _socket.emit('game:queue:join', {'gameId': gameId});
  }

  void leaveGame(String gameId) {
    _socket.emit('game:queue:leave', {'gameId': gameId});
  }

  void rollDice(String gameId) {
    _socket.emit('game:dice:roll', {'gameId': gameId});
  }

  void movePlayer(String gameId, Map<String, dynamic> move) {
    _socket.emit('game:move', {'gameId': gameId, 'move': move});
  }

  void onGameStarted(Function(Map<String, dynamic>) callback) {
    _socket.on('game:started', (data) => callback(data));
  }

  void onDiceResult(Function(Map<String, dynamic>) callback) {
    _socket.on('game:dice:result', (data) => callback(data));
  }

  void onMoveExecuted(Function(Map<String, dynamic>) callback) {
    _socket.on('game:move:executed', (data) => callback(data));
  }

  void onGameEnded(Function(Map<String, dynamic>) callback) {
    _socket.on('game:ended', (data) => callback(data));
  }

  void onChatMessage(Function(Map<String, dynamic>) callback) {
    _socket.on('chat:message:new', (data) => callback(data));
  }

  void sendChatMessage(String chatId, String content) {
    _socket.emit('chat:message', {
      'chatId': chatId,
      'content': content,
    });
  }
}

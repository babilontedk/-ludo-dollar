const logger = require('../utils/logger');

const handleConnection = (socket, io) => {
  logger.info('Socket connected', { socketId: socket.id });
  
  socket.on('player:connect', (data) => {
    const { userId } = data;
    socket.userId = userId;
    socket.join(`user:${userId}`);
    logger.debug('Player socket authenticated', { socketId: socket.id, userId });
  });
};

const handleGameEvents = (socket, io) => {
  // Join matchmaking queue
  socket.on('game:queue:join', (data) => {
    const { gameId, userId } = data;
    socket.join(`game:${gameId}`);
    logger.debug('Player joined game queue', { gameId, userId });
  });
  
  // Game started
  socket.on('game:started', (data) => {
    const { gameId } = data;
    io.to(`game:${gameId}`).emit('game:started', data);
  });
  
  // Dice roll
  socket.on('game:dice:roll', (data) => {
    const { gameId, userId, diceValue } = data;
    io.to(`game:${gameId}`).emit('game:dice:result', {
      userId,
      diceValue,
      timestamp: new Date().toISOString()
    });
    logger.debug('Dice rolled', { gameId, userId, diceValue });
  });
  
  // Player move
  socket.on('game:move', (data) => {
    const { gameId, userId, move } = data;
    io.to(`game:${gameId}`).emit('game:move:executed', {
      userId,
      move,
      timestamp: new Date().toISOString()
    });
  });
  
  // Game ended
  socket.on('game:ended', (data) => {
    const { gameId, winnerId, payouts } = data;
    io.to(`game:${gameId}`).emit('game:ended', {
      winnerId,
      payouts,
      timestamp: new Date().toISOString()
    });
    logger.info('Game ended', { gameId, winnerId });
  });
  
  // Chat message
  socket.on('chat:message', (data) => {
    const { chatId, senderId, content } = data;
    io.to(`chat:${chatId}`).emit('chat:message:new', {
      senderId,
      content,
      timestamp: new Date().toISOString()
    });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { socketId: socket.id, userId: socket.userId });
  });
};

module.exports = {
  handleConnection,
  handleGameEvents
};

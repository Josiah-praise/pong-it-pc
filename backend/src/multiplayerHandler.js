const RoomManager = require('./roomManager');
const GameManager = require('./gameManager');
const LeaderboardManager = require('./leaderboardManager');

class MultiplayerHandler {
  constructor(io) {
    this.io = io;
    this.roomManager = new RoomManager();
    this.gameManager = new GameManager();
    this.leaderboardManager = new LeaderboardManager();
    this.gameLoops = new Map();

    setInterval(() => {
      this.roomManager.cleanupStaleRooms();
    }, 60000);
  }

  handleConnection(socket) {
    const username = socket.handshake.query.username;

    socket.on('createRoom', (player) => {
      this.handleCreateRoom(socket, player);
    });

    socket.on('joinRoom', (data) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on('findRandomMatch', (player) => {
      this.handleFindRandomMatch(socket, player);
    });

    socket.on('spectateGame', (data) => {
      this.handleSpectateGame(socket, data);
    });

    socket.on('leaveSpectate', () => {
      this.handleLeaveSpectate(socket);
    });

    socket.on('getActiveGames', () => {
      const activeGames = this.roomManager.getActiveGames();
      socket.emit('activeGamesList', activeGames);
    });

    socket.on('paddleMove', (data) => {
      this.handlePaddleMove(socket, data);
    });

    socket.on('pauseGame', () => {
      this.handlePauseGame(socket);
    });

    socket.on('forfeitGame', () => {
      this.handleForfeitGame(socket);
    });

    socket.on('requestRematch', () => {
      this.handleRematchRequest(socket);
    });

    socket.on('rematchResponse', (data) => {
      this.handleRematchResponse(socket, data);
    });

    socket.on('leaveRoom', () => {
      this.handleLeaveRoom(socket);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    socket.on('getLeaderboard', async () => {
      const leaderboard = await this.leaderboardManager.getTopPlayers(10);
      socket.emit('leaderboardUpdate', leaderboard);
    });

    if (username) {
      this.leaderboardManager.getPlayerRating(username).then(rating => {
        socket.emit('playerRating', { name: username, rating });
      });
    }
  }

  handleCreateRoom(socket, player) {
    const existingRoom = this.roomManager.getRoomByPlayer(socket.id);
    if (existingRoom) {
      socket.emit('error', { message: 'Already in a room' });
      return;
    }

    const roomCode = this.roomManager.createRoom(player, socket.id);
    socket.join(roomCode);

    socket.emit('roomCreated', {
      roomCode,
      room: this.roomManager.getRoom(roomCode)
    });
  }

  handleJoinRoom(socket, { roomCode, player }) {
    const existingRoom = this.roomManager.getRoomByPlayer(socket.id);
    if (existingRoom) {
      socket.emit('error', { message: 'Already in a room' });
      return;
    }

    const result = this.roomManager.joinRoom(roomCode, player, socket.id);

    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }

    socket.join(roomCode);

    this.io.to(roomCode).emit('roomReady', {
      room: result.room
    });

    this.startGame(roomCode);
  }

  handleFindRandomMatch(socket, player) {
    const existingRoom = this.roomManager.getRoomByPlayer(socket.id);
    if (existingRoom) {
      socket.emit('error', { message: 'Already in a room' });
      return;
    }

    const availableRooms = Array.from(this.roomManager.rooms.values())
      .filter(room => room.status === 'waiting' && !room.guest);

    if (availableRooms.length > 0) {
      const room = availableRooms[0];
      this.handleJoinRoom(socket, { roomCode: room.code, player });
    } else {
      const roomCode = this.roomManager.createRoom(player, socket.id);
      socket.join(roomCode);
      socket.emit('waitingForOpponent', { roomCode });
    }
  }

  startGame(roomCode) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || room.status !== 'ready') return;

    this.roomManager.startGame(roomCode);

    const gameState = this.gameManager.createGame(
      roomCode,
      room.host,
      room.guest
    );

    this.io.to(roomCode).emit('gameStart', gameState);

    this.startGameLoop(roomCode);
  }

  startGameLoop(roomCode) {
    if (this.gameLoops.has(roomCode)) {
      clearInterval(this.gameLoops.get(roomCode));
    }

    const interval = setInterval(() => {
      const result = this.gameManager.updateGameState(roomCode);

      if (!result) {
        clearInterval(interval);
        this.gameLoops.delete(roomCode);
        return;
      }

      if (result.gameOver) {
        this.handleGameOver(roomCode, result.winner, result.game);
        clearInterval(interval);
        this.gameLoops.delete(roomCode);
        return;
      }

      this.io.to(roomCode).emit('gameUpdate', result);
    }, 1000 / 60);

    this.gameLoops.set(roomCode, interval);
  }

  async handleGameOver(roomCode, winner, game) {
    const loser = game.players.find(p => p.socketId !== winner.socketId);

    if (!winner || !loser) {
      this.endGame(roomCode);
      return;
    }

    const ratingResult = await this.leaderboardManager.processGameResult(
      winner.name,
      loser.name
    );

    const gameOverData = {
      winner: winner.socketId,
      winnerName: winner.name,
      ratings: ratingResult ? {
        [winner.socketId]: ratingResult.winner.newRating,
        [loser.socketId]: ratingResult.loser.newRating
      } : {},
      stats: {
        duration: Date.now() - game.startTime,
        maxSpeed: Math.max(Math.abs(game.ballVelocity.x || 0), Math.abs(game.ballVelocity.y || 0)),
        hits: game.hits || 0,
        score: game.score || [0, 0]
      },
      finalScore: game.score || [0, 0]
    };

    this.io.to(roomCode).emit('gameOver', gameOverData);

    const leaderboard = await this.leaderboardManager.getTopPlayers(10);
    this.io.emit('leaderboardUpdate', leaderboard);

    this.endGame(roomCode);
  }

  handlePaddleMove(socket, { position }) {
    const game = this.gameManager.getGameByPlayer(socket.id);
    if (!game) return;

    const updatedGame = this.gameManager.updatePaddle(game.roomCode, socket.id, position);
    if (updatedGame) {
      this.io.to(game.roomCode).emit('gameUpdate', updatedGame);
    }
  }

  handleLeaveRoom(socket) {
    const room = this.roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    const roomCode = room.code;

    socket.leave(roomCode);

    this.io.to(roomCode).emit('opponentLeft');

    this.endGame(roomCode);

    this.roomManager.removePlayerFromRoom(socket.id);
  }

  handleSpectateGame(socket, { roomCode, spectatorName }) {
    const result = this.roomManager.addSpectator(roomCode, socket.id, spectatorName);

    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }

    socket.join(roomCode);

    const game = this.gameManager.getGame(roomCode);
    if (game) {
      socket.emit('spectateStart', game);
    }

    const spectatorCount = result.room.spectators ? result.room.spectators.size : 0;
    this.io.to(roomCode).emit('spectatorUpdate', { count: spectatorCount });
  }

  handleLeaveSpectate(socket) {
    for (const [roomCode, room] of this.roomManager.rooms.entries()) {
      if (room.spectators) {
        const wasSpectating = Array.from(room.spectators).some(s => s.socketId === socket.id);
        if (wasSpectating) {
          this.roomManager.removeSpectator(roomCode, socket.id);
          socket.leave(roomCode);

          const spectatorCount = room.spectators ? room.spectators.size : 0;
          this.io.to(roomCode).emit('spectatorUpdate', { count: spectatorCount });
          break;
        }
      }
    }
  }

  handleDisconnect(socket) {
    this.handleLeaveSpectate(socket);

    const room = this.roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    const roomCode = room.code;

    this.io.to(roomCode).emit('opponentDisconnected');

    this.endGame(roomCode);

    this.roomManager.removePlayerFromRoom(socket.id);
  }

  handlePauseGame(socket) {
    const game = this.gameManager.getGameByPlayer(socket.id);
    if (!game) return;

    const result = this.gameManager.pauseGame(game.roomCode, socket.id);

    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }

    const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
    const playerName = game.players[playerIndex].name;

    this.io.to(game.roomCode).emit('gamePaused', {
      pausedBy: playerName,
      pausesRemaining: result.pausesRemaining
    });

    const pauseTimeout = setTimeout(() => {
      this.gameManager.resumeGame(game.roomCode);
      this.io.to(game.roomCode).emit('gameResumed');
    }, 10000);

    game.pauseTimeout = pauseTimeout;
  }

  handleForfeitGame(socket) {
    const game = this.gameManager.getGameByPlayer(socket.id);
    if (!game) return;

    const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
    const winner = game.players[1 - playerIndex];

    this.io.to(game.roomCode).emit('playerForfeited', {
      forfeitedPlayer: game.players[playerIndex].name,
      winner: winner.name
    });

    this.handleGameOver(game.roomCode, winner, game);
  }

  handleRematchRequest(socket) {
    const room = this.roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    const playerIndex = room.host.socketId === socket.id ? 0 : 1;
    const opponent = playerIndex === 0 ? room.guest : room.host;

    if (!opponent) return;

    const opponentSocket = this.io.sockets.sockets.get(opponent.socketId);
    if (opponentSocket) {
      opponentSocket.emit('rematchRequested', {
        from: playerIndex === 0 ? room.host.name : room.guest.name
      });
    }
  }

  handleRematchResponse(socket, { accepted }) {
    const room = this.roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    if (accepted) {
      this.roomManager.startGame(room.code);

      const gameState = this.gameManager.createGame(
        room.code,
        room.host,
        room.guest
      );

      this.io.to(room.code).emit('gameStart', gameState);
      this.startGameLoop(room.code);
    } else {
      this.io.to(room.code).emit('rematchDeclined');
    }
  }

  handleDisconnect(socket) {
    this.handleLeaveSpectate(socket);

    const room = this.roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    const roomCode = room.code;

    const game = this.gameManager.getGame(roomCode);
    if (game && game.status === 'active') {
      const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const winner = game.players[1 - playerIndex];

        this.io.to(roomCode).emit('opponentDisconnected', {
          disconnectedPlayer: game.players[playerIndex].name,
          winner: winner.name
        });

        this.handleGameOver(roomCode, winner, game);
      }
    } else {
      this.io.to(roomCode).emit('opponentDisconnected');
    }

    this.endGame(roomCode);
    this.roomManager.removePlayerFromRoom(socket.id);
  }

  endGame(roomCode) {
    if (this.gameLoops.has(roomCode)) {
      clearInterval(this.gameLoops.get(roomCode));
      this.gameLoops.delete(roomCode);
    }

    const game = this.gameManager.getGame(roomCode);
    if (game && game.pauseTimeout) {
      clearTimeout(game.pauseTimeout);
    }

    this.gameManager.endGame(roomCode);
    this.roomManager.endGame(roomCode);
  }
}

module.exports = MultiplayerHandler;

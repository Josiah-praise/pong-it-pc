class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(roomCode, player1, player2) {
    const gameState = {
      id: roomCode,
      roomCode,
      players: [
        { ...player1, index: 0, socketId: player1.socketId, pausesRemaining: 2 },
        { ...player2, index: 1, socketId: player2.socketId, pausesRemaining: 2 }
      ],
      score: [0, 0],
      ballPos: { x: 0, y: 0 },
      ballVelocity: { x: 0, y: 0 },
      paddles: {
        player1: { y: 0 },
        player2: { y: 0 }
      },
      startTime: Date.now(),
      hits: 0,
      status: 'active',
      isPaused: false,
      pausedBy: null,
      pauseTimeout: null
    };

    this.resetBall(gameState);
    this.games.set(roomCode, gameState);

    return gameState;
  }

  getGame(roomCode) {
    return this.games.get(roomCode);
  }

  getGameByPlayer(socketId) {
    for (const [roomCode, game] of this.games.entries()) {
      if (game.players.some(p => p.socketId === socketId)) {
        return game;
      }
    }
    return null;
  }

  updatePaddle(roomCode, socketId, position) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    const playerIndex = game.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const paddleKey = `player${playerIndex + 1}`;
    const currentPos = game.paddles[paddleKey].y;
    const damping = 0.8;

    game.paddles[paddleKey].y = currentPos + (position - currentPos) * damping;

    return game;
  }

  pauseGame(roomCode, playerSocketId) {
    const game = this.games.get(roomCode);
    if (!game || game.isPaused) return { success: false, error: 'Cannot pause' };

    const playerIndex = game.players.findIndex(p => p.socketId === playerSocketId);
    if (playerIndex === -1) return { success: false, error: 'Player not found' };

    const player = game.players[playerIndex];
    if (player.pausesRemaining <= 0) {
      return { success: false, error: 'No pauses remaining' };
    }

    player.pausesRemaining--;
    game.isPaused = true;
    game.pausedBy = playerSocketId;

    return { success: true, pausesRemaining: player.pausesRemaining };
  }

  resumeGame(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) return false;

    game.isPaused = false;
    game.pausedBy = null;
    if (game.pauseTimeout) {
      clearTimeout(game.pauseTimeout);
      game.pauseTimeout = null;
    }

    return true;
  }

  updateGameState(roomCode) {
    const game = this.games.get(roomCode);
    if (!game || game.status !== 'active' || game.isPaused) return null;

    game.ballPos.x += game.ballVelocity.x * 0.0055;
    game.ballPos.y += game.ballVelocity.y * 0.0055;

    if (Math.abs(game.ballPos.y) > 0.95) {
      game.ballVelocity.y *= -1;
      game.ballPos.y = Math.sign(game.ballPos.y) * 0.95;
    }

    if (Math.abs(game.ballPos.x) > 1) {
      if (game.ballPos.x > 1) {
        game.score[0]++;
      } else {
        game.score[1]++;
      }

      if (Math.max(...game.score) >= 5) {
        game.status = 'finished';
        const winnerIndex = game.score[0] > game.score[1] ? 0 : 1;
        return { gameOver: true, winner: game.players[winnerIndex], game };
      }

      this.resetBall(game);
      return game;
    }

    const playerIds = Object.keys(game.paddles);
    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const paddle = game.paddles[playerId];
      const isLeftPaddle = i === 0;
      const paddleX = isLeftPaddle ? -0.95 : 0.95;

      const paddleHitboxSize = 0.18;
      const paddleY = paddle.y;

      const ballNearPaddleX = isLeftPaddle
        ? (game.ballPos.x <= paddleX + 0.02 && game.ballVelocity.x < 0)
        : (game.ballPos.x >= paddleX - 0.02 && game.ballVelocity.x > 0);

      if (ballNearPaddleX) {
        if (Math.abs(game.ballPos.y - paddleY) <= paddleHitboxSize) {
          game.ballVelocity.x *= -1.05;
          game.hits = (game.hits || 0) + 1;

          const hitPosition = (game.ballPos.y - paddleY) / paddleHitboxSize;
          game.ballVelocity.y = hitPosition * 2;

          const maxYVelocity = Math.abs(game.ballVelocity.x) * Math.tan(Math.PI / 6);
          game.ballVelocity.y = Math.max(Math.min(game.ballVelocity.y, maxYVelocity), -maxYVelocity);

          game.ballPos.x = paddleX + (isLeftPaddle ? 0.03 : -0.03);
        }
      }
    }

    return game;
  }

  resetBall(game) {
    game.ballPos = { x: 0, y: 0 };
    const speed = 2.2;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    game.ballVelocity = {
      x: speed * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1),
      y: speed * Math.sin(angle)
    };
  }

  endGame(roomCode) {
    const game = this.games.get(roomCode);
    if (game) {
      game.status = 'finished';
      this.games.delete(roomCode);
    }
    return game;
  }
}

module.exports = GameManager;

const WIN_SCORE = Number.isFinite(parseInt(process.env.WIN_SCORE || '', 10))
  ? parseInt(process.env.WIN_SCORE || '', 10)
  : 1000;

class GameManager {
  constructor() {
    this.games = new Map();
    this.gameEvents = new Map();
  }

  createGame(roomCode, player1, player2) {
    const gameState = {
      id: roomCode,
      roomCode,
      players: [
        { ...player1, index: 0, socketId: player1.socketId, pausesRemaining: 1 },
        { ...player2, index: 1, socketId: player2.socketId, pausesRemaining: 1 }
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
      pauseTimeout: null,
      powerUps: {
        speedBoosts: [null, null],
        shields: [null, null],
        multiball: null
      },
      extraBalls: []
    };

    this.resetBall(gameState);
    this.games.set(roomCode, gameState);
    this.gameEvents.set(roomCode, []);

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
    const multiplier = this.getSpeedBoostMultiplier(game, playerIndex);
    const baseDamping = 0.8;
    const damping = Math.min(0.98, baseDamping * multiplier);

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

    if (!game.pauseHistory) {
      game.pauseHistory = {};
    }

    if (game.pauseHistory[playerSocketId]) {
      return { success: false, error: 'You have already used your pause' };
    }

    player.pausesRemaining--;
    game.pauseHistory[playerSocketId] = true;
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
      const rightSide = game.ballPos.x > 1;
      const defendingPlayerIndex = rightSide ? 1 : 0;
      if (this.isShieldActive(roomCode, defendingPlayerIndex)) {
        this.consumeShield(roomCode, defendingPlayerIndex);
        this.queueEvent(roomCode, {
          type: 'shield-block',
          playerIndex: defendingPlayerIndex,
        });

        game.ballPos.x = rightSide ? 0.95 : -0.95;
        game.ballVelocity.x = Math.abs(game.ballVelocity.x) * (rightSide ? -1 : 1);
        game.ballVelocity.x *= 1.05;
      } else {
        const scoringIndex = rightSide ? 0 : 1;
        return this.processScore(roomCode, scoringIndex);
      }
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
          game.ballVelocity.x *= -1.08;
          const boostMultiplier = this.getSpeedBoostMultiplier(game, i);
          if (boostMultiplier > 1) {
            game.ballVelocity.x *= boostMultiplier;
          }
          game.hits = (game.hits || 0) + 1;

          const hitPosition = (game.ballPos.y - paddleY) / paddleHitboxSize;
          game.ballVelocity.y = hitPosition * 2;

          const maxYVelocity = Math.abs(game.ballVelocity.x) * Math.tan(Math.PI / 6);
          game.ballVelocity.y = Math.max(Math.min(game.ballVelocity.y, maxYVelocity), -maxYVelocity);

          game.ballPos.x = paddleX + (isLeftPaddle ? 0.03 : -0.03);
        }
      }
    }

    const extraResult = this.updateExtraBalls(roomCode);
    if (extraResult) {
      return extraResult;
    }

    this.updateMultiball(roomCode);

    return game;
  }

  getSpeedBoostMultiplier(game, playerIndex) {
    if (!game.powerUps || !game.powerUps.speedBoosts) {
      return 1;
    }

    const boost = game.powerUps.speedBoosts[playerIndex];
    if (!boost) return 1;

    if (boost.expiresAt && boost.expiresAt <= Date.now()) {
      game.powerUps.speedBoosts[playerIndex] = null;
      return 1;
    }

    return boost.multiplier || 1.2;
  }

  activateSpeedBoost(roomCode, playerIndex, multiplier, durationMs) {
    const game = this.games.get(roomCode);
    if (!game) return false;

    if (!game.powerUps) {
      game.powerUps = { speedBoosts: [null, null], shields: [null, null], multiball: null };
    }
    game.extraBalls = game.extraBalls || [];

    const expiresAt = Date.now() + durationMs;
    game.powerUps.speedBoosts[playerIndex] = {
      multiplier,
      expiresAt,
    };

    return true;
  }

  clearSpeedBoost(roomCode, playerIndex) {
    const game = this.games.get(roomCode);
    if (!game || !game.powerUps || !game.powerUps.speedBoosts) return false;

    if (game.powerUps.speedBoosts[playerIndex]) {
      game.powerUps.speedBoosts[playerIndex] = null;
      return true;
    }
    return false;
  }

  clearAllPowerUps(roomCode) {
    const game = this.games.get(roomCode);
    if (!game || !game.powerUps) return;
    if (game.powerUps.speedBoosts) {
      game.powerUps.speedBoosts = [null, null];
    }
    if (game.powerUps.shields) {
      game.powerUps.shields = [null, null];
    }
    if (game.powerUps.multiball) {
      game.powerUps.multiball = null;
    }
    game.extraBalls = [];
  }

  resetBall(game) {
    game.ballPos = { x: 0, y: 0 };
    const speed = 2.8;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    game.ballVelocity = {
      x: speed * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1),
      y: speed * Math.sin(angle)
    };
  }

  isShieldActive(roomCode, playerIndex) {
    const game = this.games.get(roomCode);
    if (!game || !game.powerUps || !game.powerUps.shields) return false;
    return !!game.powerUps.shields[playerIndex];
  }

  activateShield(roomCode, playerIndex) {
    const game = this.games.get(roomCode);
    if (!game) return false;

    if (!game.powerUps) {
      game.powerUps = { speedBoosts: [null, null], shields: [null, null] };
    }

    if (game.powerUps.shields[playerIndex]) {
      return false;
    }

    game.powerUps.shields[playerIndex] = { activatedAt: Date.now() };
    return true;
  }

  consumeShield(roomCode, playerIndex) {
    const game = this.games.get(roomCode);
    if (!game || !game.powerUps || !game.powerUps.shields) return;
    game.powerUps.shields[playerIndex] = null;
  }

  processScore(roomCode, scoringIndex) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    if (scoringIndex === 0) {
      game.score[0] += 1;
    } else {
      game.score[1] += 1;
    }

    if (Math.max(...game.score) >= WIN_SCORE) {
      game.status = 'finished';
      const winnerIndex = game.score[0] > game.score[1] ? 0 : 1;
      return { gameOver: true, winner: game.players[winnerIndex], game };
    }

    if (game.powerUps?.multiball) {
      const owner = game.powerUps.multiball?.owner;
      game.powerUps.multiball = null;
      game.extraBalls = [];
      this.queueEvent(roomCode, { type: 'multiball-end', playerIndex: owner });
    } else {
      game.extraBalls = [];
    }

    this.resetBall(game);
    return game;
  }

  activateMultiball(roomCode, playerIndex, durationMs) {
    const game = this.games.get(roomCode);
    if (!game) return false;

    if (game.powerUps?.multiball) {
      return false;
    }

    const baseBall = {
      pos: { ...game.ballPos },
      velocity: { ...game.ballVelocity }
    };

    const extra = this.createExtraBall(baseBall, playerIndex);
    game.extraBalls = game.extraBalls || [];
    game.extraBalls.push(extra);

    if (!game.powerUps) {
      game.powerUps = { speedBoosts: [null, null], shields: [null, null], multiball: null };
    }

    game.powerUps.multiball = {
      expiresAt: Date.now() + durationMs,
      owner: playerIndex
    };

    this.queueEvent(roomCode, {
      type: 'multiball-spawn',
      playerIndex
    });

    return true;
  }

  updateMultiball(roomCode) {
    const game = this.games.get(roomCode);
    if (!game || !game.powerUps?.multiball) return;

    if (game.powerUps.multiball.expiresAt <= Date.now()) {
      const owner = game.powerUps.multiball?.owner;
      game.powerUps.multiball = null;
      game.extraBalls = [];
      this.queueEvent(roomCode, {
        type: 'multiball-end',
        playerIndex: owner
      });
    }
  }

  createExtraBall(baseBall, playerIndex) {
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const speed = 2.5;
    const direction = playerIndex === 0 ? 1 : -1;

    return {
      pos: {
        x: baseBall.pos.x,
        y: baseBall.pos.y
      },
      velocity: {
        x: speed * Math.cos(angle) * direction,
        y: speed * Math.sin(angle)
      }
    };
  }

  updateExtraBalls(roomCode) {
    const game = this.games.get(roomCode);
    if (!game || !game.extraBalls || game.extraBalls.length === 0) return null;

    for (let index = 0; index < game.extraBalls.length; index++) {
      const ball = game.extraBalls[index];

      ball.pos.x += ball.velocity.x * 0.0055;
      ball.pos.y += ball.velocity.y * 0.0055;

      if (Math.abs(ball.pos.y) > 0.95) {
        ball.velocity.y *= -1;
        ball.pos.y = Math.sign(ball.pos.y) * 0.95;
      }

      if (Math.abs(ball.pos.x) > 1) {
        const rightSide = ball.pos.x > 1;
        const defendingPlayerIndex = rightSide ? 1 : 0;
        if (this.isShieldActive(roomCode, defendingPlayerIndex)) {
          this.consumeShield(roomCode, defendingPlayerIndex);
          this.queueEvent(roomCode, {
            type: 'shield-block',
            playerIndex: defendingPlayerIndex,
          });

          ball.pos.x = rightSide ? 0.95 : -0.95;
          ball.velocity.x = Math.abs(ball.velocity.x) * (rightSide ? -1 : 1);
          ball.velocity.x *= 1.05;
        } else {
          const scoringIndex = rightSide ? 0 : 1;
          return this.processScore(roomCode, scoringIndex);
        }
      }

      const playerIds = Object.keys(game.paddles);
      for (let i = 0; i < playerIds.length; i++) {
        const paddle = game.paddles[playerIds[i]];
        const isLeftPaddle = i === 0;
        const paddleX = isLeftPaddle ? -0.95 : 0.95;
        const paddleHitboxSize = 0.18;
        const paddleY = paddle.y;

        const ballNearPaddleX = isLeftPaddle
          ? (ball.pos.x <= paddleX + 0.02 && ball.velocity.x < 0)
          : (ball.pos.x >= paddleX - 0.02 && ball.velocity.x > 0);

        if (ballNearPaddleX) {
          if (Math.abs(ball.pos.y - paddleY) <= paddleHitboxSize) {
            ball.velocity.x *= -1.08;
            const boostMultiplier = this.getSpeedBoostMultiplier(game, i);
            if (boostMultiplier > 1) {
              ball.velocity.x *= boostMultiplier;
            }

            const hitPosition = (ball.pos.y - paddleY) / paddleHitboxSize;
            ball.velocity.y = hitPosition * 2;

            const maxYVelocity = Math.abs(ball.velocity.x) * Math.tan(Math.PI / 6);
            ball.velocity.y = Math.max(Math.min(ball.velocity.y, maxYVelocity), -maxYVelocity);

            ball.pos.x = paddleX + (isLeftPaddle ? 0.03 : -0.03);
          }
        }
      }
    }

    return null;
  }

  endGame(roomCode) {
    const game = this.games.get(roomCode);
    if (game) {
      game.status = 'finished';
      this.games.delete(roomCode);
    }
    this.gameEvents.delete(roomCode);
    return game;
  }

  queueEvent(roomCode, event) {
    if (!this.gameEvents.has(roomCode)) {
      this.gameEvents.set(roomCode, []);
    }
    this.gameEvents.get(roomCode).push(event);
  }

  consumeEvents(roomCode) {
    if (!this.gameEvents.has(roomCode)) {
      return [];
    }
    const events = this.gameEvents.get(roomCode);
    this.gameEvents.set(roomCode, []);
    return events;
  }
}

module.exports = GameManager;

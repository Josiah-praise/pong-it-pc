const RoomManager = require('./roomManager');
const GameManager = require('./gameManager');
const LeaderboardManager = require('./leaderboardManager');
const Game = require('./models/Game');
const signatureService = require('./services/signatureService');

class MultiplayerHandler {
  constructor(io) {
    this.io = io;
    this.roomManager = new RoomManager();
    this.gameManager = new GameManager();
    this.leaderboardManager = new LeaderboardManager();
    this.gameLoops = new Map();
    this.gameOverPlayers = new Map(); // Track players in game-over state: username -> socketId

    setInterval(() => {
      this.roomManager.cleanupStaleRooms();
    }, 60000);
  }

  handleConnection(socket) {
    const username = socket.handshake.query.username;

    socket.on('createRoom', (player, roomCode) => {
      this.handleCreateRoom(socket, player, roomCode);
    });

    socket.on('joinRoom', (data) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on('findRandomMatch', (player) => {
      this.handleFindRandomMatch(socket, player);
    });

    socket.on('player2StakeCompleted', (data) => {
      this.handlePlayer2StakeCompleted(socket, data);
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

    socket.on('leaveRoomBeforeStaking', ({ roomCode }) => {
      this.handleLeaveRoomBeforeStaking(socket, roomCode);
    });

    socket.on('leaveAbandonedRoom', ({ roomCode }) => {
      console.log(`🔔 Received leaveAbandonedRoom event - Socket: ${socket.id}, Room: ${roomCode}`);
      this.handleLeaveAbandonedRoom(socket, roomCode);
    });

    socket.on('joinGameOverRoom', ({ username }) => {
      console.log(`🎮 Player ${username} joined game-over state with socket ${socket.id}`);
      this.gameOverPlayers.set(username, socket.id);

      // Re-attach player socket to room if game is preserving for rematch
      const room = this.roomManager.getRoomByUsername(username);
      if (room) {
        const attached = this.roomManager.attachPlayerSocket(room.code, username, socket.id);
        if (attached) {
          console.log(`🔄 Reattached ${username} to room ${room.code} with new socket ${socket.id}`);
          // Ensure socket joins the original room channel so rematch start events propagate
          socket.join(room.code);
        }
      }
    });

    socket.on('leaveGameOver', () => {
      this.handleLeaveGameOver(socket);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
      // Clean up game-over tracking
      for (const [username, socketId] of this.gameOverPlayers.entries()) {
        if (socketId === socket.id) {
          this.gameOverPlayers.delete(username);
          console.log(`🚪 Player ${username} left game-over state`);
          
          // Check if this was the last player in a preserved room
          this.checkAndCleanupPreservedRoom(username);
          break;
        }
      }
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

  handleCreateRoom(socket, player, providedRoomCode) {
    const existingRoom = this.roomManager.getRoomByPlayer(socket.id);
    if (existingRoom) {
      socket.emit('error', { message: 'Already in a room' });
      return;
    }

    // Use provided room code for staked matches, or generate new one
    const roomCode = providedRoomCode || this.roomManager.createRoom(player, socket.id);

    // If room code was provided, create room with that specific code
    if (providedRoomCode) {
      this.roomManager.createRoomWithCode(roomCode, player, socket.id);
    }

    socket.join(roomCode);

    console.log(`Room created: ${roomCode} by ${player.name} (${socket.id})`);

    socket.emit('roomCreated', {
      roomCode,
      room: this.roomManager.getRoom(roomCode)
    });
  }

  async handleJoinRoom(socket, { roomCode, player }) {
    console.log(`🔵 handleJoinRoom called - Room: ${roomCode}, Player: ${player?.name}, Socket: ${socket.id}`);

    const existingRoom = this.roomManager.getRoomByPlayer(socket.id);
    if (existingRoom) {
      console.log(`❌ Player ${socket.id} already in room ${existingRoom.code}`);
      socket.emit('error', { message: 'Already in a room' });
      return;
    }

    const result = this.roomManager.joinRoom(roomCode, player, socket.id);

    if (!result.success) {
      console.log(`❌ Failed to join room ${roomCode}: ${result.error}`);
      socket.emit('error', { message: result.error });
      return;
    }

    console.log(`✅ Player ${player?.name} joined room ${roomCode}`);
    socket.join(roomCode);

    // Check if this is a staked match
    try {
      console.log(`📡 Checking for staked match in database: ${roomCode}`);
      const gameRecord = await Game.findOne({ roomCode });

      if (gameRecord) {
        console.log(`📊 Game record:`, JSON.stringify(gameRecord, null, 2));

        if (gameRecord.isStaked && !gameRecord.player2TxHash) {
          // This is a staked match and Player 2 hasn't staked yet
          console.log(`💎 Staked match detected! Prompting Player 2 to stake ${gameRecord.stakeAmount} ETH`);
          
          // Mark the room as staked
          const room = this.roomManager.getRoom(roomCode);
          if (room) {
            room.isStaked = true;
            room.hostStaked = true;
            room.guestStaked = false;
          }
          
          socket.emit('stakedMatchJoined', {
            roomCode,
            stakeAmount: gameRecord.stakeAmount,
            player1Address: gameRecord.player1Address
          });

          this.io.to(roomCode).emit('waitingForPlayer2Stake', {
            stakeAmount: gameRecord.stakeAmount
          });

          console.log(`⏳ Waiting for Player 2 to stake...`);
          return; // Don't start game yet
        } else {
          console.log(`ℹ️  Not a staked match or Player 2 already staked. isStaked: ${gameRecord.isStaked}, player2TxHash: ${gameRecord.player2TxHash}`);
        }
      } else {
        console.log(`ℹ️  No game record found - proceeding with normal match`);
      }
    } catch (error) {
      console.error('❌ Error checking for staked match:', error);
      // Continue with normal game start if check fails
    }

    console.log(`🎮 Starting normal game for room ${roomCode}`);
    this.io.to(roomCode).emit('roomReady', {
      room: result.room
    });

    this.startGame(roomCode);
  }

  handlePlayer2StakeCompleted(socket, { roomCode }) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    console.log('Player 2 staking completed for room:', roomCode);

    // Mark that guest has successfully staked
    this.roomManager.markGuestStaked(roomCode);

    this.io.to(roomCode).emit('roomReady', { room });

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
    if (!room || (room.status !== 'ready' && room.status !== 'finished')) return;

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
    console.log(`\n🎮 ========== GAME OVER ==========`);
    console.log(`🏆 Room: ${roomCode}, Winner: ${winner?.name}`);
    console.log(`📊 Game state:`, { 
      players: game.players?.map(p => p.name), 
      score: game.score 
    });
    
    const loser = game.players.find(p => p.socketId !== winner.socketId);

    if (!winner || !loser) {
      console.log(`⚠️ Invalid game over state - ending game without processing`);
      this.endGame(roomCode);
      return;
    }
    
    console.log(`👥 Winner: ${winner.name}, Loser: ${loser.name}`);

    const ratingResult = await this.leaderboardManager.processGameResult(
      winner.name,
      loser.name
    );

    // Save game result to database (both staked and casual games)
    try {
      // Determine which player won (player1 or player2)
      const winnerRole = game.players[0].socketId === winner.socketId ? 'player1' : 'player2';

      // Check if game record already exists
      let gameRecord = await Game.findOne({ roomCode });

      // Convert score array to object if needed
      const scoreObject = game.score ? { player1: game.score[0], player2: game.score[1] } : { player1: 0, player2: 0 };

      if (gameRecord) {
        // Update existing game (staked or casual)
        if (gameRecord.isStaked) {
          console.log(`💎 Staked match ended. Updating game record with winner...`);
        } else {
          console.log(`🎮 Casual match ended. Updating game record with winner...`);
        }

        gameRecord.winner = winnerRole;
        gameRecord.score = scoreObject;
        gameRecord.status = 'finished';
        gameRecord.endedAt = new Date();
        gameRecord.winnerAddress = winnerRole === 'player1' ? gameRecord.player1Address : gameRecord.player2Address;

        // Generate signature if staked and not already generated
        if (gameRecord.isStaked && gameRecord.winnerAddress && !gameRecord.winnerSignature) {
          if (signatureService.isReady()) {
            try {
              const signature = await signatureService.signWinner(
                roomCode,
                gameRecord.winnerAddress,
                gameRecord.stakeAmount
              );
              gameRecord.winnerSignature = signature;
              console.log(`✅ Winner signature generated for room: ${roomCode}`);
              console.log(`🔐 Winner signature:`, signature.slice(0, 20) + '...');
            } catch (error) {
              console.error('❌ Failed to generate signature:', error);
            }
          } else {
            console.warn('⚠️  Signature service not ready, skipping signature generation');
          }
        }

        await gameRecord.save();
        console.log(`✅ Game ${roomCode} updated with winner: ${winnerRole}`);
      } else {
        // No existing record - create new casual game
        console.log(`🎮 Creating casual game record for room: ${roomCode}`);

        gameRecord = new Game({
          roomCode,
          player1: {
            name: game.players[0].name,
            rating: ratingResult ? ratingResult.winner.oldRating : 1000
          },
          player2: {
            name: game.players[1].name,
            rating: ratingResult ? ratingResult.loser.oldRating : 1000
          },
          winner: winnerRole,
          score: scoreObject,
          isStaked: false,
          status: 'finished',
          endedAt: new Date()
        });

        await gameRecord.save();
        console.log(`✅ Casual game ${roomCode} saved to database`);
      }
    } catch (error) {
      console.error('Error saving game record:', error);
      // Continue with normal game end flow even if save fails
    }

    // Check if this is a staked game
    const room = this.roomManager.getRoom(roomCode);
    const isStaked = room?.isStaked || false;
    
    // Get game record for stake amount if staked
    let stakeAmount = null;
    if (isStaked) {
      try {
        const gameRecord = await Game.findOne({ roomCode });
        stakeAmount = gameRecord?.stakeAmount || null;
      } catch (error) {
        console.error('Error fetching game record for stake amount:', error);
      }
    }

    const gameOverData = {
      winner: winner.socketId,
      winnerName: winner.name,
      isStaked,
      stakeAmount,
      roomCode,
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

    // Preserve room for rematch (only for non-staked games)
    // Note: 'room' is already declared above on line 390
    const shouldPreserveRoom = room && !room.isStaked;
    
    // Mark room as finished BEFORE old sockets disconnect
    if (room && shouldPreserveRoom) {
      room.status = 'finished';
      if (room.host) {
        room.host.socketId = room.host.socketId || null;
      }
      if (room.guest) {
        room.guest.socketId = room.guest.socketId || null;
      }
      console.log(`🏠 Game over for room ${roomCode} - marked as finished, preserving for rematch`);
    } else {
      console.log(`🏠 Game over for room ${roomCode} - preserving room: ${shouldPreserveRoom}`);
    }
    
    this.endGame(roomCode, shouldPreserveRoom);
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
    if (!room) {
      console.log(`⚠️ handleLeaveRoom: No room found for socket ${socket.id}`);
      return;
    }

    const roomCode = room.code;
    console.log(`🚪 handleLeaveRoom: Player leaving room ${roomCode}`);

    socket.leave(roomCode);

    this.io.to(roomCode).emit('opponentLeft');

    console.log(`🗑️  handleLeaveRoom: Destroying room ${roomCode}`);
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

  handleLeaveRoomBeforeStaking(socket, roomCode) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) {
      console.log(`⚠️ No room found for code ${roomCode}`);
      return;
    }

    const isGuest = room.guest && room.guest.socketId === socket.id;

    console.log(`🚪 handleLeaveRoomBeforeStaking - Room: ${roomCode}`, {
      isStaked: room.isStaked,
      isGuest,
      guestStaked: room.guestStaked
    });

    // Only handle if this is a staked game and the guest hasn't staked
    if (room.isStaked && isGuest && !room.guestStaked) {
      console.log(`✅ Guest intentionally leaving staked room ${roomCode} before staking - keeping room open`);
      this.roomManager.removePlayerFromRoom(socket.id);
      // Notify host that guest left before staking (optional - can show a message)
      this.io.to(roomCode).emit('guestLeftBeforeStaking', { 
        message: 'Player left before staking. Room is still open.'
      });
      return;
    }

    // If not a staked game or guest has staked, handle as normal leave
    this.handleLeaveRoom(socket);
  }

  /**
   * Handle when host intentionally leaves an abandoned staked room
   * (e.g., clicking "Back" or "Forfeit" button before anyone joins)
   */
  async handleLeaveAbandonedRoom(socket, roomCode) {
    console.log(`🔵 handleLeaveAbandonedRoom called - Socket: ${socket.id}, Room: ${roomCode}`);
    
    const room = this.roomManager.getRoom(roomCode);
    if (!room) {
      console.log(`⚠️ No room found for code ${roomCode}`);
      return;
    }

    const isHost = room.host && room.host.socketId === socket.id;

    console.log(`🚪 handleLeaveAbandonedRoom - Room: ${roomCode}`, {
      isStaked: room.isStaked,
      isHost,
      hasGuest: !!room.guest,
      roomStatus: room.status
    });

    // Validate this is actually an abandonment scenario
    if (room.isStaked && isHost && !room.guest) {
      console.log(`💰 Host intentionally leaving staked room ${roomCode} before anyone joined - marking for refund`);
      await this.markGameAsAbandoned(roomCode);
      this.endGame(roomCode);
      this.roomManager.removePlayerFromRoom(socket.id);
      
      // Notify client that abandonment was processed
      socket.emit('abandonmentProcessed', {
        message: 'Room abandoned. You can reclaim your stake from "Unclaimed Stakes".'
      });
    } else {
      // Invalid abandonment attempt - treat as normal forfeit
      console.log(`⚠️ Invalid abandonment attempt for room ${roomCode} - guest exists or not staked`);
      this.handleForfeitGame(socket);
    }
  }

  async handleDisconnect(socket) {
    console.log(`\n🔌 ========== DISCONNECT ==========`);
    console.log(`👤 Socket ${socket.id} disconnecting`);
    
    this.handleLeaveSpectate(socket);

    const room = this.roomManager.getRoomByPlayer(socket.id);
    if (!room) {
      console.log(`⚠️ No room found for disconnecting socket ${socket.id}`);
      return;
    }

    const roomCode = room.code;
    const isHost = room.host && room.host.socketId === socket.id;
    console.log(`🏠 Room ${roomCode}: isHost=${isHost}, isStaked=${room.isStaked}`);
    const isGuest = room.guest && room.guest.socketId === socket.id;

    const activeGame = this.gameManager.getGame(roomCode);
    const isGameFinished = !activeGame || activeGame.status === 'finished';

    console.log(`🔌 handleDisconnect - Room: ${roomCode}`, {
      isStaked: room.isStaked,
      isHost,
      isGuest,
      guestStaked: room.guestStaked,
      hostStaked: room.hostStaked,
      roomStatus: room.status,
      hasGuest: !!room.guest,
      hasActiveGame: !!activeGame,
      gameStatus: activeGame?.status
    });

    // CASE 1: Host leaves staked room before anyone joins -> Mark as abandoned
    if (room.isStaked && isHost && !room.guest) {
      console.log(`💰 Host abandoned staked room ${roomCode} before anyone joined - marking for refund`);
      await this.markGameAsAbandoned(roomCode);
      this.endGame(roomCode);
      this.roomManager.removePlayerFromRoom(socket.id);
      return;
    }

    // CASE 2: Guest leaves staked room before staking -> Keep room open
    if (room.isStaked && isGuest && !room.guestStaked) {
      console.log(`🔄 Guest disconnected from staked room ${roomCode} before staking - keeping room open`);
      this.roomManager.detachPlayerFromRoom(socket.id);
      // Notify host that guest left before staking
      this.io.to(roomCode).emit('guestLeftBeforeStaking', {
        message: 'Player disconnected before staking. Room is still open.'
      });
      return;
    }

    // CASE 3: Game is finished (game over screen) -> Don't destroy room, keep for rematch
    if (room.status === 'finished' || isGameFinished) {
      console.log(`🎮 Game finished for room ${roomCode} - old socket disconnecting, keeping room for rematch`);
      this.roomManager.detachPlayerFromRoom(socket.id);
      return;
    }

    // CASE 4: Active game - opponent disconnected during gameplay -> end the game
    console.log(`❌ Ending active game for room ${roomCode} (status: ${room.status}) - opponent disconnected during gameplay`);
    this.io.to(roomCode).emit('opponentDisconnected');

    this.endGame(roomCode);

    this.roomManager.detachPlayerFromRoom(socket.id);
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

  async handleForfeitGame(socket) {
    // SAFETY CHECK: Detect if this is actually an abandonment scenario
    const room = this.roomManager.getRoomByPlayer(socket.id);
    if (room) {
      const isHost = room.host && room.host.socketId === socket.id;
      
      // If host forfeits a staked game with no guest, treat as abandonment
      if (room.isStaked && isHost && !room.guest) {
        console.log(`⚠️ Forfeit detected but no opponent - converting to abandonment for room ${room.code}`);
        await this.markGameAsAbandoned(room.code);
        this.endGame(room.code);
        this.roomManager.removePlayerFromRoom(socket.id);
        
        socket.emit('abandonmentProcessed', {
          message: 'Room abandoned. You can reclaim your stake from "Unclaimed Stakes".'
        });
        return;
      }
    }

    // Normal forfeit logic
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
    const requesterUsername = socket.handshake.query.username;
    
    console.log(`\n🔄 ========== REMATCH REQUEST ==========`);
    console.log(`👤 From: ${requesterUsername} (socket: ${socket.id})`);
    console.log(`📋 GameOver players tracked:`, Array.from(this.gameOverPlayers.entries()));
    console.log(`🗂️  Total rooms active:`, this.roomManager.rooms.size);
    
    // DEBUG: List all rooms
    console.log(`📦 All active rooms:`);
    for (const [code, room] of this.roomManager.rooms.entries()) {
      console.log(`   - ${code}: host=${room.host?.name}, guest=${room.guest?.name}, status=${room.status}, isStaked=${room.isStaked}`);
    }
    
    // Try to find room by username (more reliable than socket.id for game-over state)
    const room = this.roomManager.getRoomByUsername(requesterUsername);
    
    if (!room) {
      console.log(`❌ No room found for ${requesterUsername}`);
      console.log(`🔍 This likely means the room was destroyed before game-over screen`);
      socket.emit('error', { 
        message: 'Game session ended. Please start a new match.' 
      });
      return;
    }

    console.log(`✅ Found room: ${room.code} (host: ${room.host?.name}, guest: ${room.guest?.name}, isStaked: ${room.isStaked})`);

    // Check if this is a staked game
    if (room.isStaked) {
      console.log(`🚫 Blocking rematch for staked game: ${room.code}`);
      socket.emit('error', { 
        message: 'Rematch not available for staked games. Please start a new match.' 
      });
      return;
    }

    // Determine opponent
    const opponent = room.host?.name === requesterUsername ? room.guest : room.host;

    if (!opponent) {
      console.log(`⚠️ No opponent found in room ${room.code}`);
      socket.emit('error', { 
        message: 'No opponent found. Cannot send rematch request.' 
      });
      return;
    }

    // Find opponent's current socket ID from game-over tracking
    const opponentSocketId = this.gameOverPlayers.get(opponent.name);
    console.log(`🔍 Looking for opponent: ${opponent.name}, tracked socket: ${opponentSocketId}`);
    
    if (!opponentSocketId) {
      console.log(`❌ Opponent ${opponent.name} not in game-over state`);
      socket.emit('error', { 
        message: 'Opponent has left. Cannot send rematch request.' 
      });
      return;
    }
    
    const opponentSocket = this.io.sockets.sockets.get(opponentSocketId);

    if (opponentSocket) {
      console.log(`✅ Sending rematch request from ${requesterUsername} to ${opponent.name}`);
      opponentSocket.emit('rematchRequested', {
        from: requesterUsername
      });
    } else {
      console.log(`❌ Opponent ${opponent.name} socket ${opponentSocketId} not found in active sockets`);
      socket.emit('error', { 
        message: 'Opponent has disconnected. Cannot send rematch request.' 
      });
    }
    
    console.log(`=========================================\n`);
  }

  handleRematchResponse(socket, { accepted }) {
    const room = this.roomManager.getRoomByPlayer(socket.id);
    if (!room) {
      console.log(`⚠️ handleRematchResponse: No room found for socket ${socket.id}`);
      return;
    }

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
      const hostSocketId = room.host?.name ? this.gameOverPlayers.get(room.host.name) : null;
      const guestSocketId = room.guest?.name ? this.gameOverPlayers.get(room.guest.name) : null;

      let requesterSocketId = null;

      if (socket.id === hostSocketId && guestSocketId) {
        requesterSocketId = guestSocketId;
      } else if (socket.id === guestSocketId && hostSocketId) {
        requesterSocketId = hostSocketId;
      }

      if (requesterSocketId) {
        const requesterSocket = this.io.sockets.sockets.get(requesterSocketId);
        if (requesterSocket) {
          requesterSocket.emit('rematchDeclined');
        }
      }
    }
  }

  /**
   * Mark a staked game as abandoned and generate refund signature
   * This happens when the host leaves before anyone joins
   */
  async markGameAsAbandoned(roomCode) {
    try {
      console.log(`🟡 Starting markGameAsAbandoned for room: ${roomCode}`);
      
      const game = await Game.findOne({ roomCode });
      
      if (!game) {
        console.error(`❌ Game not found for abandoned room: ${roomCode}`);
        return;
      }

      console.log(`🟡 Game found:`, {
        roomCode: game.roomCode,
        isStaked: game.isStaked,
        player1Address: game.player1Address,
        player2TxHash: game.player2TxHash,
        status: game.status
      });

      // Only mark as abandoned if it's a staked game and no player 2
      if (!game.isStaked || game.player2TxHash) {
        console.log(`⚠️ Game ${roomCode} is not eligible for abandonment`, {
          isStaked: game.isStaked,
          hasPlayer2Tx: !!game.player2TxHash
        });
        return;
      }

      console.log(`🟡 Generating refund signature...`);
      
      // Generate refund signature
      const signature = await signatureService.signAbandonedRefund(
        roomCode,
        game.player1Address
      );

      console.log(`🟡 Signature generated, updating game record...`);

      // Update game record
      game.status = 'abandoned';
      game.canRefund = true;
      game.refundSignature = signature;
      await game.save();

      console.log(`✅ Game ${roomCode} marked as abandoned - refund signature generated`);
    } catch (error) {
      console.error(`❌ Error marking game ${roomCode} as abandoned:`, error);
    }
  }

  handleLeaveGameOver(socket) {
    const username = socket.handshake.query.username;
    if (!username) return;

    console.log(`👋 Player ${username} explicitly leaving game-over screen`);
    
    // Remove from tracking
    this.gameOverPlayers.delete(username);
    
    // Check if this was the last player in a preserved room
    this.checkAndCleanupPreservedRoom(username);
  }

  checkAndCleanupPreservedRoom(username) {
    // Find rooms where this player was involved
    const allRooms = Array.from(this.roomManager.rooms.values());
    
    for (const room of allRooms) {
      const involvedInRoom = 
        room.host?.name === username || 
        room.guest?.name === username;
      
      if (!involvedInRoom) continue;
      
      // Check if both players have left game-over state
      const hostInGameOver = room.host && this.gameOverPlayers.has(room.host.name);
      const guestInGameOver = room.guest && this.gameOverPlayers.has(room.guest.name);
      
      if (!hostInGameOver && !guestInGameOver) {
        console.log(`🧹 Both players left game-over - cleaning up preserved room ${room.code}`);
        this.roomManager.endGame(room.code);
      }
    }
  }

  endGame(roomCode, preserveRoom = false) {
    if (this.gameLoops.has(roomCode)) {
      clearInterval(this.gameLoops.get(roomCode));
      this.gameLoops.delete(roomCode);
    }

    const game = this.gameManager.getGame(roomCode);
    if (game && game.pauseTimeout) {
      clearTimeout(game.pauseTimeout);
    }

    this.gameManager.endGame(roomCode);
    
    // Only destroy the room if explicitly requested (e.g., player forfeits/abandons)
    // For normal game completion, preserve room for rematch
    if (!preserveRoom) {
    this.roomManager.endGame(roomCode);
    }
  }
}

module.exports = MultiplayerHandler;

require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const GameHandlers = require('./gameHandlers');
const MultiplayerHandler = require('./multiplayerHandler');
const Player = require('./models/Player');
const Game = require('./models/Game');
const signatureService = require('./services/signatureService');
const powerUpService = require('./services/powerUpService');

const app = express();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pong-it';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✓ Connected to MongoDB');
  console.log(`  Database: ${mongoose.connection.name}`);
})
.catch((error) => {
  console.error('✗ MongoDB connection error:', error);
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Normalize FRONTEND_URL by removing trailing slash
const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '');

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['*']
  },
  allowEIO3: true,
  transports: ['websocket'],
  path: '/socket.io/',
  connectTimeout: 45000,
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
  allowUpgrades: false,
  perMessageDeflate: false
});

const gameHandlers = new GameHandlers(io);
const multiplayerHandler = new MultiplayerHandler(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    frontend_url: FRONTEND_URL || 'not set'
  });
});

// ============ PLAYER ENDPOINTS ============

// Get all players
app.get('/players', async (req, res) => {
  try {
    const playersList = await Player.find()
      .sort({ rating: -1 })
      .lean();
    res.status(200).json(playersList);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get top players
app.get('/players/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const playersList = await Player.find()
      .sort({ rating: -1 })
      .limit(limit)
      .lean();
    res.status(200).json(playersList);
  } catch (error) {
    console.error('Error fetching top players:', error);
    res.status(500).json({ error: 'Failed to fetch top players' });
  }
});

// Legacy rankings endpoint (for backwards compatibility)
app.get('/rankings', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const leaderboard = await multiplayerHandler.leaderboardManager.getTopPlayers(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// Proxy endpoint for backwards compatibility
app.get('/api/rankings/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const playersList = await Player.find()
      .sort({ rating: -1 })
      .limit(limit)
      .lean();
    res.json(playersList);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// Get player by name
app.get('/players/:name', async (req, res) => {
  try {
    const player = await Player.findOne({ name: req.params.name }).lean();
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.status(200).json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Proxy endpoint for backwards compatibility
app.get('/api/players/:name', async (req, res) => {
  try {
    const player = await Player.findOne({ name: req.params.name }).lean();
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.status(200).json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Get or create player by wallet address (NEW - wallet-based auth)
app.post('/players/by-wallet', async (req, res) => {
  try {
    const { walletAddress, name } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const normalizedAddress = walletAddress.toLowerCase().trim();
    let player = await Player.findOne({ walletAddress: normalizedAddress });

    if (!player) {
      // New wallet - name is required
      if (!name) {
        return res.status(404).json({ 
          error: 'Player not found',
          needsUsername: true 
        });
      }

      const trimmedName = name.trim();

      // Check if username is already taken
      const existingPlayer = await Player.findOne({ name: trimmedName });
      if (existingPlayer) {
        return res.status(409).json({ 
          error: 'Username already taken',
          usernameTaken: true 
        });
      }

      // Create new player
      player = new Player({
        walletAddress: normalizedAddress,
        name: trimmedName,
        rating: 1000,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        lastActive: new Date()
      });

      await player.save();
      console.log(`✅ Created new player: ${trimmedName} (${normalizedAddress})`);
      return res.status(201).json({ 
        player,
        isNewPlayer: true 
      });
    }

    // Existing player - update last active (NO name changes allowed)
    player.lastActive = new Date();
    await player.save();
    
    console.log(`✅ Retrieved existing player: ${player.name} (${normalizedAddress})`);
    res.status(200).json({ 
      player,
      isNewPlayer: false 
    });
  } catch (error) {
    console.error('Error in /players/by-wallet:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Username already taken',
        usernameTaken: true 
      });
    }
    
    res.status(500).json({ error: 'Failed to authenticate player' });
  }
});

// Get player by wallet address
app.get('/players/by-wallet/:walletAddress', async (req, res) => {
  try {
    const normalizedAddress = req.params.walletAddress.toLowerCase().trim();
    const player = await Player.findOne({ walletAddress: normalizedAddress }).lean();
    
    if (!player) {
      return res.status(404).json({ 
        error: 'Player not found',
        needsUsername: true 
      });
    }
    
    res.status(200).json(player);
  } catch (error) {
    console.error('Error fetching player by wallet:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Create or update player (LEGACY - kept for backwards compatibility)
app.post('/players', async (req, res) => {
  try {
    const { name, rating, gameResult, walletAddress } = req.body;

    // NEW: If walletAddress provided, use wallet-based auth
    if (walletAddress) {
      return res.redirect(307, '/players/by-wallet');
    }

    // LEGACY: Name-based system (deprecated)
    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    let player = await Player.findOne({ name });

    if (!player) {
      // Create new player (legacy format)
      player = new Player({
        walletAddress: `legacy_${name}_${Date.now()}`, // Generate pseudo-address for legacy players
        name,
        rating: rating || 1000,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        lastActive: new Date()
      });
    } else {
      // Update existing player
      if (rating !== undefined) {
        player.rating = rating;
      }
      player.lastActive = new Date();
    }

    // Update stats if game result is provided
    if (gameResult) {
      player.gamesPlayed += 1;
      if (gameResult === 'win') {
        player.wins += 1;
      } else if (gameResult === 'loss') {
        player.losses += 1;
      }
    }

    await player.save();
    res.status(200).json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Update player rating after a game
app.patch('/players/:name/rating', async (req, res) => {
  try {
    const { name } = req.params;
    const { newRating, gameResult } = req.body;

    if (newRating === undefined) {
      return res.status(400).json({ error: 'New rating is required' });
    }

    const player = await Player.findOne({ name });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    player.rating = newRating;
    player.lastActive = new Date();

    // Update game stats if provided
    if (gameResult) {
      player.gamesPlayed += 1;
      if (gameResult === 'win') {
        player.wins += 1;
      } else if (gameResult === 'loss') {
        player.losses += 1;
      }
    }

    await player.save();
    res.status(200).json(player);
  } catch (error) {
    console.error('Error updating player rating:', error);
    res.status(500).json({ error: 'Failed to update player rating' });
  }
});

// ============ POWER-UP ENDPOINTS ============

app.get('/powerups/summary/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const summary = await powerUpService.getPlayerSummary(walletAddress);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching power-up summary:', error);
    res.status(500).json({ error: 'Failed to fetch power-up summary' });
  }
});

app.post('/powerups/crate/open', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const reveal = await powerUpService.revealCrate(walletAddress);
    res.status(200).json(reveal);
  } catch (error) {
    if (error.message === 'NO_PENDING_CRATE') {
      return res.status(404).json({ error: 'No pending crate' });
    }
    if (error.message === 'CRATE_EXPIRED') {
      return res.status(410).json({ error: 'Crate expired' });
    }
    console.error('Error revealing crate:', error);
    res.status(500).json({ error: 'Failed to reveal crate' });
  }
});

app.post('/powerups/crate/consumed', async (req, res) => {
  try {
    const { walletAddress, txHash } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const state = await powerUpService.markCrateConsumed(walletAddress, txHash);
    res.status(200).json(state);
  } catch (error) {
    console.error('Error marking crate consumed:', error);
    res.status(500).json({ error: 'Failed to update crate state' });
  }
});

app.get('/powerups/delegations/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const delegations = await powerUpService.listDelegations(walletAddress);
    res.status(200).json(delegations);
  } catch (error) {
    console.error('Error fetching delegations:', error);
    res.status(500).json({ error: 'Failed to fetch delegations' });
  }
});

app.post('/powerups/delegations', async (req, res) => {
  try {
    const { ownerWallet, renterWallet, tokenId, amount, txHash } = req.body;
    if (!ownerWallet || !renterWallet || tokenId === undefined || amount === undefined) {
      return res.status(400).json({ error: 'Missing delegation parameters' });
    }

    const record = await powerUpService.recordDelegation({
      ownerWallet,
      renterWallet,
      tokenId,
      amount,
      txHash,
    });
    res.status(200).json(record);
  } catch (error) {
    if (error.message === 'INVALID_ADDRESSES') {
      return res.status(400).json({ error: 'Invalid wallet addresses' });
    }
    console.error('Error recording delegation:', error);
    res.status(500).json({ error: 'Failed to record delegation' });
  }
});

app.post('/powerups/delegations/cancel', async (req, res) => {
  try {
    const { ownerWallet, renterWallet, tokenId } = req.body;
    if (!ownerWallet || !renterWallet || tokenId === undefined) {
      return res.status(400).json({ error: 'Missing cancellation parameters' });
    }

    const record = await powerUpService.cancelDelegation({ ownerWallet, renterWallet, tokenId });
    res.status(200).json(record);
  } catch (error) {
    if (error.message === 'INVALID_ADDRESSES') {
      return res.status(400).json({ error: 'Invalid wallet addresses' });
    }
    console.error('Error cancelling delegation:', error);
    res.status(500).json({ error: 'Failed to cancel delegation' });
  }
});

// ============ GAME ENDPOINTS ============

// Create or save game result
app.post('/games', async (req, res) => {
  try {
    console.log(`\n💾 ========== POST /games ==========`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    const {
      roomCode,
      player1,
      player2,
      winner,
      score,
      isStaked,
      stakeAmount,
      player1Address,
      player2Address,
      player1TxHash,
      player2TxHash,
      status
    } = req.body;

    console.log(`📊 Request body:`, {
      roomCode,
      player1Name: player1?.name,
      player2Name: player2?.name,
      isStaked,
      stakeAmount,
      player1Address,
      hasPlayer1Tx: !!player1TxHash,
      hasPlayer2Tx: !!player2TxHash,
      status
    });

    if (!roomCode) {
      console.log(`❌ Missing room code`);
      console.log(`💾 ========== POST /games END (ERROR) ==========\n`);
      return res.status(400).json({ error: 'Room code is required' });
    }

    // Check if game already exists
    console.log(`🔍 Checking if game ${roomCode} already exists...`);
    let game = await Game.findOne({ roomCode });

    // Convert score array to object if needed
    let scoreObject = score;
    if (score && Array.isArray(score)) {
      scoreObject = { player1: score[0], player2: score[1] };
    }

    if (game) {
      console.log(`✅ Game exists - updating...`);
      // Update existing game
      if (player2) game.player2 = player2;
      if (winner) game.winner = winner;
      if (scoreObject) game.score = scoreObject;
      if (player2Address) game.player2Address = player2Address?.toLowerCase();
      if (player2TxHash) game.player2TxHash = player2TxHash;
      if (winner) {
        game.status = 'finished';
        game.endedAt = new Date();
        game.winnerAddress = winner === 'player1' ? game.player1Address : game.player2Address;
      }
      console.log(`📝 Updated fields:`, {
        hasPlayer2: !!player2,
        hasWinner: !!winner,
        hasScore: !!scoreObject,
        status: game.status
      });
    } else {
      console.log(`📝 Game doesn't exist - creating new game...`);
      // Create new game
      game = new Game({
        roomCode,
        player1,
        player2,
        winner,
        score: scoreObject,
        isStaked: isStaked || false,
        stakeAmount,
        player1Address: player1Address?.toLowerCase(),
        player2Address: player2Address?.toLowerCase(),
        player1TxHash,
        player2TxHash,
        status: status || (player2 ? 'playing' : 'waiting')
      });
      console.log(`✅ New game created:`, {
        roomCode,
        isStaked: game.isStaked,
        stakeAmount: game.stakeAmount,
        status: game.status
      });
    }

    // Generate signature if game finished and staked
    if (game.isStaked && game.winner && game.winnerAddress && !game.winnerSignature) {
      if (signatureService.isReady()) {
        try {
          const signature = await signatureService.signWinner(
            roomCode,
            game.winnerAddress,
            stakeAmount
          );
          game.winnerSignature = signature;
          console.log('✅ Winner signature generated for room:', roomCode);
        } catch (error) {
          console.error('❌ Failed to generate signature:', error);
          // Continue saving game even if signature fails
        }
      } else {
        console.warn('⚠️  Signature service not ready, skipping signature generation');
      }
    }

    console.log(`💾 Saving game to database...`);
    await game.save();
    console.log(`✅ Game saved successfully`);
    
    // If this is a staked game with player1TxHash, mark the room as staked
    if (game.isStaked && game.player1TxHash) {
      console.log(`💰 This is a staked game - attempting to mark room in memory...`);
      const room = multiplayerHandler.roomManager.getRoom(roomCode);
      if (room) {
        room.isStaked = true;
        room.hostStaked = true;
        console.log(`✅ Room ${roomCode} marked as STAKED in memory`);
        console.log(`📋 Room state:`, {
          code: roomCode,
          isStaked: room.isStaked,
          hostStaked: room.hostStaked,
          hasGuest: !!room.guest
        });
      } else {
        console.log(`⚠️ Room ${roomCode} NOT FOUND in memory (room will be marked as staked when created)`);
      }
    }
    
    console.log(`💾 ========== POST /games END (SUCCESS) ==========\n`);
    res.status(200).json(game);
  } catch (error) {
    console.error(`❌ Error saving game:`, error);
    console.error(`❌ Error type: ${error.name}`);
    console.error(`❌ Error message: ${error.message}`);
    console.log(`💾 ========== POST /games END (ERROR) ==========\n`);
    res.status(500).json({ error: 'Failed to save game' });
  }
});

// Get user's wins (for claiming interface)
app.get('/games/my-wins', async (req, res) => {
  try {
    const { address, limit = 20, offset = 0 } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const query = {
      winnerAddress: address.toLowerCase(),
      isStaked: true,
      status: 'finished'
    };

    // Fetch games with pagination
    const games = await Game.find(query)
      .sort({ endedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalGames = await Game.countDocuments(query);

    res.status(200).json({
      games,
      pagination: {
        total: totalGames,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalGames
      }
    });
  } catch (error) {
    console.error('Error fetching user wins:', error);
    res.status(500).json({ error: 'Failed to fetch wins' });
  }
});

// Mark game as claimed
app.post('/games/:gameId/claimed', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { txHash } = req.body;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.claimed) {
      return res.status(400).json({ error: 'Prize already claimed' });
    }

    await game.markAsClaimed(txHash);

    res.status(200).json({ success: true, game });
  } catch (error) {
    console.error('Error marking game as claimed:', error);
    res.status(500).json({ error: 'Failed to mark game as claimed' });
  }
});

// Get player game history with filters
app.get('/games/player/:playerName/history', async (req, res) => {
  try {
    const { playerName } = req.params;
    const {
      filter = 'all',        // all, wins, losses
      staked,                // true, false, or undefined (all)
      limit = 50,
      offset = 0
    } = req.query;

    if (!playerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    // Build the query
    const query = {
      status: 'finished', // Only finished games
      $or: [
        { 'player1.name': playerName },
        { 'player2.name': playerName }
      ]
    };

    // Filter by staked/unstaked
    if (staked !== undefined) {
      query.isStaked = staked === 'true';
    }

    // Filter by wins/losses
    if (filter === 'wins') {
      query.winner = { $exists: true };
      query.$or = [
        { 'player1.name': playerName, winner: 'player1' },
        { 'player2.name': playerName, winner: 'player2' }
      ];
    } else if (filter === 'losses') {
      query.winner = { $exists: true };
      query.$or = [
        { 'player1.name': playerName, winner: 'player2' },
        { 'player2.name': playerName, winner: 'player1' }
      ];
    }

    // Fetch games with pagination
    const games = await Game.find(query)
      .sort({ endedAt: -1, createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalGames = await Game.countDocuments(query);

    // Calculate stats
    const allGamesQuery = {
      status: 'finished',
      $or: [
        { 'player1.name': playerName },
        { 'player2.name': playerName }
      ]
    };

    const allGames = await Game.find(allGamesQuery).lean();

    const stats = {
      totalGames: allGames.length,
      wins: allGames.filter(g =>
        (g.player1?.name === playerName && g.winner === 'player1') ||
        (g.player2?.name === playerName && g.winner === 'player2')
      ).length,
      losses: allGames.filter(g =>
        (g.player1?.name === playerName && g.winner === 'player2') ||
        (g.player2?.name === playerName && g.winner === 'player1')
      ).length,
      stakedGames: allGames.filter(g => g.isStaked).length,
      totalEarnings: allGames
        .filter(g =>
          g.isStaked &&
          g.claimed &&
          ((g.player1?.name === playerName && g.winner === 'player1') ||
           (g.player2?.name === playerName && g.winner === 'player2'))
        )
        .reduce((sum, g) => sum + parseFloat(g.stakeAmount || 0), 0)
    };

    stats.winRate = stats.totalGames > 0
      ? ((stats.wins / stats.totalGames) * 100).toFixed(1)
      : 0;

    // Transform games for frontend
    const gamesWithDetails = games.map(game => ({
      ...game,
      opponent: game.player1?.name === playerName
        ? game.player2?.name
        : game.player1?.name,
      result: !game.winner ? 'draw' :
        (game.player1?.name === playerName && game.winner === 'player1') ||
        (game.player2?.name === playerName && game.winner === 'player2')
          ? 'win' : 'loss',
      finalScore: game.score ?
        (game.player1?.name === playerName
          ? `${game.score.player1}-${game.score.player2}`
          : `${game.score.player2}-${game.score.player1}`)
        : 'N/A'
    }));

    res.status(200).json({
      games: gamesWithDetails,
      stats,
      pagination: {
        total: totalGames,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalGames
      }
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

// Get game by room code
app.get('/games/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const game = await Game.findOne({ roomCode }).lean();

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Get user's abandoned stakes (unclaimed refunds)
app.get('/games/abandoned-stakes/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const query = {
      player1Address: address.toLowerCase(),
      status: 'abandoned',
      canRefund: true,
      refundClaimed: false
    };

    // Fetch games with pagination
    const games = await Game.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalGames = await Game.countDocuments(query);

    res.status(200).json({
      games,
      pagination: {
        total: totalGames,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalGames
      }
    });
  } catch (error) {
    console.error('Error fetching abandoned stakes:', error);
    res.status(500).json({ error: 'Failed to fetch abandoned stakes' });
  }
});

// Mark refund as claimed
app.post('/games/:gameId/refund-claimed', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { txHash } = req.body;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.refundClaimed) {
      return res.status(400).json({ error: 'Refund already claimed' });
    }

    await game.markRefundAsClaimed(txHash);

    res.status(200).json({ success: true, game });
  } catch (error) {
    console.error('Error marking refund as claimed:', error);
    res.status(500).json({ error: 'Failed to mark refund as claimed' });
  }
});

try {
  io.engine.on("headers", (headers, req) => {
    console.log('Headers being sent:', headers);
    console.log('Request headers:', req.headers);
  });

  io.engine.on("initial_headers", (headers, req) => {
    console.log('Initial headers being sent:', headers);
    console.log('Initial request headers:', req.headers);
  });

  io.on('connection', (socket) => {
    const username = socket.handshake.query.username;
    console.log('New connection:', {
      socketId: socket.id,
      username,
      transport: socket.conn.transport.name,
      address: socket.handshake.address
    });

    const existingSockets = Array.from(io.sockets.sockets.values());
    for (const existingSocket of existingSockets) {
      if (existingSocket.id !== socket.id &&
          existingSocket.handshake.query.username === username) {
        console.log('Cleaning up old connection for:', username);
        gameHandlers.handleDisconnect(existingSocket);
        existingSocket.disconnect(true);
      }
    }

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    gameHandlers.handleConnection(socket);
    multiplayerHandler.handleConnection(socket);

    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected:`, reason);
    });
  });

  io.engine.on("connection_error", (err) => {
    console.error('Connection error:', {
      type: err.type,
      description: err.description,
      context: err.context,
      require: err.require,
      message: err.message,
      stack: err.stack
    });
  });

  httpServer.on('error', (error) => {
    console.error('HTTP Server error:', error);
  });

  io.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });

  const PORT = process.env.PORT || 8080;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Server accepting connections from: ${FRONTEND_URL || "all origins (debug mode)"}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
    
    const addresses = Object.values(require('os').networkInterfaces())
      .flat()
      .filter(({family, internal}) => family === 'IPv4' && !internal)
      .map(({address}) => address);
    
    console.log('Server bound to addresses:', addresses);

    // Self-ping mechanism to prevent cold starts on Render free tier
    // Only runs when KEEP_RENDER_ALIVE environment variable is set
    if (process.env.KEEP_RENDER_ALIVE === 'true') {
      // Render free tier spins down after 15 minutes of inactivity
      const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
      setInterval(() => {
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: PORT,
          path: '/health',
          method: 'GET'
        };

        const req = http.request(options, (res) => {
          console.log(`Self-ping successful: ${res.statusCode}`);
        });

        req.on('error', (error) => {
          console.error('Self-ping failed:', error.message);
        });

        req.end();
      }, PING_INTERVAL);

      console.log(`Self-ping enabled: pinging /health every 14 minutes to prevent cold start`);
    }
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 

// here goes nothing
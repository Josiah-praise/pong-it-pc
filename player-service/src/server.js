require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Player = require('./models/Player');
const Game = require('./models/Game');
const signatureService = require('./services/signatureService');

const app = express();
const PORT = process.env.PORT || 5001;

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

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.BACKEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'player-ranking-service' });
});

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

// Create or update player
app.post('/players', async (req, res) => {
  try {
    const { name, rating, gameResult } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    let player = await Player.findOne({ name });

    if (!player) {
      // Create new player
      player = new Player({
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

// ============ GAME ENDPOINTS ============

// Create or save game result
app.post('/games', async (req, res) => {
  try {
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
      player2TxHash
    } = req.body;

    if (!roomCode) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    // Check if game already exists
    let game = await Game.findOne({ roomCode });

    // Convert score array to object if needed
    let scoreObject = score;
    if (score && Array.isArray(score)) {
      scoreObject = { player1: score[0], player2: score[1] };
    }

    if (game) {
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
    } else {
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
        status: player2 ? 'playing' : 'waiting'
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

    await game.save();
    res.status(200).json(game);
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ error: 'Failed to save game' });
  }
});

// Get user's wins (for claiming interface)
app.get('/games/my-wins', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const games = await Game.find({
      winnerAddress: address.toLowerCase(),
      isStaked: true,
      status: 'finished'
    })
      .sort({ endedAt: -1 })
      .lean();

    res.status(200).json(games);
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Player ranking service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS allowed origins: ${process.env.FRONTEND_URL}, ${process.env.BACKEND_URL}`);
}); 
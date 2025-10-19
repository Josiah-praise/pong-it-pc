require('dotenv').config();
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  player1: {
    name: String,
    rating: Number
  },
  player2: {
    name: String,
    rating: Number
  },
  player1Address: String,
  player2Address: String,
  player1TxHash: String,
  player2TxHash: String,
  stakeAmount: String,
  isStaked: { type: Boolean, default: false },
  winner: String,
  signature: String,
  claimed: { type: Boolean, default: false },
  status: { type: String, default: 'waiting' },
  createdAt: { type: Date, default: Date.now }
});

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  rating: { type: Number, default: 1000 },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
});

const Game = mongoose.model('Game', gameSchema);
const Player = mongoose.model('Player', playerSchema);

async function clearDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const gamesResult = await Game.deleteMany({});
    console.log(`🗑️  Deleted ${gamesResult.deletedCount} game records`);

    const playersResult = await Player.deleteMany({});
    console.log(`🗑️  Deleted ${playersResult.deletedCount} player records`);

    console.log('✅ Database cleared successfully');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearDatabase();

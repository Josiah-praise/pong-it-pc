const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  // Wallet address - primary identifier (UEA for cross-chain, EOA for native Push Chain)
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  // Username - UNIQUE and permanently bound to wallet
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  rating: {
    type: Number,
    default: 1000,
    min: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0,
    min: 0
  },
  wins: {
    type: Number,
    default: 0,
    min: 0
  },
  losses: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Index for efficient sorting by rating
playerSchema.index({ rating: -1 });

// Compound index for name + walletAddress queries
playerSchema.index({ walletAddress: 1, name: 1 });

// Method to update player stats after a game
playerSchema.methods.updateGameStats = function(gameResult, newRating) {
  this.gamesPlayed += 1;
  this.rating = newRating;
  
  if (gameResult === 'win') {
    this.wins += 1;
  } else if (gameResult === 'loss') {
    this.losses += 1;
  }
  
  this.lastActive = new Date();
  return this.save();
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;



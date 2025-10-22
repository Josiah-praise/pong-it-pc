const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  player1: {
    name: { type: String, required: true },
    rating: { type: Number, required: true }
  },
  player2: {
    name: { type: String },
    rating: { type: Number }
  },
  winner: {
    type: String, // 'player1' or 'player2'
    enum: ['player1', 'player2', null],
    default: null
  },
  score: {
    player1: { type: Number, default: 0 },
    player2: { type: Number, default: 0 }
  },

  // Staking fields
  isStaked: {
    type: Boolean,
    default: false,
    index: true
  },
  stakeAmount: {
    type: String, // ETH amount as string (e.g., "0.01")
    default: null
  },
  player1Address: {
    type: String, // Ethereum address
    lowercase: true,
    index: true
  },
  player2Address: {
    type: String, // Ethereum address
    lowercase: true,
    index: true
  },
  player1TxHash: {
    type: String // Player 1's stake transaction hash
  },
  player2TxHash: {
    type: String // Player 2's stake transaction hash
  },
  winnerAddress: {
    type: String, // Winner's Ethereum address
    lowercase: true
  },
  winnerSignature: {
    type: String // Backend-signed proof of win
  },
  claimed: {
    type: Boolean,
    default: false,
    index: true
  },
  claimTxHash: {
    type: String // Prize claim transaction hash
  },
  claimedAt: {
    type: Date
  },

  // Refund fields for abandoned matches
  canRefund: {
    type: Boolean,
    default: false,
    index: true
  },
  refundSignature: {
    type: String // Backend-signed proof for abandoned match refund
  },
  refundClaimed: {
    type: Boolean,
    default: false,
    index: true
  },
  refundTxHash: {
    type: String // Refund transaction hash
  },
  refundClaimedAt: {
    type: Date
  },

  // Game status and timestamps
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished', 'abandoned'],
    default: 'waiting'
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Compound indexes for efficient queries
gameSchema.index({ winnerAddress: 1, isStaked: 1, claimed: 1 }); // For "My Wins" queries
gameSchema.index({ isStaked: 1, claimed: 1 }); // For filtering staked unclaimed games
gameSchema.index({ player1Address: 1, canRefund: 1, refundClaimed: 1 }); // For "Unclaimed Stakes" queries
gameSchema.index({ createdAt: -1 }); // For recent games

// Method to mark game as claimed
gameSchema.methods.markAsClaimed = function(txHash) {
  this.claimed = true;
  this.claimTxHash = txHash;
  this.claimedAt = new Date();
  return this.save();
};

// Method to check if both players have staked
gameSchema.methods.bothPlayersStaked = function() {
  return this.isStaked &&
         this.player1Address &&
         this.player2Address &&
         this.player1TxHash &&
         this.player2TxHash;
};

// Method to calculate prize amount
gameSchema.methods.getPrizeAmount = function() {
  if (!this.stakeAmount) return '0';
  // Prize is 2x stake amount (both players' stakes)
  return (parseFloat(this.stakeAmount) * 2).toString();
};

// Method to mark refund as claimed
gameSchema.methods.markRefundAsClaimed = function(txHash) {
  this.refundClaimed = true;
  this.refundTxHash = txHash;
  this.refundClaimedAt = new Date();
  return this.save();
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;



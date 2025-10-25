const mongoose = require('mongoose');

const crateSchema = new mongoose.Schema(
  {
    commitment: { type: String, required: true },
    nonce: { type: String, required: true },
    serverSecret: { type: String, required: true },
    deadline: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    revealedAt: { type: Date },
    txHash: { type: String },
  },
  { _id: false }
);

const powerUpStateSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    lastWinAt: { type: Date },
    lastCrateAwardedAt: { type: Date },
    pendingCrate: crateSchema,
  },
  {
    timestamps: true,
  }
);

powerUpStateSchema.index({ lastCrateAwardedAt: -1 });

const PowerUpState = mongoose.model('PowerUpState', powerUpStateSchema);

module.exports = PowerUpState;

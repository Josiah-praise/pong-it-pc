const mongoose = require('mongoose');

const powerUpDelegationSchema = new mongoose.Schema(
  {
    ownerWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    renterWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    tokenId: {
      type: Number,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    remaining: {
      type: Number,
      required: true,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    txHash: {
      type: String,
    },
    lastSyncedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

powerUpDelegationSchema.index({ ownerWallet: 1, renterWallet: 1, tokenId: 1 }, { unique: true });

const PowerUpDelegation = mongoose.model('PowerUpDelegation', powerUpDelegationSchema);

module.exports = PowerUpDelegation;

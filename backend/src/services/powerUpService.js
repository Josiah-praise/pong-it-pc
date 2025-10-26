const { ethers } = require('ethers');
const crypto = require('crypto');
const path = require('path');
const PowerUpState = require('../models/PowerUpState');
const PowerUpDelegation = require('../models/PowerUpDelegation');

const BOOST_IDS = [1, 2, 3];
const BOOST_ID_MAP = {
  speed: 1,
  shield: 2,
  multiball: 3,
};
const DEFAULT_RPC_URL = 'https://evm.rpc-testnet-donut-node1.push.org';

let powerUpArtifact = null;

try {
  // Try to load from frontend contracts first (production path)
  try {
    powerUpArtifact = require(
      path.join(
        __dirname,
        '../JSON/PongPowerUps.json'
      )
    );
  } catch (frontendError) {
    // Fallback to hardhat artifacts (development path)
    powerUpArtifact = require(
      path.join(
        __dirname,
        '../../../hardhat-blockchain/artifacts/contracts/PongPowerUps.sol/PongPowerUps.json'
      )
    );
  }
} catch (error) {
  console.warn('⚠️  Unable to load PongPowerUps artifact:', error.message);
}

class PowerUpService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.readContract = null;
    this.ready = false;
    this.initialized = false;

    this.initialize();
  }

  initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const contractAddress = process.env.PONG_POWERUPS_ADDRESS || process.env.POWERUP_CONTRACT_ADDRESS;
    const privateKey =
      process.env.POWERUP_SIGNER_PRIVATE_KEY || process.env.SIGNING_WALLET_PRIVATE_KEY;
    const rpcUrl = process.env.POWERUP_RPC_URL || DEFAULT_RPC_URL;

    if (!contractAddress || contractAddress === ethers.ZeroAddress) {
      console.warn('⚠️  POWERUP_CONTRACT_ADDRESS not configured. Power-up flow disabled.');
      return;
    }

    if (
      !privateKey ||
      privateKey === 'YOUR_PRIVATE_KEY_HERE' ||
      privateKey === 'YOUR_POWERUP_PRIVATE_KEY'
    ) {
      console.warn('⚠️  POWERUP_SIGNER_PRIVATE_KEY not configured. Power-up flow disabled.');
      return;
    }

    if (!powerUpArtifact?.abi) {
      console.warn('⚠️  PongPowerUps ABI not available. Power-up flow disabled.');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, powerUpArtifact.abi, this.wallet);
      this.readContract = this.contract.connect(this.provider);
      this.ready = true;

      console.log('✅ Power-up service initialized');
      console.log('📝 Power-up signer:', this.wallet.address);
      console.log('⚙️  Power-up contract:', contractAddress);
    } catch (error) {
      console.error('❌ Failed to initialize power-up service:', error);
    }
  }

  isReady() {
    return this.ready;
  }

  normalizeAddress(address) {
    return address ? address.toLowerCase().trim() : null;
  }

  async getOrCreateState(walletAddress) {
    const normalized = this.normalizeAddress(walletAddress);
    if (!normalized) return null;

    let state = await PowerUpState.findOne({ walletAddress: normalized });
    if (!state) {
      state = await PowerUpState.create({ walletAddress: normalized });
    }
    return state;
  }

  getStartOfDay(date = new Date()) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  generateCommitment(walletAddress) {
    const normalized = this.normalizeAddress(walletAddress);
    if (!normalized) {
      throw new Error('Wallet address is required for commitment generation');
    }

    const nonceBuffer = crypto.randomBytes(16);
    const secretBuffer = crypto.randomBytes(32);

    const nonce = BigInt('0x' + nonceBuffer.toString('hex'));
    const secretHex = `0x${secretBuffer.toString('hex')}`;

    const commitment = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'bytes32'],
      [normalized, nonce, secretHex]
    );

    return {
      nonce,
      secretHex,
      commitment,
    };
  }

  async handleMatchWin({ walletAddress, isStaked, roomCode, score }) {
    if (!this.ready) return;

    const normalized = this.normalizeAddress(walletAddress);
    if (!normalized) return;

    try {
      const state = await this.getOrCreateState(normalized);
      const now = new Date();
      state.lastWinAt = now;

      // Mint baseline boost reward (speed boost by default)
      const contextHash = ethers.id(`WIN:${roomCode}:${now.toISOString()}`);
      const tx = await this.contract.mintBoost(normalized, BOOST_IDS[0], 1, contextHash);
      await tx.wait(1);

      // Award daily crate if eligible (once per UTC day)
      const startOfDay = this.getStartOfDay(now);
      const alreadyAwardedToday =
        state.lastCrateAwardedAt && state.lastCrateAwardedAt >= startOfDay;
      const hasPendingCrate =
        state.pendingCrate &&
        state.pendingCrate.deadline &&
        state.pendingCrate.deadline > now;

      if (!alreadyAwardedToday && !hasPendingCrate) {
        const { nonce, secretHex, commitment } = this.generateCommitment(normalized);
        const deadlineSeconds = Math.floor(now.getTime() / 1000) + 24 * 60 * 60;

        const crateTx = await this.contract.registerDailyCrate(
          normalized,
          commitment,
          deadlineSeconds
        );
        await crateTx.wait(1);

        state.pendingCrate = {
          commitment,
          nonce: nonce.toString(),
          serverSecret: secretHex,
          deadline: new Date(deadlineSeconds * 1000),
          createdAt: now,
        };
        state.lastCrateAwardedAt = now;
      }

      await state.save();
    } catch (error) {
      console.error('❌ Failed to handle power-up rewards:', error);
    }
  }

  async getBalances(walletAddress) {
    if (!this.ready) return { balances: {}, locked: {} };

    const normalized = this.normalizeAddress(walletAddress);
    if (!normalized) return { balances: {}, locked: {} };

    try {
      const accounts = BOOST_IDS.map(() => normalized);
      const balancesBig = await this.readContract.balanceOfBatch(accounts, BOOST_IDS);
      const balances = {};
      const locked = {};

      for (let i = 0; i < BOOST_IDS.length; i += 1) {
        const id = BOOST_IDS[i];
        const balanceValue = balancesBig[i];
        const lockedValue = await this.readContract.lockedBalanceOf(normalized, id);
        balances[id] = Number(balanceValue);
        locked[id] = Number(lockedValue);
      }

      return { balances, locked };
    } catch (error) {
      console.error('⚠️  Failed to read power-up balances:', error.message);
      return { balances: {}, locked: {} };
    }
  }

  async getPendingCrateState(walletAddress) {
    const state = await PowerUpState.findOne({ walletAddress: this.normalizeAddress(walletAddress) }).lean();
    if (!state || !state.pendingCrate) {
      return null;
    }

    const now = new Date();
    if (state.pendingCrate.deadline && state.pendingCrate.deadline <= now) {
      return null;
    }

    return {
      commitment: state.pendingCrate.commitment,
      deadline: state.pendingCrate.deadline,
      revealedAt: state.pendingCrate.revealedAt,
    };
  }

  async revealCrate(walletAddress) {
    const state = await this.getOrCreateState(walletAddress);
    if (!state || !state.pendingCrate) {
      throw new Error('NO_PENDING_CRATE');
    }

    const now = new Date();
    if (state.pendingCrate.deadline && state.pendingCrate.deadline <= now) {
      throw new Error('CRATE_EXPIRED');
    }

    state.pendingCrate.revealedAt = now;
    await state.save();

    return {
      nonce: state.pendingCrate.nonce,
      serverSecret: state.pendingCrate.serverSecret,
      deadline: state.pendingCrate.deadline,
      commitment: state.pendingCrate.commitment,
    };
  }

  async markCrateConsumed(walletAddress, txHash) {
    const state = await this.getOrCreateState(walletAddress);
    if (!state) return null;

    if (state.pendingCrate) {
      state.pendingCrate.txHash = txHash || state.pendingCrate.txHash;
      state.pendingCrate = undefined;
    }

    return state.save();
  }

  async syncDelegationRecord(record) {
    if (!this.ready) return record;

    try {
      const onchain = await this.readContract.getDelegation(
        record.ownerWallet,
        record.renterWallet,
        record.tokenId
      );

      const remaining = Number(onchain.remaining);
      const expiresAtSec = Number(onchain.expiresAt);
      const expiresAt = expiresAtSec ? new Date(expiresAtSec * 1000) : record.expiresAt;

      record.remaining = remaining;
      record.expiresAt = expiresAt;
      record.lastSyncedAt = new Date();

      if (remaining <= 0) {
        record.status = 'cancelled';
      } else if (expiresAt && expiresAt < new Date()) {
        record.status = 'expired';
      } else {
        record.status = 'active';
      }

      await record.save();
      return record;
    } catch (error) {
      console.warn('⚠️  Unable to sync delegation record:', error.message);
      return record;
    }
  }

  async recordDelegation({
    ownerWallet,
    renterWallet,
    tokenId,
    amount,
    txHash,
  }) {
    const normalizedOwner = this.normalizeAddress(ownerWallet);
    const normalizedRenter = this.normalizeAddress(renterWallet);

    if (!normalizedOwner || !normalizedRenter) {
      throw new Error('INVALID_ADDRESSES');
    }

    let onchain;
    if (this.ready) {
      onchain = await this.readContract.getDelegation(normalizedOwner, normalizedRenter, tokenId);
    }

    const remaining = onchain ? Number(onchain.remaining) : amount;
    const expiresAt =
      onchain && Number(onchain.expiresAt) > 0
        ? new Date(Number(onchain.expiresAt) * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const record = await PowerUpDelegation.findOneAndUpdate(
      { ownerWallet: normalizedOwner, renterWallet: normalizedRenter, tokenId },
      {
        ownerWallet: normalizedOwner,
        renterWallet: normalizedRenter,
        tokenId,
        amount,
        remaining,
        expiresAt,
        txHash,
        status: 'active',
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return record;
  }

  async listDelegations(walletAddress) {
    const normalized = this.normalizeAddress(walletAddress);
    if (!normalized) {
      return { asOwner: [], asRenter: [] };
    }

    const [asOwnerRecords, asRenterRecords] = await Promise.all([
      PowerUpDelegation.find({ ownerWallet: normalized }),
      PowerUpDelegation.find({ renterWallet: normalized }),
    ]);

    const syncPromises = [...asOwnerRecords, ...asRenterRecords].map((record) =>
      this.syncDelegationRecord(record)
    );
    await Promise.all(syncPromises);

    return {
      asOwner: asOwnerRecords.map((record) => record.toObject()),
      asRenter: asRenterRecords.map((record) => record.toObject()),
    };
  }

  async cancelDelegation({ ownerWallet, renterWallet, tokenId }) {
    const normalizedOwner = this.normalizeAddress(ownerWallet);
    const normalizedRenter = this.normalizeAddress(renterWallet);

    if (!normalizedOwner || !normalizedRenter) {
      throw new Error('INVALID_ADDRESSES');
    }

    const record = await PowerUpDelegation.findOne({
      ownerWallet: normalizedOwner,
      renterWallet: normalizedRenter,
      tokenId,
    });

    if (record) {
      record.status = 'cancelled';
      record.remaining = 0;
      record.lastSyncedAt = new Date();
      await record.save();
    }

    return record;
  }

  async getPlayerSummary(walletAddress) {
    const normalized = this.normalizeAddress(walletAddress);

    const state = normalized
      ? await PowerUpState.findOne({ walletAddress: normalized }).lean()
      : null;

    const crate =
      state && state.pendingCrate
        ? {
            deadline: state.pendingCrate.deadline,
            revealedAt: state.pendingCrate.revealedAt,
          }
        : null;

    const { balances, locked } = await this.getBalances(normalized);
    const delegations = await this.listDelegations(normalized);

    return {
      walletAddress: normalized,
      balances,
      locked,
      crate,
      delegations,
      ready: this.ready,
    };
  }

  async consumeOwnedBoost(walletAddress, tokenId) {
    if (!this.ready) {
      throw new Error('POWERUP_SERVICE_NOT_READY');
    }

    const normalized = this.normalizeAddress(walletAddress);
    if (!normalized) {
      throw new Error('INVALID_WALLET');
    }

    try {
      const tx = await this.contract.consumeBoost(normalized, tokenId, 1);
      tx.wait(1).catch(error => {
        console.error('❌ consumeBoost confirmation failed:', error);
      });
      return tx;
    } catch (error) {
      console.error('❌ consumeOwnedBoost failed:', error);
      throw error;
    }
  }

  async consumeBoostForPlayer(walletAddress, tokenId) {
    const normalized = this.normalizeAddress(walletAddress);
    if (!normalized) {
      throw new Error('INVALID_WALLET');
    }

    const summaryBefore = await this.getPlayerSummary(normalized);
    const balancesBefore = { ...(summaryBefore.balances || {}) };
    const lockedBefore = { ...(summaryBefore.locked || {}) };
    const delegationsAsRenter = [...(summaryBefore.delegations?.asRenter || [])];

    const now = new Date();
    const delegationFromSummary = delegationsAsRenter
      .filter((record) =>
        record.tokenId === tokenId &&
        record.status === 'active' &&
        record.remaining > 0 &&
        (!record.expiresAt || new Date(record.expiresAt) > now)
      )
      .sort((a, b) => new Date(a.expiresAt || 0) - new Date(b.expiresAt || 0))[0];

    if (delegationFromSummary) {
      if (!this.ready) {
        throw new Error('POWERUP_SERVICE_NOT_READY');
      }

      try {
        const tx = await this.contract.consumeDelegatedBoost(
          delegationFromSummary.ownerWallet,
          normalized,
          tokenId,
          1
        );
        tx.wait(1).catch(error => {
          console.error('❌ consumeDelegatedBoost confirmation failed:', error);
        });
      } catch (error) {
        console.error('❌ consumeDelegatedBoost failed:', error);
        throw error;
      }

      if (delegationFromSummary._id) {
        await PowerUpDelegation.findByIdAndUpdate(delegationFromSummary._id, {
          $inc: { remaining: -1 },
          $set: {
            lastSyncedAt: new Date(),
            status: delegationFromSummary.remaining - 1 <= 0 ? 'expired' : 'active'
          }
        });
      }

      const updatedDelegations = delegationsAsRenter.map(record => {
        const recordId = record._id ? record._id.toString() : null;
        const delegationId = delegationFromSummary._id ? delegationFromSummary._id.toString() : null;
        if (recordId && delegationId && recordId === delegationId) {
          const newRemaining = Math.max(0, record.remaining - 1);
          return {
            ...record,
            remaining: newRemaining,
            status: newRemaining === 0 ? 'expired' : record.status,
          };
        }
        return record;
      });

      const updatedSummary = {
        ...summaryBefore,
        delegations: {
          ...(summaryBefore.delegations || { asOwner: [], asRenter: [] }),
          asRenter: updatedDelegations
        }
      };

      return {
        summary: updatedSummary,
        source: 'delegated',
        ownerWallet: delegationFromSummary.ownerWallet,
      };
    }

    const available = (balancesBefore[tokenId] || 0) - (lockedBefore[tokenId] || 0);

    if (available <= 0) {
      throw new Error('INSUFFICIENT_POWERUP');
    }

    await this.consumeOwnedBoost(normalized, tokenId);

    const updatedSummary = {
      ...summaryBefore,
      balances: {
        ...balancesBefore,
        [tokenId]: Math.max(0, (balancesBefore[tokenId] || 0) - 1)
      }
    };

    return {
      summary: updatedSummary,
      source: 'owned'
    };
  }

  getBoostIdByKey(key) {
    return BOOST_ID_MAP[key] || null;
  }
}

module.exports = new PowerUpService();

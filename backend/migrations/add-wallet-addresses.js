/**
 * Migration Script: Add Wallet Addresses to Existing Players
 * 
 * This script updates existing players in the database to include
 * the new walletAddress field required by the updated schema.
 * 
 * Usage:
 *   node migrations/add-wallet-addresses.js
 * 
 * What it does:
 * 1. Finds all players without a walletAddress
 * 2. Assigns them a legacy wallet address: legacy_<name>_<timestamp>
 * 3. Ensures all players have the required walletAddress field
 */

const mongoose = require('mongoose');
const Player = require('../src/models/Player');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pong-game';

async function migrateWalletAddresses() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all players without walletAddress
    const playersWithoutWallet = await Player.find({ 
      $or: [
        { walletAddress: { $exists: false } },
        { walletAddress: null },
        { walletAddress: '' }
      ]
    });

    console.log(`\n📊 Found ${playersWithoutWallet.length} players without wallet addresses`);

    if (playersWithoutWallet.length === 0) {
      console.log('✅ All players already have wallet addresses. Migration complete!');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('\n🔄 Starting migration...\n');

    let migrated = 0;
    let failed = 0;

    for (const player of playersWithoutWallet) {
      try {
        // Generate legacy wallet address
        const legacyAddress = `legacy_${player.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        player.walletAddress = legacyAddress;
        await player.save();

        console.log(`✅ Migrated: ${player.name} → ${legacyAddress}`);
        migrated++;
        
        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`❌ Failed to migrate ${player.name}:`, error.message);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log(`   Total Players:  ${playersWithoutWallet.length}`);
    console.log(`   ✅ Migrated:     ${migrated}`);
    console.log(`   ❌ Failed:       ${failed}`);
    console.log('='.repeat(60) + '\n');

    // Verify migration
    const remainingWithoutWallet = await Player.countDocuments({
      $or: [
        { walletAddress: { $exists: false } },
        { walletAddress: null },
        { walletAddress: '' }
      ]
    });

    if (remainingWithoutWallet === 0) {
      console.log('✅ Migration completed successfully!');
      console.log('   All players now have wallet addresses.\n');
    } else {
      console.warn(`⚠️  Warning: ${remainingWithoutWallet} players still without wallet addresses`);
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateWalletAddresses();


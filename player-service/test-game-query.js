require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./src/models/Game');

async function testGameQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all staked games
    const stakedGames = await Game.find({ isStaked: true }).sort({ createdAt: -1 }).limit(5);

    console.log('📊 Recent Staked Games:');
    console.log('=' .repeat(80));

    if (stakedGames.length === 0) {
      console.log('No staked games found yet. Create one from the frontend!\n');
    } else {
      stakedGames.forEach((game, index) => {
        console.log(`\n${index + 1}. Room Code: ${game.roomCode}`);
        console.log(`   Player 1: ${game.player1?.name || 'N/A'}`);
        console.log(`   Player 1 Address: ${game.player1Address || 'N/A'}`);
        console.log(`   Stake Amount: ${game.stakeAmount || '0'} ETH`);
        console.log(`   TX Hash: ${game.player1TxHash ? game.player1TxHash.slice(0, 20) + '...' : 'N/A'}`);
        console.log(`   Winner: ${game.winner || 'Game not finished'}`);
        console.log(`   Signature: ${game.winnerSignature ? '✅ Generated' : '⏳ Pending'}`);
        console.log(`   Claimed: ${game.claimed ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${game.createdAt}`);
        console.log('-'.repeat(80));
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testGameQuery();

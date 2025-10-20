const Player = require('./models/Player');

class LeaderboardManager {
  constructor() {
    this.localCache = new Map();
    this.cacheTimeout = 5000;
  }

  async getPlayerRating(playerName) {
    try {
      const cached = this.localCache.get(playerName);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.rating;
      }

      // Try to find existing player
      let player = await Player.findOne({ name: playerName });

      // Create new player if doesn't exist
      if (!player) {
        player = new Player({
          name: playerName,
          rating: 1000,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          lastActive: new Date()
        });
        await player.save();
        console.log(`Created new player: ${playerName} with rating 1000`);
      }

      const rating = player.rating;

      this.localCache.set(playerName, {
        rating,
        timestamp: Date.now()
      });

      return rating;
    } catch (error) {
      console.error('Error fetching player rating:', error);
      return 1000;
    }
  }

  async updatePlayerRating(playerName, newRating, gameResult) {
    try {
      const player = await Player.findOne({ name: playerName });

      if (!player) {
        console.error(`Player not found: ${playerName}`);
        return;
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

      this.localCache.set(playerName, {
        rating: newRating,
        timestamp: Date.now()
      });

      console.log(`Updated ${playerName} rating: ${newRating} (${gameResult})`);
    } catch (error) {
      console.error('Error updating player rating:', error);
    }
  }

  async getTopPlayers(limit = 10) {
    try {
      const players = await Player.find()
        .sort({ rating: -1 })
        .limit(limit)
        .lean();

      return players;
    } catch (error) {
      console.error('Error fetching top players:', error);
      return [];
    }
  }

  calculateElo(playerRating, opponentRating, outcome) {
    const K_FACTOR = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const actualScore = outcome === 'win' ? 1 : 0;

    return Math.round(playerRating + K_FACTOR * (actualScore - expectedScore));
  }

  async processGameResult(winnerName, loserName) {
    try {
      const winnerRating = await this.getPlayerRating(winnerName);
      const loserRating = await this.getPlayerRating(loserName);

      let newWinnerRating = this.calculateElo(winnerRating, loserRating, 'win');
      let newLoserRating = this.calculateElo(loserRating, winnerRating, 'loss');

      newWinnerRating = Math.max(newWinnerRating, winnerRating + 5);

      await this.updatePlayerRating(winnerName, newWinnerRating, 'win');
      await this.updatePlayerRating(loserName, newLoserRating, 'loss');

      return {
        winner: { name: winnerName, oldRating: winnerRating, newRating: newWinnerRating },
        loser: { name: loserName, oldRating: loserRating, newRating: newLoserRating }
      };
    } catch (error) {
      console.error('Error processing game result:', error);
      return null;
    }
  }

  invalidateCache(playerName) {
    this.localCache.delete(playerName);
  }

  clearCache() {
    this.localCache.clear();
  }
}

module.exports = LeaderboardManager;

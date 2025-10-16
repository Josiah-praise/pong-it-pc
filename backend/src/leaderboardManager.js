const fetch = require('node-fetch');

class LeaderboardManager {
  constructor(playerServiceUrl) {
    this.playerServiceUrl = playerServiceUrl || process.env.PLAYER_SERVICE_URL || 'http://player-service:5001';
    this.localCache = new Map();
    this.cacheTimeout = 5000;
  }

  async getPlayerRating(playerName) {
    try {
      const cached = this.localCache.get(playerName);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.rating;
      }

      const response = await fetch(`${this.playerServiceUrl}/players/${encodeURIComponent(playerName)}`);

      if (response.status === 404) {
        const createResponse = await fetch(`${this.playerServiceUrl}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: playerName })
        });

        const data = await createResponse.json();
        const rating = data.rating || 1000;

        this.localCache.set(playerName, {
          rating,
          timestamp: Date.now()
        });

        return rating;
      } else if (response.ok) {
        const data = await response.json();
        const rating = data.rating;

        this.localCache.set(playerName, {
          rating,
          timestamp: Date.now()
        });

        return rating;
      }

      return 1000;
    } catch (error) {
      console.error('Error fetching player rating:', error);
      return 1000;
    }
  }

  async updatePlayerRating(playerName, newRating, gameResult) {
    try {
      const response = await fetch(`${this.playerServiceUrl}/players/${encodeURIComponent(playerName)}/rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRating, gameResult })
      });

      if (response.ok) {
        this.localCache.set(playerName, {
          rating: newRating,
          timestamp: Date.now()
        });
      }

      if (!response.ok) {
        console.error('Failed to update player rating:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating player rating:', error);
    }
  }

  async getTopPlayers(limit = 10) {
    try {
      const response = await fetch(`${this.playerServiceUrl}/players/top?limit=${limit}`);

      if (response.ok) {
        return await response.json();
      }

      return [];
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

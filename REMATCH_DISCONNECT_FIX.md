# 🛠️ Rematch Disconnect Fix

## Issue
When the winner's original in-game socket disconnected during the transition to the Game Over screen, the backend saw `room.status === 'playing'` and `hasGuest: true` while the actual game state in `GameManager` had already been cleaned up (no active game). The disconnect handler assumed it was an active game and destroyed the room, preventing rematches.

## Solution
1. **Check active game state** in `handleDisconnect`:
   ```js
   const activeGame = this.gameManager.getGame(roomCode);
   ...
   hasActiveGame: !!activeGame
   ```

2. **Preserve rematch rooms** when the game is finished **or** the game no longer exists:
   ```js
   if (room.status === 'finished' || !activeGame) {
     // keep room for rematch
   }
   ```

This ensures that when the original socket disconnects post-game, the room remains available for rematch requests.


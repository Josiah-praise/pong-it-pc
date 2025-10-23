# 🏓 Pause Ball Freeze Fix

## Problem
While paused, the server stopped sending `gameUpdate` frames because `gameManager.updateGameState()` returns `null` whenever `isPaused` is true. Once the countdown ended, the client still had a stale snapshot; paddles moved (their state came from player input) but the ball remained frozen because its velocity never updated.

## Solution
During a pause, keep broadcasting the last known game state so clients stay in sync:
```js
const result = this.gameManager.updateGameState(roomCode);

if (!result) {
  const activeGame = this.gameManager.getGame(roomCode);
  if (activeGame && activeGame.isPaused) {
    this.io.to(roomCode).emit('gameUpdate', activeGame);
    return;
  }
  // ...cleanup for disconnected games
}
```

Now the game loop continues to publish steady frames during pause (with ball frozen on purpose). When `gameResumed` fires and `isPaused` flips to false, subsequent updates include fresh ball velocity, so gameplay resumes smoothly.


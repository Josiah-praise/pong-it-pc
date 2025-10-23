# ♻️ Rematch Preservation Fix (v2)

## Problem
When the winner's original socket disconnected after the game, `room.status` was still `'playing'` and the active game still existed in `GameManager` momentarily. The disconnect handler treated this as an in-progress match and called `endGame(roomCode)` which destroyed the preserved room, so subsequent rematch requests failed (`No room found`).

## Fix
In `handleDisconnect`:
- Look up the current game via `this.gameManager.getGame(roomCode)`
- Treat sockets as rematch-safe if either:
  - `room.status === 'finished'`, or
  - `game.status === 'finished'`, or
  - there's no active game.

Logging now shows `gameStatus` for clarity.

## Result
As soon as the game loop marks the match finished, any disconnects keep the room alive and rematch works even if sockets drop before the room status flips to `'finished'`.


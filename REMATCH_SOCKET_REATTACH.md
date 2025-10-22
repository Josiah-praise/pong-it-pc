# 🔁 Rematch Socket Re-Attach Logic

## What changed?
After the room persistence fixes, sockets were correctly kept alive—but when a rematch was accepted we had no valid socket-to-room mappings. The new sockets created on the Game Over screen weren’t reattached to the stored room entries, so `startGame()` could not push state to either player.

### Added helper: `attachPlayerSocket`
- Located in `backend/src/roomManager.js`
- Reassigns the new socket ID to the persisted room entry (host/guest) and updates `playerRooms` map.

### Game Over flow update
When a player lands on the Game Over screen (`joinGameOverRoom` event), we now:
1. Track their new socket in `gameOverPlayers` map.
2. Reattach the socket to the original room via `attachPlayerSocket`.
3. Rejoin the room channel so that any `gameStart`/`rematch` events reach them.

### Rematch response
`handleRematchResponse` now finds the room directly via `getRoomByPlayer` (using the reattached socket) and proceeds to `startGame()` with correct players.

## Result
- Rematch button now successfully restarts the game.
- Players remain subscribed to the room channel using their newly created sockets from the Game Over view.


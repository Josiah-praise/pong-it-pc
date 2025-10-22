# Rematch Restart Fix Summary

## Issue
Rematch button was using GameOver sockets and old socket-room mappings, so rematch acceptance did not restart the game loop.

## Backend Changes
- `RoomManager`
  - Added `usernameRooms` map to track username → roomCode.
  - Updates on room creation/join/detach to maintain mappings.
  - `startGame` now allows transition from `finished` to `playing`.
- `RoomManager.attachPlayerSocket` now updates username map.
- `MultiplayerHandler`
  - Initialized `pendingRematches` in constructor.
  - On `joinGameOverRoom`, reattached socket mapping.
  - `handleRematchRequest` now stores pending rematch keyed by room.
  - `handleRematchResponse` now uses username mapping, rejoins both sockets to the room, reattaches mappings, starts game via `startGame` + `createGame`, and cleans up.
- Ensured `detachPlayerFromRoom` clears username mapping appropriately.

## Frontend Change
- `MultiplayerGame` resets rematch state flags (`setRematchRequested`, `setWaitingForOpponent`, `setWaitingForResponse`) when new `gameStart` is received.

## Expected Flow
1. Player requests rematch → backend records pending rematch.
2. Opponent accepts → backend reattaches sockets, restarts room/game loop.
3. `gameStart` event fires → frontend resets rematch state and transitions back into gameplay.

This restores full rematch functionality.

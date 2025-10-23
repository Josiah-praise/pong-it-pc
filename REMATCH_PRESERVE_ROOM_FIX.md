# ♻️ Rematch Preserve Room Fix

## Issue
After the game ended, the room was being destroyed when the winner's original socket disconnected. Even though rematch preservation was enabled, the disconnect handler still called `endGame(roomCode)` with `preserveRoom = false`, which triggered `roomManager.endGame` and removed the room from memory. Consequently, the rematch request could not find the room.

## Fix
Ensure that all calls from disconnect handling preserve the room by invoking:
```js
this.endGame(roomCode, true);
```

Inside `endGame`, preserving means we stop game loops and clean up the `GameManager`, but we do **not** delete the room from `RoomManager`. This keeps the room available for rematch while preventing stale games from running.

## Outcome
Rooms now persist through the post-game disconnects, allowing rematch requests to succeed every time.


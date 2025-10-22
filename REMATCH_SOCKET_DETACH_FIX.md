# 🧵 Rematch Socket Detach Fix

## Problem Recap
Even after preserving room status, rooms were still being destroyed when the second (host) socket disconnected. Why? Because `removePlayerFromRoom()` removes the player entirely and resets room status, which reverts `status` to `'waiting'`. Then `handleDisconnect()` treats the second disconnect as an active game and destroys the room.

## Key Changes
1. **New helper: `detachPlayerFromRoom()`**
   - Removes the socket mapping but **does not** delete the room or reset status.
   - Nulls out the corresponding `socketId` references for host/guest.
   - Keeps room metadata intact for rematch.

2. **Updated `handleDisconnect()` paths**
   - Use `detachPlayerFromRoom()` when staked guest leaves before staking.
   - Use `detachPlayerFromRoom()` when room status is `'finished'` (game over state).
   - After ending an active game, call `detachPlayerFromRoom()` instead of `removePlayerFromRoom()` to avoid status reset race conditions.

3. **Game Over status metadata**
   - When marking room as finished, ensure host/guest socket references remain (or explicit null) to avoid undefined checks during rematch discovery.

## Expected Flow Now
```
Game ends ➜ room.status = 'finished'
Old sockets disconnect ➜ detachPlayerFromRoom() keeps status as 'finished'
Rematch request ➜ room lookup succeeds
Opponent receives rematch dialogue ✅
```


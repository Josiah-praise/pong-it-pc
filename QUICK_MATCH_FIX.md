# ⚡ Quick Match Fix

## Symptoms
- Quick Match stopped starting games.
- Backend logs showed `handleJoinRoom` succeeding, but `startGame` never emitted `gameStart`.
- Rematch flow worked (rooms had status `finished`), but auto matchmaking stalled.

## Root Cause
After introducing rematch preservation, `roomManager.startGame()` was updated to allow rooms in `'finished'` state. However, `MultiplayerHandler.startGame()` still returned early unless the room was strictly `'ready'`. When auto matchmaking joins the host into the room (status `'waiting'`) and then guest joins (setting it to `'finished'` after the previous game), `startGame()` bailed out.

## Fix
Allow starting games when the room status is `'ready'` **or** `'finished'` inside `MultiplayerHandler.startGame()`:
```js
startGame(roomCode) {
  const room = this.roomManager.getRoom(roomCode);
  if (!room || (room.status !== 'ready' && room.status !== 'finished')) return;

  this.roomManager.startGame(roomCode);
  ...
}
```

## Result
- Quick Match now spins up games immediately.
- Rematch flow still works because `'finished'` rooms remain playable.


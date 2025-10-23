# 🛠️ Rematch "Ready" State Fix

## Problem
After refactoring the rematch flow, rooms preserved for rematch were marked with `status: 'finished'`. When a rematch was accepted, `roomManager.startGame()` only allowed rooms in the `'ready'` state to transition to `'playing'`. Because the preserved room remained `'finished'`, the start call returned `false`, preventing the new game loop from starting.

## Fix
Allow `startGame()` to accept rooms in either `'ready'` or `'finished'` state:
```ts
startGame(roomCode) {
  const room = this.rooms.get(roomCode);
  if (room && (room.status === 'ready' || room.status === 'finished')) {
    room.status = 'playing';
    return true;
  }
  return false;
}
```

## Result
Rooms preserved for rematch now transition back to `'playing'`, and the rematch game starts correctly.


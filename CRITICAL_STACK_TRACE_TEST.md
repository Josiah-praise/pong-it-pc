# 🔍 CRITICAL DEBUG - Stack Trace Added

## What We Found

From your logs:
```
🔌 ========== DISCONNECT ==========
👤 Socket spf90-yjq0n3SQE1AAAq disconnecting
⚠️ No room found for disconnecting socket
```

A socket disconnected, but **the room was already gone**!

## What We Need

I've added **stack trace logging** to `roomManager.endGame()`. 

When you test again, the backend will show:
```
🗑️  roomManager.endGame: DESTROYING room ABC123
   - Host: Poppy, Guest: Xing
   - Status: playing, isStaked: false
   - Called from:
Trace
    at RoomManager.endGame (/path/to/roomManager.js:167:13)
    at MultiplayerHandler.handleXXX (/path/to/multiplayerHandler.js:XXX:XX)
    <-- THIS WILL TELL US WHO'S DESTROYING IT!
```

## Test Now

1. **Play a complete game** (don't forfeit, let someone win naturally)
2. **Look for `🗑️  roomManager.endGame: DESTROYING room`** in backend
3. **Copy the FULL output** including the stack trace
4. This will tell us EXACTLY which function is destroying the room too early!

## Also Check

Before the room is destroyed, do you see:
- `🎮 ========== GAME OVER ==========` ?
- `🏠 Game over for room... - preserving room: true` ?

If NOT, the game is ending via forfeit/disconnect instead of normal completion.


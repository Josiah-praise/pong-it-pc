# Rematch Dialogue Debug Guide 🔍

## Added Debug Logging

### Backend Logs (check your backend terminal):
```
🔄 Rematch request from [username] (socket: xxx)
📋 GameOver players tracked: [list of username -> socketId]
🏠 Room found: { code, host, guest, isStaked }
🔍 Looking for opponent: [name], tracked socket: xxx, old socket: xxx
✅ Sending rematch request from [player] to [opponent]
```

### Frontend Logs (check browser console):
```
🎮 Joining game-over room as [username], socket: xxx
📤 Emitting requestRematch via socket xxx
📨 ✅ RECEIVED rematch request from: [player]
```

---

## How to Debug

### Step 1: Restart Backend
```bash
cd /home/praise/pong-it-pc/backend
# Ctrl+C to stop
node src/server.js
```

### Step 2: Test Rematch Flow

1. **Start a normal (unstaked) game** with two players
2. **Finish the game** (one player wins)
3. **Both players** should be on the Game Over screen
4. **Open browser console** (F12) on BOTH players
5. **Player A** clicks "Request Rematch"

### Step 3: Check Logs

**Player A's Console Should Show:**
```
🔄 Sending rematch request...
📤 Emitting requestRematch via socket [socketId]
```

**Backend Should Show:**
```
🔄 Rematch request from PlayerA (socket: xxx)
📋 GameOver players tracked: [[PlayerA, socketId1], [PlayerB, socketId2]]
🏠 Room found: { code: ABC123, host: PlayerA, guest: PlayerB, isStaked: false }
🔍 Looking for opponent: PlayerB, tracked socket: socketId2, old socket: xxx
✅ Sending rematch request from PlayerA to PlayerB
```

**Player B's Console Should Show:**
```
📨 ✅ RECEIVED rematch request from: PlayerA
📨 Full data: { from: "PlayerA" }
```

---

## Common Issues & Solutions

### Issue 1: "Room not found"
**Backend Log:** `⚠️ Room not found for rematch request from [player]`

**Cause:** Room was cleaned up before rematch request

**Solution:** Check if rooms are being cleaned too quickly. Room should persist until both players leave GameOver screen.

---

### Issue 2: "GameOver players tracked: []"
**Backend Log:** `📋 GameOver players tracked: []`

**Cause:** Players aren't registering in game-over state

**Check:**
- Is `joinGameOverRoom` event being emitted? (should see in frontend console)
- Is backend receiving the event? (add listener log)

**Fix:** Make sure socket connection establishes before emitting

---

### Issue 3: "Opponent socket not found"
**Backend Log:** `❌ Opponent [name] socket not found`

**Cause:** Opponent's socket not tracked correctly

**Check:**
- Did opponent reach GameOver screen?
- Did opponent's `joinGameOverRoom` succeed?
- Is opponent still connected?

---

### Issue 4: Frontend doesn't receive event
**Player B Console:** No "RECEIVED rematch request" log

**Possible Causes:**
1. Event emitted to wrong socket
2. Frontend listener not registered
3. Socket disconnected

**Debug Steps:**
```javascript
// In GameOver.tsx, add this after socket creation:
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});

// Test rematch event directly
socket.on('rematchRequested', (data) => {
  console.log('🎯 REMATCH EVENT RECEIVED!', data);
  alert('Got rematch request!'); // Visual confirmation
});
```

---

## Quick Test Commands

### Manual Socket Test (Browser Console):
```javascript
// On Player B's browser console:
// Manually trigger rematch event
window.socketTest = socketRef.current;
```

Then in backend console:
```javascript
// Find the socket and emit manually
io.to(playerBSocketId).emit('rematchRequested', { from: 'TestPlayer' });
```

---

## Expected Flow

1. ✅ Player A clicks "Request Rematch"
2. ✅ Frontend emits `requestRematch`
3. ✅ Backend receives event
4. ✅ Backend finds room via socket ID or username
5. ✅ Backend looks up opponent's current socket from `gameOverPlayers`
6. ✅ Backend emits `rematchRequested` to opponent's socket
7. ✅ Player B's frontend receives `rematchRequested` event
8. ✅ Player B sees modal with Accept/Decline buttons

---

## Next Steps After Testing

**If logs show everything correctly but dialogue doesn't appear:**
- Check React state (`setRematchRequested(true)`)
- Check conditional rendering (`rematchRequested && ...`)
- Check CSS (modal might be invisible/off-screen)

**If backend can't find opponent:**
- Check `gameOverPlayers` Map
- Verify both players emit `joinGameOverRoom`
- Check room isn't being deleted prematurely

**If socket ID mismatch:**
- Players create new sockets on GameOver screen
- Old socket IDs from game won't work
- Must use `gameOverPlayers` tracking system

---

## Share Debug Output

When you test, please share:
1. ✅ Both players' browser console logs
2. ✅ Backend terminal logs
3. ✅ What you see on screen (modal appears or not?)

This will help identify exactly where the flow breaks!

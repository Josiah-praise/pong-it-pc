# 💰 Staked Game Refund Scenarios

## 📋 Current Implementation Status

### ✅ **Scenario 1: Host Disconnects/Closes Browser Before Anyone Joins**
**Status:** ✅ IMPLEMENTED

**What happens:**
1. Player 1 creates staked game (stakes 0.01 PC)
2. Player 1 waits in room for opponent
3. Player 1 closes browser tab or loses connection
4. Backend detects: `isHost && !room.guest && room.isStaked`
5. Backend marks game as `'abandoned'` and generates refund signature
6. Player 1 can claim refund immediately via "Unclaimed Stakes" page

**Code location:**
```javascript
// backend/src/multiplayerHandler.js - handleDisconnect()
if (room.isStaked && isHost && !room.guest) {
  await this.markGameAsAbandoned(roomCode);
}
```

---

### ❌ **Scenario 2: Host Clicks "Back" or "Forfeit" Button Before Anyone Joins**
**Status:** ❌ NOT IMPLEMENTED (BUG)

**Current behavior:**
1. Player 1 creates staked game (stakes 0.01 PC)
2. Player 1 waits in room
3. Player 1 clicks "Back to Lobby" or "Forfeit"
4. Alert shows: "Are you sure you want to leave? You will forfeit the game."
5. Player 1 confirms
6. Socket emits `'forfeitGame'` event
7. **PROBLEM:** No one has joined yet, but stake is NOT refunded
8. Money is locked in contract forever!

**Why it happens:**
- The `handleLeaveGame()` function emits `'forfeitGame'`
- Backend treats this as a normal forfeit (someone loses)
- Backend does NOT mark game as abandoned
- No refund signature generated

**Code causing issue:**
```typescript
// push-chain-frontend/src/components/MultiplayerGame.tsx
const handleLeaveGame = useCallback(() => {
  if (window.confirm('Are you sure you want to leave? You will forfeit the game.')) {
    if (socketRef.current) {
      socketRef.current.emit('forfeitGame'); // ❌ Wrong for staked games with no opponent!
    }
    soundManager.stopAll();
    navigate('/');
  }
}, [navigate]);
```

---

### ✅ **Scenario 3: Host Leaves After Player 2 Joins But Before They Stake**
**Status:** ✅ WORKS CORRECTLY (Game ends, Player 2 wins)

**What happens:**
1. Player 1 creates staked game, stakes 0.01 PC
2. Player 2 joins room (sees staking modal)
3. Player 1 leaves before Player 2 stakes
4. Player 2 is declared winner
5. Player 2 can claim the stake as prize

**This is correct behavior** - both players agreed to play, Player 1 abandoned.

---

### ✅ **Scenario 4: Player 2 Cancels Staking Modal**
**Status:** ✅ IMPLEMENTED

**What happens:**
1. Player 1 creates staked game
2. Player 2 joins room
3. Player 2 sees staking modal
4. Player 2 clicks "Cancel"
5. Frontend emits `'leaveRoomBeforeStaking'`
6. Backend removes Player 2 but keeps room open
7. Room is still available for others to join
8. Player 1's stake is safe

**Code location:**
```typescript
// push-chain-frontend/src/components/MultiplayerGame.tsx
if (socketRef.current && stakingData?.roomCode) {
  socketRef.current.emit('leaveRoomBeforeStaking', { roomCode: stakingData.roomCode });
}
```

---

## 🐛 **THE BUG: Forfeit Without Opponent**

### Problem Summary

**When Player 1 (host) intentionally leaves a staked room BEFORE anyone joins, the money is lost.**

Current forfeit flow:
```
Player 1 clicks "Back/Forfeit"
   ↓
Alert: "Are you sure you want to forfeit?"
   ↓
Emits: forfeitGame
   ↓
Backend: handleForfeitGame() → declares other player as winner
   ↓
❌ But there IS no other player!
   ↓
Money locked in contract forever
```

Should be:
```
Player 1 clicks "Back/Forfeit"
   ↓
Check: Has anyone joined yet?
   ↓
If NO → Emit: leaveAbandonedRoom
         Backend: markGameAsAbandoned()
         Generate refund signature
   ↓
If YES → Emit: forfeitGame (current behavior)
```

---

## 🔧 **Fix Required**

### Option A: Smart Forfeit Detection (RECOMMENDED)

Detect in frontend if opponent exists before forfeiting:

```typescript
// In MultiplayerGame.tsx
const handleLeaveGame = useCallback(() => {
  const room = /* get current room state from socket */;
  
  // Check if we're in a staked game waiting for opponent
  if (stakingData?.isStaked && !gameState.player2) {
    // No opponent yet - this is abandonment, not forfeit
    if (window.confirm('Leave the room? You can reclaim your stake from "Unclaimed Stakes".')) {
      if (socketRef.current) {
        socketRef.current.emit('leaveAbandonedRoom', { roomCode: stakingData.roomCode });
      }
      soundManager.stopAll();
      navigate('/');
    }
  } else {
    // Normal forfeit - opponent exists
    if (window.confirm('Are you sure you want to leave? You will forfeit the game.')) {
      if (socketRef.current) {
        socketRef.current.emit('forfeitGame');
      }
      soundManager.stopAll();
      navigate('/');
    }
  }
}, [navigate, stakingData, gameState]);
```

Backend handler:
```javascript
// In multiplayerHandler.js
socket.on('leaveAbandonedRoom', async ({ roomCode }) => {
  await this.handleLeaveAbandonedRoom(socket, roomCode);
});

async handleLeaveAbandonedRoom(socket, roomCode) {
  const room = this.roomManager.getRoom(roomCode);
  if (!room) return;
  
  const isHost = room.host && room.host.socketId === socket.id;
  
  // Only allow host to abandon, and only if no guest joined yet
  if (room.isStaked && isHost && !room.guest) {
    console.log(`💰 Host intentionally leaving staked room ${roomCode} before anyone joined`);
    await this.markGameAsAbandoned(roomCode);
    this.endGame(roomCode);
    this.roomManager.removePlayerFromRoom(socket.id);
  } else {
    // If guest is present, treat as normal forfeit
    this.handleForfeitGame(socket);
  }
}
```

### Option B: Backend Validation

Let backend detect if it's actually an abandonment:

```javascript
// In multiplayerHandler.js
handleForfeitGame(socket) {
  const room = this.roomManager.getRoomByPlayer(socket.id);
  if (!room) return;
  
  const isHost = room.host && room.host.socketId === socket.id;
  
  // Special case: Staked game, host forfeit, no opponent joined yet
  if (room.isStaked && isHost && !room.guest) {
    console.log(`💰 Host "forfeited" but no opponent joined - treating as abandonment`);
    await this.markGameAsAbandoned(room.code);
    this.endGame(room.code);
    this.roomManager.removePlayerFromRoom(socket.id);
    return;
  }
  
  // Normal forfeit logic
  const game = this.gameManager.getGameByPlayer(socket.id);
  // ... existing forfeit code
}
```

---

## 📊 **Complete Refund Decision Tree**

```
Staked Game Created
├─ Host DISCONNECTS (closes browser)
│  ├─ No guest joined → ✅ Abandoned (refund available)
│  └─ Guest joined → ❌ Host loses (guest wins)
│
├─ Host CLICKS FORFEIT/BACK
│  ├─ No guest joined → ❌ BUG (should be abandoned, refund available)
│  └─ Guest joined → ✅ Host loses (guest wins)
│
├─ Guest DISCONNECTS before staking
│  └─ → ✅ Room stays open (host stake safe)
│
├─ Guest CANCELS staking modal
│  └─ → ✅ Room stays open (host stake safe)
│
├─ Guest DISCONNECTS after staking
│  └─ → ✅ Guest loses (host wins)
│
└─ Game completes normally
   └─ → ✅ Winner claims prize
```

---

## 🎯 **Summary of What Needs Fixing**

### Current Issues:
1. ❌ **Forfeit button doesn't check if opponent exists** (staked games)
2. ❌ **Money lost when host forfeits before anyone joins**
3. ❌ **No way to reclaim stake after accidental forfeit**

### Solutions Needed:
1. ✅ **Detect abandonment vs forfeit** (check if opponent joined)
2. ✅ **Use different socket event** (`leaveAbandonedRoom` vs `forfeitGame`)
3. ✅ **Backend validation** (verify no opponent before allowing abandonment)
4. ✅ **Update UI message** ("Leave and reclaim stake" vs "Forfeit and lose")

---

## 📝 **Recommended Implementation**

**Priority: HIGH** - Users are losing money!

### Step 1: Frontend Changes

In `MultiplayerGame.tsx`:
- Add state to track if opponent has joined
- Change `handleLeaveGame()` to check opponent status
- Use different alert message for abandonment vs forfeit
- Emit appropriate event based on game state

### Step 2: Backend Changes

In `multiplayerHandler.js`:
- Add `handleLeaveAbandonedRoom()` method
- Register socket event listener for `'leaveAbandonedRoom'`
- Validate that game is truly abandoned
- Call `markGameAsAbandoned()` if valid

### Step 3: Testing

1. Create staked game
2. Click "Back" BEFORE anyone joins
3. Should see: "Leave and reclaim stake?" message
4. Check "Unclaimed Stakes" page
5. Should see abandoned game with refund available

---

## 🔒 **Security Considerations**

### Prevent Abuse

**Scenario:** Player 1 sees Player 2 joining and quickly clicks forfeit to avoid playing.

**Prevention:**
```javascript
// Backend validation
if (room.guest && room.guest.socketId) {
  // Guest has joined, even if not staked yet
  // This is a forfeit, not abandonment
  return handleForfeitGame(socket);
}
```

**Timeline:**
```
T+0s:  Host creates room, stakes
T+30s: Host clicks "Forfeit"
       → Check: room.guest exists?
       → NO: Abandonment (refund OK)
       → YES: Forfeit (host loses)
```

---

## ✅ **Acceptance Criteria**

Before this feature is complete:

- [ ] Host can intentionally leave empty staked room (any method)
- [ ] Backend detects abandonment in all cases:
  - [ ] Browser close/disconnect ✅ (already works)
  - [ ] Forfeit button click ❌ (needs fix)
  - [ ] Back button click ❌ (needs fix)
- [ ] Refund signature generated automatically
- [ ] Game marked as 'abandoned' in database
- [ ] "Unclaimed Stakes" page shows the abandoned game
- [ ] Host can claim refund with one click
- [ ] Money returned to host's wallet
- [ ] Cannot abuse to avoid losing (opponent joined = forfeit)

---

## 🎉 **Once Fixed**

Players will be protected in ALL scenarios:
- ✅ Changed mind before anyone joins → Get refund
- ✅ Emergency came up → Get refund
- ✅ Waited too long, gave up → Get refund
- ✅ Accidental room creation → Get refund
- ✅ No abuse possible (opponent joined = must play or forfeit)

The only way to lose stake:
- Actually playing and losing
- Intentionally forfeiting AFTER opponent has joined and staked

This creates a **fair, user-friendly staking system!** 💪


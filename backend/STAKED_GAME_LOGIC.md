# Staked Game Logic - Player Join/Leave Behavior

## 🎯 Problem Solved

**Before:** When a player joined a staked game but cancelled before staking, the backend would detect their disconnect and end the game, causing the host to receive an "opponent disconnected" message.

**After:** Players can now join and leave staked games before staking without ending the game. The room remains open for other players to join.

---

## 🔄 How It Works Now

### **Normal (Non-Staked) Games:**
1. Player 2 joins room
2. Game immediately starts
3. If Player 2 disconnects → Game ends, Player 1 wins

### **Staked Games:**
1. Player 2 joins room
2. Staking modal appears for Player 2
3. **If Player 2 cancels before staking:**
   - Player 2 is removed from room
   - Room stays open for others to join
   - Host is notified: `guestLeftBeforeStaking` event
   - Game does NOT end
4. **If Player 2 successfully stakes:**
   - Player 2 is marked as staked (`guestStaked = true`)
   - Game starts
   - If Player 2 disconnects now → Game ends, Player 1 wins

---

## 🛠️ Technical Changes

### **1. Room Structure** (`roomManager.js`)

Added tracking for staked games:

```javascript
{
  code: "ABC123",
  host: { ...player, socketId },
  guest: { ...player, socketId },
  status: 'waiting',
  isStaked: false,        // NEW: Is this a staked game?
  hostStaked: false,      // NEW: Has host staked?
  guestStaked: false      // NEW: Has guest staked?
}
```

### **2. Mark Guest As Staked** (`roomManager.js`)

New method to track when Player 2 completes staking:

```javascript
markGuestStaked(roomCode) {
  const room = this.rooms.get(roomCode);
  if (room) {
    room.guestStaked = true;
    return true;
  }
  return false;
}
```

### **3. Updated Disconnect Handler** (`multiplayerHandler.js`)

Now checks if guest has staked before ending game:

```javascript
handleDisconnect(socket) {
  const room = this.roomManager.getRoomByPlayer(socket.id);
  const isGuest = room.guest && room.guest.socketId === socket.id;

  // For staked games: only end if guest has staked
  if (room.isStaked && isGuest && !room.guestStaked) {
    console.log('Guest left before staking - keeping room open');
    this.roomManager.removePlayerFromRoom(socket.id);
    this.io.to(roomCode).emit('guestLeftBeforeStaking');
    return; // Don't end game
  }

  // Normal games or guest has staked: end game
  this.io.to(roomCode).emit('opponentDisconnected');
  this.endGame(roomCode);
}
```

### **4. Mark Room As Staked** (`multiplayerHandler.js`)

When Player 2 joins a staked game:

```javascript
if (gameRecord.isStaked && !gameRecord.player2TxHash) {
  // Mark room as staked
  const room = this.roomManager.getRoom(roomCode);
  if (room) {
    room.isStaked = true;
    room.hostStaked = true;
    room.guestStaked = false;
  }
  
  socket.emit('stakedMatchJoined', { ... });
  return; // Wait for staking
}
```

### **5. Mark When Player 2 Stakes** (`multiplayerHandler.js`)

```javascript
handlePlayer2StakeCompleted(socket, { roomCode }) {
  // Mark that guest has successfully staked
  this.roomManager.markGuestStaked(roomCode);
  
  this.io.to(roomCode).emit('roomReady', { room });
  this.startGame(roomCode);
}
```

---

## 📡 New Socket Event

### `guestLeftBeforeStaking`

**Emitted to:** Host (Player 1)  
**When:** Guest joins staked game but leaves before completing stake  
**Purpose:** Inform host that room is still open for others to join

**Frontend can handle this to show:**
- "Player left before staking..."
- "Waiting for another player..."
- No "opponent disconnected" alert

---

## 🎮 User Experience Flow

### **Scenario: Player Tries to Join Own Game**

1. Player 1 creates staked game (0.01 PC)
2. Player 1 tries to join their own game
3. Staking error appears: "Cannot join own game"
4. Player 1 clicks "Cancel"
5. ✅ **OLD:** Game ends, opponent disconnected alert
6. ✅ **NEW:** Room stays open, no alerts

### **Scenario: Player Joins Then Changes Mind**

1. Player 2 joins staked game
2. Sees staking modal: "Stake 0.01 PC to join"
3. Player 2 clicks "Cancel"
4. ✅ **OLD:** Game ends, Player 1 sees disconnect alert
5. ✅ **NEW:** Room stays open, Player 1 can wait for another player

### **Scenario: Player Stakes Successfully**

1. Player 2 joins staked game
2. Completes stake transaction
3. `guestStaked = true`
4. Game starts
5. If Player 2 disconnects now → Game ends normally

---

## 🔍 Testing Checklist

- [ ] Join own staked game, cancel → Room stays open
- [ ] Join staked game, cancel → Host doesn't see disconnect
- [ ] Join staked game, complete stake → Game starts
- [ ] Join staked game, stake, disconnect → Host wins
- [ ] Normal game: join, disconnect → Host wins (unchanged)
- [ ] Multiple players try joining same staked room before anyone stakes

---

## 🚀 Benefits

1. **Better UX:** No false "opponent disconnected" alerts
2. **Fair Play:** Room stays open for legitimate players
3. **Flexible:** Players can browse staked games without commitment
4. **Correct Logic:** Staked games only start when both players have staked

---

**Date:** October 21, 2025  
**Status:** ✅ Implemented  
**Impact:** Fixes incorrect game ending behavior for staked matches


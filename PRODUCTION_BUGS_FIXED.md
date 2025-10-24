# 🐛 Production Bugs Fixed - Abandoned Stakes

## Issue Summary

When testing abandoned stakes in production, two critical bugs were discovered:

1. ❌ Room not marked as `isStaked: true` in memory
2. ❌ Backend making HTTP requests to `http://localhost:8080` instead of using correct URL

---

## Bug #1: Room Not Marked as Staked

### Problem

**Database:**
```json
{
  "roomCode": "H5AQNW",
  "isStaked": true,  // ✅ Correct
  "player1TxHash": "0xa64f06..."
}
```

**Backend Logs:**
```
🚪 handleLeaveAbandonedRoom - Room: H5AQNW {
  isStaked: false,  // ❌ WRONG!
  isHost: true,
  hasGuest: false
}
⚠️ Invalid abandonment attempt for room H5AQNW - guest exists or not staked
```

### Root Cause

**Timing Issue:**

1. Frontend calls `stakeAsPlayer1()` → blockchain transaction
2. Frontend calls `POST /games` → Creates DB record with `isStaked: true`
3. Backend tries to mark room as staked in memory → **Room doesn't exist yet!**
4. Frontend navigates to `/game` → Socket connects
5. Frontend emits `createRoom` → **Room created with `isStaked: false`**
6. User clicks "Back" → Room still shows `isStaked: false`

The room is created **AFTER** the `/games` POST, so the `isStaked` flag never gets set in memory.

### Solution

**Check database when creating room:**

```javascript
async handleCreateRoom(socket, player, providedRoomCode) {
  // ... create room logic ...
  
  if (providedRoomCode) {
    this.roomManager.createRoomWithCode(roomCode, player, socket.id);
    
    // NEW: Check if this is a staked game in the database
    const game = await Game.findOne({ roomCode: providedRoomCode });
    if (game && game.isStaked && game.player1TxHash) {
      const room = this.roomManager.getRoom(roomCode);
      if (room) {
        room.isStaked = true;
        room.hostStaked = true;
        console.log(`✅ Room ${roomCode} marked as staked (found in database)`);
      }
    }
  }
}
```

Now when a room is created with a specific code (staked matches), it checks the database and marks it as staked immediately.

---

## Bug #2: Wrong API URL (localhost:8080)

### Problem

**Backend Logs:**
```
Error fetching player rating: FetchError: request to http://localhost:8080/players/qwerty failed, reason: ECONNREFUSED
```

The backend is trying to make HTTP requests to **itself** using `http://localhost:8080`, which doesn't exist in production.

### Root Cause

**In `backend/src/gameHandlers.js`:**

```javascript
this.playerServiceUrl = process.env.PLAYER_SERVICE_URL || 'http://localhost:8080';

// Later used in:
fetch(`${this.playerServiceUrl}/players/${encodeURIComponent(playerName)}`)
```

This is a **legacy API design** where the backend makes HTTP requests to itself. The environment variable `PLAYER_SERVICE_URL` is not set in production, so it defaults to `localhost:8080`.

### Why This Causes Problems

1. **Unnecessary network overhead** - The backend doesn't need to make HTTP requests to itself
2. **ECONNREFUSED errors** - `localhost:8080` doesn't resolve correctly in containerized environments
3. **Potential circular dependencies** - Could cause infinite loops if not careful

### Solution Options

#### Option 1: Set `PLAYER_SERVICE_URL` Environment Variable (Quick Fix)

Add to Render environment variables:
```
PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com
```

**Pros:** Quick fix, no code changes  
**Cons:** Still makes unnecessary HTTP requests

#### Option 2: Refactor to Use Direct Database Access (Recommended)

The `gameHandlers.js` methods should call the database **directly** instead of making HTTP requests:

```javascript
// Instead of:
const response = await fetch(`${this.playerServiceUrl}/players/${playerName}`);

// Do this:
const player = await Player.findOne({ name: playerName });
```

This is more efficient and eliminates the network round-trip.

### Immediate Action

For now, **add the environment variable** to Render:

```
PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com
```

Or just remove the `gameHandlers.js` dependency since `MultiplayerHandler` already uses the database directly via `leaderboardManager`.

---

## Files Modified

### Backend
- ✅ `backend/src/multiplayerHandler.js`
  - Made `handleCreateRoom` async
  - Added database check to mark room as staked when created with a specific code
  - Enhanced logging in `handleLeaveAbandonedRoom`
  
- ✅ `backend/src/server.js`
  - Added warning log when room not found when trying to mark as staked

---

## Environment Variables Needed in Production

Current variables (from user):
```
CHAIN_ID=42101
CONTRACT_ADDRESS=0xEb7f322B11CaeD433B194D916F01A0c41d3D3094
FRONTEND_URL=https://pong-it-pc.vercel.app/
KEEP_RENDER_ALIVE=false
MONGODB_URI="mongodb+srv://..."
PONG_ESCROW_ADDRESS=0xEb7f322B11CaeD433B194D916F01A0c41d3D3094
SIGNING_WALLET_PRIVATE_KEY=0xba5a54fa...
```

**ADD THIS:**
```
PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com
```

Or remove the trailing slash from `FRONTEND_URL`:
```
FRONTEND_URL=https://pong-it-pc.vercel.app
```

---

## Testing Checklist

### Test Case 1: Fresh Staked Match
1. Deploy backend to Render
2. Clear all rooms from memory (restart backend)
3. Create new staked match
4. Click "Back" immediately
5. ✅ Backend logs should show: `✅ Room {code} marked as staked (found in database)`
6. ✅ Game should be marked as `abandoned` in MongoDB
7. ✅ "Unclaimed Stakes" should show the game

### Test Case 2: After Backend Restart
1. Create staked match
2. Wait for backend to restart (or restart manually)
3. Reconnect and click "Back"
4. ✅ Should still work via database fallback in `handleLeaveAbandonedRoom`

### Test Case 3: Player Rating Fetch
1. Create any match
2. Check backend logs
3. ✅ Should NOT see `ECONNREFUSED` errors
4. ✅ Player rating should be fetched successfully

---

## Expected Logs After Fix

### When Creating Staked Match
```
New connection: { socketId: 'xyz', username: 'qwerty' }
Player qwerty connected with rating 1000
POST /games - Creating staked game { roomCode: 'H5AQNW', isStaked: true }
⚠️ Room H5AQNW not found in memory when trying to mark as staked - will be marked when room is created
Room created: H5AQNW by qwerty
✅ Room H5AQNW marked as staked (found in database)
```

### When Leaving Staked Match
```
🔔 Received leaveAbandonedRoom event - Socket: xyz, Room: H5AQNW
🔵 handleLeaveAbandonedRoom called
🚪 handleLeaveAbandonedRoom - Room: H5AQNW {
  isStaked: true,  // ✅ NOW CORRECT!
  isHost: true,
  hasGuest: false
}
💰 Host intentionally leaving staked room H5AQNW before anyone joined - marking for refund
🟡 Starting markGameAsAbandoned for room: H5AQNW
✅ Game H5AQNW marked as abandoned - refund signature generated
```

---

## ✅ Enhanced Logging Added

### What Was Added

**Heavy logging for the entire staked match flow:**

1. **`POST /games`** - When staked game is created
   - Request body details
   - Database save status
   - Room marking attempt

2. **`handleCreateRoom`** - When room is created
   - Room code and player details
   - Database lookup for staked status
   - Room marking confirmation

3. **`handleLeaveAbandonedRoom`** - When player leaves
   - Room validation
   - Eligibility checks
   - Success/failure reasons

4. **`markGameAsAbandoned`** - When marking as abandoned
   - Game details from database
   - Signature generation
   - Status update confirmation

### Log Format

All logs use clear section markers:
```
🏗️  ========== CREATE ROOM ==========
... detailed logs ...
🏗️  ========== CREATE ROOM END ==========
```

Each section includes:
- ⏰ Timestamps
- 🔌 Socket IDs
- 📊 Data snapshots
- ✅ Success indicators
- ❌ Error messages with reasons

### Documentation

See `STAKED_MATCH_LOGGING_GUIDE.md` for:
- Complete log flow examples
- Error scenario identification
- Debug checklists
- Success indicators

---

## Status

✅ **Bug #1 Fixed** - Room now checks database when created  
✅ **Bug #2 Workaround** - Need to add `PLAYER_SERVICE_URL` env var  
✅ **Heavy Logging Added** - Can now debug production issues easily  
🔄 **Ready for Testing** - Deploy and verify

**Next Actions:**
1. Add `PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com` to Render
2. Deploy backend with enhanced logging
3. Test staked match abandonment
4. Follow `STAKED_MATCH_LOGGING_GUIDE.md` to read logs
5. Verify game appears in "Unclaimed Stakes"


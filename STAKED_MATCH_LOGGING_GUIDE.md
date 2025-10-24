# 📊 Staked Match Logging Guide

## Overview

Comprehensive logging has been added to track the entire lifecycle of staked matches, from creation to abandonment. This will help debug production issues.

---

## 🎯 Log Flow for Staked Matches

### Step 1: Frontend Initiates Staking

**Frontend:** User clicks "Staked Match" → Stakes on blockchain → Calls backend

### Step 2: Backend Receives Game Creation Request

**Endpoint:** `POST /games`

**Logs to watch for:**
```
💾 ========== POST /games ==========
⏰ Timestamp: 2025-10-24T12:30:00.000Z
📊 Request body: {
  roomCode: 'ABC123',
  player1Name: 'qwerty',
  isStaked: true,
  stakeAmount: '0.05',
  player1Address: '0xa5526df...',
  hasPlayer1Tx: true,
  status: 'waiting'
}
🔍 Checking if game ABC123 already exists...
📝 Game doesn't exist - creating new game...
✅ New game created: {
  roomCode: 'ABC123',
  isStaked: true,
  stakeAmount: '0.05',
  status: 'waiting'
}
💾 Saving game to database...
✅ Game saved successfully
💰 This is a staked game - attempting to mark room in memory...
⚠️ Room ABC123 NOT FOUND in memory (room will be marked as staked when created)
💾 ========== POST /games END (SUCCESS) ==========
```

**Key Points:**
- ✅ Game saved to MongoDB with `isStaked: true`
- ⚠️ Room doesn't exist in memory yet (it's created later)
- This is **expected behavior**

---

### Step 3: Frontend Navigates to Game Screen

**Frontend:** Navigates to `/game` → Socket connects → Emits `createRoom`

### Step 4: Backend Creates Room

**Event:** `createRoom` with provided room code

**Logs to watch for:**
```
🏗️  ========== CREATE ROOM ==========
👤 Player: qwerty
🔌 Socket: v5RlKs9XkikKQ1nRAAAZ
🎫 Provided Room Code: ABC123
🎫 Final Room Code: ABC123
🔍 Provided room code detected - checking if this is a staked match...
📊 Database lookup result: {
  roomCode: 'ABC123',
  isStaked: true,
  hasPlayer1Tx: true,
  status: 'waiting'
}
✅ Room ABC123 marked as STAKED in memory (found in database)
💰 Stake amount: 0.05 PC
📝 Player1 TxHash: 0xa64f06c51055c69eec...
✅ Room created successfully: {
  code: 'ABC123',
  host: 'qwerty',
  isStaked: true,
  hostStaked: true
}
🏗️  ========== CREATE ROOM END ==========
```

**Key Points:**
- ✅ Room code provided (staked match)
- ✅ Database checked → Found staked game
- ✅ Room marked as `isStaked: true` in memory
- **This is the FIX** - room now knows it's staked!

---

### Step 5: User Clicks "Back" (Abandonment)

**Frontend:** Emits `leaveAbandonedRoom` event

### Step 6: Backend Handles Abandonment

**Logs to watch for:**

#### Scenario A: Room Exists in Memory ✅
```
🚪 ========== LEAVE ABANDONED ROOM ==========
🔌 Socket: v5RlKs9XkikKQ1nRAAAZ
🏠 Room Code: ABC123
👤 Username: qwerty
⏰ Timestamp: 2025-10-24T12:35:00.000Z
✅ ========== ROOM FOUND IN MEMORY ==========
📋 Room details: {
  code: 'ABC123',
  isStaked: true,           // ✅ CORRECT!
  hostStaked: true,
  isHost: true,
  hasGuest: false,
  roomStatus: 'waiting',
  hostName: 'qwerty',
  guestName: null
}
🔍 Abandonment validation: {
  isStaked: true,
  isHost: true,
  noGuest: true,
  VALID: true               // ✅ VALID!
}
✅ VALID abandonment - Host leaving staked room ABC123 before anyone joined
💰 Marking for refund...
```

Then proceeds to `markGameAsAbandoned`:
```
💰 ========== MARK GAME AS ABANDONED ==========
🏠 Room Code: ABC123
⏰ Timestamp: 2025-10-24T12:35:01.000Z
✅ Game found in database: {
  roomCode: 'ABC123',
  isStaked: true,
  stakeAmount: '0.05',
  player1Address: '0xa5526df...',
  player1TxHash: '0xa64f06c...',
  hasPlayer2Tx: false,
  currentStatus: 'waiting',
  canRefund: false
}
✅ Game IS eligible for abandonment
📝 Generating refund signature...
✅ Signature generated successfully
📝 Signature: 0xc0f8ad9374a9ed41f9...1310e21c
💾 Updating game record in database...
✅ Game ABC123 successfully marked as abandoned
📊 Status change: waiting → abandoned
✅ canRefund: false → true
✅ refundSignature: generated
💰 ========== MARK GAME AS ABANDONED END (SUCCESS) ==========

🚪 ========== LEAVE ABANDONED ROOM END (SUCCESS) ==========
```

#### Scenario B: Room Not in Memory (Backend Restart) ✅
```
🚪 ========== LEAVE ABANDONED ROOM ==========
🔌 Socket: xyz
🏠 Room Code: ABC123
⚠️ ========== ROOM NOT IN MEMORY ==========
🔍 Checking database for room ABC123...
📊 Found game in database: {
  roomCode: 'ABC123',
  isStaked: true,
  stakeAmount: '0.05',
  hasPlayer1Tx: true,
  hasPlayer2Tx: false,
  status: 'waiting',
  player1Address: '0xa5526df...'
}
🔍 Eligibility check: {
  isStaked: true,
  noPlayer2: true,
  isWaiting: true,
  ELIGIBLE: true           // ✅ ELIGIBLE!
}
✅ Game ABC123 IS ELIGIBLE for abandonment - marking for refund
```

Then proceeds to `markGameAsAbandoned` (same logs as above).

---

## 🚨 Error Scenarios

### Error 1: Room Not Staked
```
🚪 ========== LEAVE ABANDONED ROOM ==========
✅ ========== ROOM FOUND IN MEMORY ==========
📋 Room details: {
  isStaked: false,         // ❌ PROBLEM!
  ...
}
🔍 Abandonment validation: {
  isStaked: false,
  VALID: false
}
❌ INVALID abandonment attempt for room ABC123
⚠️ Reason: Not staked
🚪 ========== LEAVE ABANDONED ROOM END (FORFEIT) ==========
```

**This means:** Room was not properly marked as staked when created.

**Debug Steps:**
1. Check `POST /games` logs → Was game created with `isStaked: true`?
2. Check `CREATE ROOM` logs → Was database checked? Was room marked as staked?

---

### Error 2: Game Not Found in Database
```
🚪 ========== LEAVE ABANDONED ROOM ==========
⚠️ ========== ROOM NOT IN MEMORY ==========
🔍 Checking database for room ABC123...
❌ No game found in database for room ABC123
🚪 ========== LEAVE ABANDONED ROOM END (NO GAME) ==========
```

**This means:** Game was never saved to MongoDB.

**Debug Steps:**
1. Check `POST /games` logs → Was the request received?
2. Check for errors during game save
3. Verify MongoDB connection

---

### Error 3: Game Already Has Player 2
```
💰 ========== MARK GAME AS ABANDONED ==========
✅ Game found in database: {
  hasPlayer2Tx: true,      // ❌ PROBLEM!
  ...
}
❌ Game ABC123 is NOT eligible for abandonment: {
  reason: 'Player 2 already staked'
}
💰 ========== MARK GAME AS ABANDONED END (NOT ELIGIBLE) ==========
```

**This means:** Someone already joined and staked. This should be a normal forfeit, not abandonment.

---

## 📖 Reading the Logs in Production

### Render.com Dashboard

1. Go to https://dashboard.render.com
2. Select your backend service
3. Click "Logs" tab
4. Filter by timestamps

### Log Search Strategy

**To debug a specific match:**

1. **Find the room code** from the database or frontend console
2. **Search for:**
   ```
   Room Code: ABC123
   ```
3. **Follow the flow:**
   - `POST /games` → Game creation
   - `CREATE ROOM` → Room setup
   - `LEAVE ABANDONED ROOM` → Abandonment attempt
   - `MARK GAME AS ABANDONED` → Database update

**To find all staked matches:**
```
Search: "isStaked: true"
```

**To find abandonment issues:**
```
Search: "NOT eligible for abandonment"
```

---

## ✅ Success Indicators

A successful abandoned stake should show:

1. ✅ `POST /games` with `isStaked: true`
2. ✅ `CREATE ROOM` with database lookup finding staked game
3. ✅ Room marked as `isStaked: true` in memory
4. ✅ `LEAVE ABANDONED ROOM` validation shows `VALID: true`
5. ✅ `MARK GAME AS ABANDONED` generates signature
6. ✅ Game status changes from `waiting` → `abandoned`
7. ✅ `canRefund: false` → `true`
8. ✅ Game appears in "Unclaimed Stakes" page

---

## 🛠️ Quick Debug Checklist

If abandoned stakes aren't showing:

- [ ] Check `POST /games` logs → Was game created with `isStaked: true`?
- [ ] Check `CREATE ROOM` logs → Was database checked?
- [ ] Check `CREATE ROOM` logs → Was room marked as `isStaked: true`?
- [ ] Check `LEAVE ABANDONED ROOM` logs → Was validation successful?
- [ ] Check `MARK GAME AS ABANDONED` logs → Was signature generated?
- [ ] Check MongoDB → Is game status `abandoned`?
- [ ] Check `PLAYER_SERVICE_URL` env var → Is it set correctly?

---

## Environment Variables

Make sure these are set in Render:

```bash
MONGODB_URI="mongodb+srv://..."
CHAIN_ID=42101
CONTRACT_ADDRESS=0xEb7f322B11CaeD433B194D916F01A0c41d3D3094
PONG_ESCROW_ADDRESS=0xEb7f322B11CaeD433B194D916F01A0c41d3D3094
SIGNING_WALLET_PRIVATE_KEY=0x...
FRONTEND_URL=https://pong-it-pc.vercel.app
PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com
```

---

## Next Steps

1. Deploy backend with enhanced logging
2. Create a test staked match in production
3. Click "Back" to abandon
4. Review logs following this guide
5. Verify game appears in "Unclaimed Stakes"

The detailed logs will show **exactly** where the flow breaks if there's still an issue! 🎯


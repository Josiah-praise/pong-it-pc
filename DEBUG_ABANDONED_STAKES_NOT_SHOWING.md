# 🐛 Debug: Abandoned Stakes Not Showing

## ✅ What's Working:
- Frontend shows correct alert: "Leave the room? You can reclaim your stake..."
- Frontend detects it's a staked game correctly

## ❓ What's Not Working:
- Abandoned game doesn't appear in "Unclaimed Stakes" page

---

## 🔍 Diagnostic Steps

### Step 1: Check Backend Is Running
```bash
# Is backend running?
ps aux | grep node | grep backend

# Check backend logs
cd backend
npm start
# Look for: "✅ Game ABC123 marked as abandoned"
```

### Step 2: Check Frontend Console
When you click "Leave" and confirm:

**Expected console output:**
```
🚪 handleLeaveGame called: {
  isStakedGame: true,
  hasOpponent: false,
  isWaiting: true,
  playersCount: 1
}
📤 Emitting leaveAbandonedRoom: { roomCode: 'ABC123' }
```

**Check:** Did you see both messages?

### Step 3: Check Backend Logs
Backend should show:

```
🚪 handleLeaveAbandonedRoom - Room: ABC123 {
  isStaked: true,
  isHost: true,
  hasGuest: false,
  roomStatus: 'waiting'
}
💰 Host intentionally leaving staked room ABC123 before anyone joined - marking for refund
✅ Game ABC123 marked as abandoned - refund signature generated
```

**If you see:**
- ❌ "Game not found" → Database doesn't have the game record
- ⚠️ "Not eligible for abandonment" → Game has player2TxHash or not marked as staked

### Step 4: Check Database
```bash
# Connect to MongoDB
mongosh

# Switch to database
use pong-it

# Check if game exists
db.games.findOne({ roomCode: "ABC123" })

# Should show:
# - isStaked: true
# - player1Address: "0x..."
# - player1TxHash: "0x..."
# - status: "abandoned"
# - canRefund: true
# - refundSignature: "0x..."
```

### Step 5: Check UnclaimedStakes Page API Call
Open browser console on `/unclaimed-stakes`:

**Expected API call:**
```
GET /games/abandoned-stakes/0xYourAddress?limit=100
```

**Check response:**
```json
{
  "games": [...],
  "pagination": { "total": 1 }
}
```

---

## 🔴 **Most Likely Issues:**

### Issue 1: Game Record Never Created in Database
**Symptom:** Backend says "Game not found"

**Cause:** The game document is only created AFTER the staking transaction succeeds. If you leave before the transaction confirms, no database record exists.

**Timeline:**
```
T+0s: Click "Staked Match" → Transaction starts
T+5s: Still waiting for confirmation...
T+6s: Click "Back" → leaveAbandonedRoom emitted
      ↓
      Backend: "❌ Game not found for abandoned room"
      ↓
      NO REFUND AVAILABLE ❌
```

**Solution:** Wait for transaction to fully confirm before leaving!

### Issue 2: Backend Not Restarted
**Symptom:** Old code still running

**Solution:**
```bash
cd backend
# Stop old process
pkill -f "node.*backend"

# Start fresh
npm start
```

### Issue 3: Game Exists But Wrong Status
**Symptom:** Game found but not eligible

**Check in MongoDB:**
```javascript
db.games.findOne({ roomCode: "ABC123" })

// If player2TxHash exists → Someone joined!
// If isStaked is false → Not a staked game
// If status is not "abandoned" → Wasn't marked
```

---

## ✅ **Correct Flow (Step by Step):**

### 1. Create Staked Game
```
Frontend: stakeAsPlayer1() called
   ↓
Transaction sent to contract
   ↓
⏰ WAIT for confirmation (5-30 seconds)
   ↓
Transaction confirmed
   ↓
Frontend: POST /games (creates database record)
   ↓
Database: {
     roomCode: "ABC123",
     isStaked: true,
     player1Address: "0x...",
     player1TxHash: "0x...",
     status: "waiting",
     player2TxHash: null ← IMPORTANT!
   }
```

### 2. Leave Before Anyone Joins
```
Frontend: Click "Back"
   ↓
Alert: "Leave and reclaim stake?"
   ↓
Confirm
   ↓
Socket emit: leaveAbandonedRoom
   ↓
Backend: handleLeaveAbandonedRoom()
   ↓
Backend: markGameAsAbandoned()
   ↓
Database UPDATE: {
     status: "abandoned",
     canRefund: true,
     refundSignature: "0x..."
   }
   ↓
✅ Ready to claim!
```

### 3. View Unclaimed Stakes
```
Navigate to: /unclaimed-stakes
   ↓
API GET: /games/abandoned-stakes/:address
   ↓
Query: {
     player1Address: address,
     status: "abandoned",
     canRefund: true,
     refundClaimed: false
   }
   ↓
✅ Game appears in list!
```

---

## 🎯 **Quick Test:**

Run this in your MongoDB shell:

```javascript
// Check for ANY abandoned games
db.games.find({
  status: "abandoned",
  canRefund: true,
  refundClaimed: false
}).pretty()

// Should return your abandoned game
```

If empty → Backend didn't mark it as abandoned

---

## 🔧 **Manual Fix (If Needed):**

If you have a game that should be abandoned but isn't:

```javascript
// In MongoDB shell
db.games.updateOne(
  { roomCode: "ABC123" },  // Your room code
  {
    $set: {
      status: "abandoned",
      canRefund: true,
      // You'll need a signature - this is tricky!
      // Better to let backend generate it
    }
  }
)
```

**Better:** Recreate the game and follow the correct flow.

---

## 📋 **Checklist for Success:**

Before leaving a staked game:

- [x] Staking transaction is **confirmed** (see tx hash)
- [x] You see "Waiting for opponent..." message
- [x] Check backend logs show game was created
- [x] Check MongoDB has the game record
- [x] THEN click "Back"

After leaving:

- [ ] Check backend logs for "✅ Game marked as abandoned"
- [ ] Check MongoDB: `status: "abandoned"`, `canRefund: true`
- [ ] Navigate to /unclaimed-stakes
- [ ] See your game listed
- [ ] Click "Claim Refund"
- [ ] Transaction succeeds
- [ ] Money returned! ✅

---

## 🆘 **If Still Not Showing:**

Please share:
1. **Frontend console output** (all messages)
2. **Backend console output** (from when you left)
3. **MongoDB query result**: `db.games.findOne({ roomCode: "YOUR_CODE" })`
4. **Room code** you used
5. **Your wallet address**

This will help me debug exactly what's happening!


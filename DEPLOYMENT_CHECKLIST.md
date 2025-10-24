# 🚀 Deployment Checklist - Abandoned Stakes Fix

## Pre-Deployment

### 1. Environment Variables

**Add to Render Dashboard:**

Go to: https://dashboard.render.com → Your Backend Service → Environment

Add this variable:
```
PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com
```

**Verify all variables are set:**
- ✅ `MONGODB_URI`
- ✅ `CHAIN_ID=42101`
- ✅ `CONTRACT_ADDRESS=0xEb7f322B11CaeD433B194D916F01A0c41d3D3094`
- ✅ `PONG_ESCROW_ADDRESS=0xEb7f322B11CaeD433B194D916F01A0c41d3D3094`
- ✅ `SIGNING_WALLET_PRIVATE_KEY`
- ✅ `FRONTEND_URL=https://pong-it-pc.vercel.app`
- ✅ `PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com` (NEW!)

---

## Deployment

### Option 1: Git Push (Automatic)

```bash
cd /home/praise/pong-it-pc

# Stage changes
git add backend/src/multiplayerHandler.js
git add backend/src/server.js

# Commit
git commit -m "fix: Add database fallback for abandoned stakes + comprehensive logging

- Fix room not marked as staked when created with specific room code
- Add database fallback in handleLeaveAbandonedRoom for backend restarts
- Add comprehensive logging for entire staked match lifecycle
- Fix localhost:8080 API calls with PLAYER_SERVICE_URL env var"

# Push
git push origin main
```

Render will auto-deploy.

### Option 2: Manual Deploy

1. Go to Render Dashboard
2. Select backend service
3. Click "Manual Deploy" → "Deploy latest commit"

---

## Testing

### Test Case 1: Fresh Staked Match

1. **Open frontend:** https://pong-it-pc.vercel.app
2. **Connect wallet**
3. **Create staked match:**
   - Click "⚡ New Staked Match"
   - Select or enter stake amount (e.g., 0.05 PC)
   - Confirm blockchain transaction
   - Wait for transaction confirmation
4. **Wait in room** (don't let anyone join)
5. **Click "Back" button**
6. **Confirm** the dialog

**Expected Frontend Behavior:**
- Dialog shows: "Leave the room? You can reclaim your stake from 'Unclaimed Stakes'."
- After confirming, waits ~1 second before navigating home
- No errors in browser console

**Expected Backend Logs (Render):**

```
💾 ========== POST /games ==========
📊 Request body: { isStaked: true, stakeAmount: '0.05', ... }
✅ New game created
💾 Saving game to database...
✅ Game saved successfully
⚠️ Room {code} NOT FOUND in memory

🏗️  ========== CREATE ROOM ==========
🔍 Provided room code detected - checking if this is a staked match...
📊 Database lookup result: { isStaked: true, ... }
✅ Room {code} marked as STAKED in memory (found in database)
💰 Stake amount: 0.05 PC

🚪 ========== LEAVE ABANDONED ROOM ==========
✅ ========== ROOM FOUND IN MEMORY ==========
📋 Room details: { isStaked: true, ... }
🔍 Abandonment validation: { VALID: true }
✅ VALID abandonment

💰 ========== MARK GAME AS ABANDONED ==========
✅ Game IS eligible for abandonment
📝 Generating refund signature...
✅ Signature generated successfully
✅ Game {code} successfully marked as abandoned
📊 Status change: waiting → abandoned
```

**Verify in MongoDB:**

```javascript
db.games.findOne({ roomCode: "YOUR_ROOM_CODE" })
```

Should show:
```json
{
  "status": "abandoned",
  "canRefund": true,
  "refundSignature": "0x...",
  "isStaked": true,
  "stakeAmount": "0.05"
}
```

**Verify in Frontend:**
- Navigate to "Unclaimed Stakes"
- Game should appear with "Refund" button

---

### Test Case 2: After Backend Restart

1. **Create staked match** (same as above)
2. **Manually restart backend** on Render:
   - Render Dashboard → Service → "Manual Deploy" → "Clear build cache & deploy"
3. **Wait for backend to restart** (~2-3 minutes)
4. **Refresh frontend**
5. **Try to leave** by clicking "Back"

**Expected Backend Logs:**

```
🚪 ========== LEAVE ABANDONED ROOM ==========
⚠️ ========== ROOM NOT IN MEMORY ==========
🔍 Checking database for room {code}...
📊 Found game in database: { isStaked: true, ... }
🔍 Eligibility check: { ELIGIBLE: true }
✅ Game {code} IS ELIGIBLE for abandonment

💰 ========== MARK GAME AS ABANDONED ==========
✅ Signature generated successfully
✅ Game {code} successfully marked as abandoned
```

**This tests the database fallback!**

---

## Troubleshooting

### Issue: "ECONNREFUSED localhost:8080"

**Cause:** `PLAYER_SERVICE_URL` not set

**Fix:**
1. Add `PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com` to Render
2. Redeploy

---

### Issue: Room shows `isStaked: false` in logs

**Cause:** Database check failed or game not in DB

**Debug:**
1. Check `POST /games` logs → Was game created?
2. Check `CREATE ROOM` logs → Was database queried?
3. Check MongoDB → Does game exist with `isStaked: true`?

**Logs to search for:**
```
Database lookup result: NOT FOUND
```

---

### Issue: "NOT eligible for abandonment"

**Possible Causes:**
1. Player 2 already joined and staked
2. Game status is not `waiting`
3. Game is not marked as staked in DB

**Debug:**
Check logs for:
```
🔍 Eligibility check: {
  isStaked: false,          // Should be true
  noPlayer2: false,         // Should be true
  isWaiting: false,         // Should be true
  ELIGIBLE: false
}
```

---

### Issue: Signature generation fails

**Check logs for:**
```
❌ ERROR marking game {code} as abandoned:
❌ Error type: ...
❌ Error message: ...
```

**Verify:**
- `SIGNING_WALLET_PRIVATE_KEY` is set correctly
- Signature service is initialized

---

## Success Criteria

✅ No `ECONNREFUSED` errors  
✅ Room marked as `isStaked: true` in CREATE ROOM logs  
✅ Abandonment validation shows `VALID: true`  
✅ Signature generated successfully  
✅ Database shows `status: "abandoned"`, `canRefund: true`  
✅ Game appears in "Unclaimed Stakes" page  
✅ Works even after backend restart  

---

## Rollback Plan

If issues arise:

1. **Revert changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Remove `PLAYER_SERVICE_URL`** from Render if it causes issues

3. **Contact for debug:**
   - Share Render logs
   - Share browser console logs
   - Share MongoDB game document

---

## Documentation

- **Fix Details:** `PRODUCTION_BUGS_FIXED.md`
- **Log Guide:** `STAKED_MATCH_LOGGING_GUIDE.md`
- **Architecture:** `ABANDONED_STAKES_PRODUCTION_FIX.md`

---

## Post-Deployment

After successful deployment:

1. ✅ Test staked match abandonment
2. ✅ Verify logs are clear and helpful
3. ✅ Check "Unclaimed Stakes" page works
4. ✅ Test refund functionality
5. 🗑️ Clean up temporary documentation files (optional)

**You're ready to deploy!** 🚀


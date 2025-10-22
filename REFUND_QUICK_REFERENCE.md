# 💸 Abandoned Stakes Refund - Quick Reference

## 🎯 What Was Built

A system allowing players to instantly reclaim their stakes when they create a staked game but leave before anyone joins.

---

## 📁 Changed Files

### **Smart Contract**
- ✅ `hardhat-blockchain/contracts/PongEscrow.sol`
  - Added `claimRefundForAbandoned()` function
  - Added `AbandonedMatchRefunded` event

### **Backend**
- ✅ `backend/src/services/signatureService.js`
  - Added `signAbandonedRefund()` method
  
- ✅ `backend/src/models/Game.js`
  - Added refund fields: `canRefund`, `refundSignature`, `refundClaimed`, `refundTxHash`, `refundClaimedAt`
  - Added `markRefundAsClaimed()` method
  - Added 'abandoned' to status enum
  
- ✅ `backend/src/multiplayerHandler.js`
  - Added `markGameAsAbandoned()` method
  - Updated `handleDisconnect()` to detect host abandonment
  
- ✅ `backend/src/server.js`
  - Added `GET /games/abandoned-stakes/:address` endpoint
  - Added `POST /games/:gameId/refund-claimed` endpoint

### **Frontend**
- ✅ `push-chain-frontend/src/contracts/PongEscrow.ts`
  - Updated ABI with new function and event
  
- ✅ `push-chain-frontend/src/hooks/usePushContract.ts`
  - Added `useClaimRefundForAbandoned()` hook
  
- ✅ `push-chain-frontend/src/components/UnclaimedStakes.tsx` **[NEW]**
  - Full page component for claiming refunds
  
- ✅ `push-chain-frontend/src/styles/UnclaimedStakes.css` **[NEW]**
  - Styles matching game color scheme
  
- ✅ `push-chain-frontend/src/components/Welcome.tsx`
  - Added unclaimed stakes count fetching
  - Added "Unclaimed Stakes" button with badge
  
- ✅ `push-chain-frontend/src/styles/Welcome.css`
  - Added `.unclaimed-stakes-btn` styles
  - Added pulsing badge animation
  
- ✅ `push-chain-frontend/src/App.tsx`
  - Added `/unclaimed-stakes` route

---

## 🔑 Key API Endpoints

### Get Abandoned Stakes
```
GET /games/abandoned-stakes/:address?limit=20&offset=0
```

**Response:**
```json
{
  "games": [
    {
      "_id": "...",
      "roomCode": "ABC123",
      "stakeAmount": "0.01",
      "refundSignature": "0x...",
      "canRefund": true,
      "refundClaimed": false,
      "createdAt": "2025-10-21T...",
      "player1": { "name": "Alice", "rating": 800 }
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Mark Refund as Claimed
```
POST /games/:gameId/refund-claimed
Content-Type: application/json

{
  "txHash": "0x..."
}
```

---

## 🔐 Smart Contract Functions

### claimRefundForAbandoned
```solidity
function claimRefundForAbandoned(
    string calldata roomCode,
    bytes calldata signature
) external nonReentrant
```

**Reverts if:**
- Not in PLAYER1_STAKED state
- Caller is not player1
- Player2 has already joined
- Invalid backend signature

**Emits:**
```solidity
event AbandonedMatchRefunded(
    string indexed roomCode,
    address indexed player,
    uint256 amount,
    uint256 timestamp
)
```

---

## 🎨 UI Components

### Badge Notification
```tsx
<button className="unclaimed-stakes-btn">
    💰 Unclaimed Stakes
    {unclaimedStakesCount > 0 && (
        <span className="badge">{unclaimedStakesCount}</span>
    )}
</button>
```

- Pulsing animation when count > 0
- Auto-refreshes every 30 seconds
- Only visible when wallet connected

### Unclaimed Stakes Page
- Route: `/unclaimed-stakes`
- Lists all abandoned stakes
- Shows amount, date, room code
- One-click refund claiming
- Transaction status tracking

---

## 🧪 Test Scenarios

### ✅ Success Path
1. Create staked game (0.01 PC)
2. Leave before anyone joins
3. Backend marks as abandoned
4. Badge shows count = 1
5. Navigate to Unclaimed Stakes
6. Click "Claim Refund"
7. Transaction succeeds
8. Stake returned to wallet

### ❌ Should Fail: Player 2 Joined
1. Create staked game
2. Player 2 joins and stakes
3. Try to claim abandoned refund
4. Contract rejects (player2 ≠ address(0))

### ❌ Should Fail: Already Claimed
1. Claim refund once (succeeds)
2. Try to claim again
3. Backend returns "Refund already claimed"

---

## 📊 MongoDB Query Examples

### Find all abandoned stakes for a user
```javascript
db.games.find({
  player1Address: "0x123...",
  status: "abandoned",
  canRefund: true,
  refundClaimed: false
})
```

### Count unclaimed stakes
```javascript
db.games.countDocuments({
  player1Address: "0x123...",
  status: "abandoned",
  canRefund: true,
  refundClaimed: false
})
```

### Mark as claimed (done by backend)
```javascript
db.games.updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      refundClaimed: true,
      refundTxHash: "0x...",
      refundClaimedAt: new Date()
    }
  }
)
```

---

## 🔄 User Flow Diagram

```
1. Player creates staked game
   └─> Stake transaction sent
       └─> Room created in backend
           └─> Player waits for opponent
               │
               ├─> Player leaves (close tab/disconnect)
               │   └─> Backend detects disconnect
               │       └─> Backend checks: isHost && !guest && isStaked
               │           └─> Backend generates signature
               │               └─> Game status = 'abandoned'
               │                   └─> canRefund = true
               │                       │
               │                       └─> Player reconnects
               │                           └─> Badge shows count (1)
               │                               └─> Player clicks "Unclaimed Stakes"
               │                                   └─> Page shows abandoned game
               │                                       └─> Player clicks "Claim Refund"
               │                                           └─> Transaction sent with signature
               │                                               └─> Contract validates & refunds
               │                                                   └─> Backend marks refundClaimed = true
               │                                                       └─> ✅ Stake returned!
               │
               └─> Player 2 joins
                   └─> Normal game proceeds
                       └─> No abandonment
```

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Badge not showing | CORS / Backend down | Check backend logs, verify CORS config |
| Invalid signature | Wrong signer key | Verify `SIGNING_WALLET_PRIVATE_KEY` matches contract's `backendOracle` |
| Transaction reverts | Player 2 joined | Check `player2Address` in DB is null |
| Count is wrong | Cache issue | Refresh page, check API response |
| Claim button disabled | Already pending | Wait for transaction to complete |

---

## 🎯 Success Metrics

After deployment, track:
- **Badge CTR**: % of users who see badge and click
- **Claim Success Rate**: % of claims that succeed
- **Average Claim Time**: Time from abandonment to claim
- **Abandonment Rate**: % of staked games abandoned
- **Total Refunds**: Sum of all refunds claimed

---

## 📞 Quick Debug Commands

```bash
# Check backend is running
curl http://localhost:8080/health

# Check signature service
# Should log signer address on startup

# Get abandoned stakes for address
curl http://localhost:8080/games/abandoned-stakes/0x123...

# Check MongoDB
mongosh
use pong-it
db.games.find({ status: 'abandoned' }).pretty()

# Check frontend build
cd push-chain-frontend
npm run build
```

---

## ✅ Definition of Done

- [x] Contract deployed with new function
- [x] Backend detects abandonment
- [x] Backend generates signatures
- [x] API returns abandoned stakes
- [x] Frontend shows badge notification
- [x] UnclaimedStakes page renders
- [x] Claim refund works end-to-end
- [x] Database updates correctly
- [x] All tests passing
- [x] Documentation complete

---

## 🎉 That's It!

Players can now recover stakes from abandoned games with zero hassle. The system is secure, user-friendly, and fully integrated with the existing staking flow.

**Questions?** Check `ABANDONED_STAKES_REFUND.md` for detailed implementation notes or `DEPLOYMENT_STEPS_REFUND.md` for deployment instructions.


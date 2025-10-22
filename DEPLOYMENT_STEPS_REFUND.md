# 🚀 Deployment Steps: Abandoned Stakes Refund System

## 📋 Prerequisites

- [ ] Smart contract deployment wallet with funds for gas
- [ ] Backend signing wallet private key (must match contract's `backendOracle`)
- [ ] MongoDB database accessible
- [ ] Push Chain Testnet RPC access

---

## 1️⃣ Deploy Smart Contract

### Step 1: Update Contract Address (if redeploying)

Navigate to hardhat directory:
```bash
cd hardhat-blockchain
```

### Step 2: Compile Contract
```bash
npx hardhat compile
```

### Step 3: Deploy to Push Chain Testnet
```bash
npx hardhat run scripts/deploy.ts --network pushChainTestnet
```

### Step 4: Verify Contract (Optional but Recommended)
```bash
npx hardhat verify --network pushChainTestnet <CONTRACT_ADDRESS> <BACKEND_ORACLE_ADDRESS>
```

### Step 5: Update Frontend Constants

**File:** `push-chain-frontend/src/contracts/PongEscrow.ts`

```typescript
export const PONG_ESCROW_ADDRESS = '0xYOUR_NEW_CONTRACT_ADDRESS' as const
```

### Step 6: Update Frontend ABI (if needed)

The ABI has already been updated with:
- `claimRefundForAbandoned(string roomCode, bytes signature)`
- `AbandonedMatchRefunded` event

If you need to regenerate from artifacts:
```bash
cd hardhat-blockchain
npx hardhat compile
# Copy from artifacts/contracts/PongEscrow.sol/PongEscrow.json
```

---

## 2️⃣ Configure Backend

### Step 1: Set Environment Variables

**File:** `backend/.env`

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/pong-it
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pong-it

# Backend Oracle Private Key (CRITICAL)
SIGNING_WALLET_PRIVATE_KEY=0x...

# Push Chain Contract Address
PONG_ESCROW_ADDRESS=0x...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=8080

# Node Environment
NODE_ENV=development
```

⚠️ **IMPORTANT:** The `SIGNING_WALLET_PRIVATE_KEY` must correspond to the address set as `backendOracle` in the smart contract!

### Step 2: Verify Signature Service

Check the console on backend startup:
```
✅ Signature service initialized
📝 Signer address: 0x...
```

This address MUST match the contract's `backendOracle` address!

### Step 3: Install Dependencies (if not done)
```bash
cd backend
npm install
```

### Step 4: Start Backend
```bash
npm start
# OR for development:
npm run dev
```

### Step 5: Test Backend Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Test abandoned stakes endpoint (replace with real address)
curl http://localhost:8080/games/abandoned-stakes/0xYOUR_ADDRESS?limit=20
```

---

## 3️⃣ Deploy Frontend

### Step 1: Install Dependencies (if not done)
```bash
cd push-chain-frontend
npm install
```

### Step 2: Update Environment Variables

**File:** `push-chain-frontend/.env` (create if doesn't exist)

```env
VITE_BACKEND_URL=http://localhost:8080
# OR for production:
# VITE_BACKEND_URL=https://your-backend.com

VITE_PONG_ESCROW_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```

### Step 3: Build for Production
```bash
npm run build
```

### Step 4: Test Locally
```bash
npm run dev
```

Open http://localhost:5173 and test:
1. Connect wallet
2. Create staked game
3. Leave immediately (close tab or disconnect)
4. Check "Unclaimed Stakes" button for badge
5. Navigate to `/unclaimed-stakes`
6. Claim refund

### Step 5: Deploy to Hosting

**For Vercel:**
```bash
npm install -g vercel
vercel
```

**For Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**For Custom Server:**
```bash
# Upload dist/ folder to your web server
scp -r dist/* user@yourserver:/var/www/pong-it/
```

---

## 4️⃣ Database Migration (if needed)

### Existing Games Won't Have New Fields

Run this migration script to add default values:

**File:** `backend/migrate-add-refund-fields.js`

```javascript
const mongoose = require('mongoose');
const Game = require('./src/models/Game');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const result = await Game.updateMany(
    { canRefund: { $exists: false } },
    {
      $set: {
        canRefund: false,
        refundClaimed: false
      }
    }
  );
  
  console.log(`Updated ${result.modifiedCount} games`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
```

Run:
```bash
cd backend
node migrate-add-refund-fields.js
```

---

## 5️⃣ Verification & Testing

### Test Flow 1: Happy Path

1. **Create Staked Game**
   - Connect wallet with Push Chain
   - Click "Staked Match"
   - Select amount (e.g., 0.01 PC)
   - Confirm transaction
   - Wait for room to be created

2. **Abandon Game**
   - Close browser tab OR disconnect wallet
   - Backend should detect disconnect
   - Check backend logs for:
     ```
     💰 Host abandoned staked room ABC123 before anyone joined - marking for refund
     ✅ Game ABC123 marked as abandoned - refund signature generated
     ```

3. **Check Badge Notification**
   - Reconnect wallet
   - Navigate to home page
   - "Unclaimed Stakes" button should show badge with count

4. **Claim Refund**
   - Click "💰 Unclaimed Stakes"
   - Should see abandoned game listed
   - Click "💸 Claim Refund"
   - Confirm transaction in wallet
   - Wait for confirmation
   - Game should disappear from list

5. **Verify Refund**
   - Check wallet balance (should increase by stake amount)
   - Check transaction on Push Chain explorer

### Test Flow 2: Security Check (Player 2 Joins)

1. Create staked game
2. Player 2 joins and stakes
3. Try to claim refund as Player 1
4. Should fail with error: "Player 2 already joined"

### Test Flow 3: Invalid Signature

1. Manually modify `refundSignature` in database
2. Try to claim refund
3. Should fail with error: "Invalid backend signature"

---

## 6️⃣ Monitoring & Logs

### Backend Logs to Watch

```bash
# Successful abandonment detection
✅ Game ABC123 marked as abandoned - refund signature generated

# Signature generation
✅ Abandoned refund signature generated: { roomCode: 'ABC123', ... }

# Failed cases
⚠️ Game ABC123 is not eligible for abandonment
❌ Game not found for abandoned room: ABC123
```

### Frontend Console Logs

```bash
# Fetching abandoned stakes
Fetching abandoned stakes count...

# Claiming refund
📝 Claiming refund for abandoned match: { roomCode: 'ABC123' }
✅ Transaction sent: 0x...
✅ Abandoned refund claimed: { ... }
```

---

## 7️⃣ Rollback Plan (if issues arise)

### If Contract Has Issues

1. **Don't panic!** Funds are safe in the contract
2. Users can still use the original `claimRefund()` after 10 minutes
3. Redeploy contract with fixes
4. Update frontend with new address
5. No data loss - MongoDB records remain

### If Backend Has Issues

1. Backend issues won't affect existing games
2. Restart backend service
3. Check `SIGNING_WALLET_PRIVATE_KEY` is correct
4. Verify MongoDB connection

### If Frontend Has Issues

1. Redeploy previous version from git history
2. Frontend issues won't affect backend/contract
3. Users can still play normal games

---

## 8️⃣ Post-Deployment Checklist

- [ ] Contract deployed and verified
- [ ] Backend oracle address matches contract
- [ ] Signature service initialized correctly
- [ ] MongoDB updated with new schema
- [ ] API endpoints returning correct data
- [ ] Frontend connects to correct contract address
- [ ] Badge notification showing correct count
- [ ] Unclaimed Stakes page loading properly
- [ ] Refund claiming works end-to-end
- [ ] Transaction confirmations visible
- [ ] Database updating correctly after claims

---

## 🆘 Troubleshooting

### Issue: Badge not showing

**Check:**
1. Wallet is connected
2. Backend endpoint returns data: `/games/abandoned-stakes/:address`
3. Frontend console for errors
4. CORS configuration allows frontend domain

**Fix:**
```typescript
// Check fetch in Welcome.tsx
const response = await fetch(
  `${BACKEND_URL}/games/abandoned-stakes/${address}?limit=100`
);
console.log('Response:', await response.json());
```

### Issue: "Invalid signature" error

**Check:**
1. Backend `SIGNING_WALLET_PRIVATE_KEY` is set
2. Signer address matches contract's `backendOracle`
3. Signature was generated recently (if implementing expiry)

**Fix:**
```bash
# Get signer address from backend
curl http://localhost:8080/health

# Compare with contract
# Should see backendOracle: 0x... in contract
```

### Issue: Transaction fails

**Check:**
1. User is player1 of the game
2. No player2 has joined (`player2Address` is null in DB)
3. Game status is 'abandoned'
4. Refund not already claimed

**Fix:**
```javascript
// Check game in MongoDB
db.games.findOne({ roomCode: 'ABC123' })
// Verify:
// - status: 'abandoned'
// - canRefund: true
// - refundClaimed: false
// - player2TxHash: null
```

---

## 📞 Support

For issues:
1. Check backend logs
2. Check frontend console
3. Check MongoDB documents
4. Check contract events on Push Chain explorer
5. Verify environment variables

---

## ✅ Done!

Your abandoned stakes refund system is now live! 🎉

Users can:
- Create staked games without fear of losing funds
- Recover stakes from abandoned games immediately
- See clear notifications when refunds are available
- Claim refunds with one click

Monitor the system for the first few days and watch for:
- Badge notification accuracy
- Transaction success rates
- Database consistency
- User feedback


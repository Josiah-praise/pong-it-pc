# 🎮 PONG-IT Smart Contract Addresses

## Push Chain Testnet (Donut)

### PongEscrow (Staking)
```
0xC76375B72D719a1F7C54114aa7943889bc27c33A
```
**Status:** ✅ Deployed & Verified  
**Explorer:** https://donut.push.network/address/0xC76375B72D719a1F7C54114aa7943889bc27c33A#code

### PongPowerUps (ERC-1155)
```
0xEf07a938Accf61F244A43c09745c234e36c36B30
```
**Status:** ✅ Deployed & Verified  
**Explorer:** https://donut.push.network/address/0xEf07a938Accf61F244A43c09745c234e36c36B30#code

---

## 📅 Deployment Info
- **Date:** October 24, 2025 (Re-deployed after modifications)
- **Network:** Push Chain Testnet (Donut)
- **Chain ID:** 42101
- **Deployer:** `0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22`

---

## Quick Copy for .env Files

### Frontend (.env)
```bash
VITE_PONG_ESCROW_ADDRESS=0xC76375B72D719a1F7C54114aa7943889bc27c33A
VITE_PONG_POWERUPS_ADDRESS=0xEf07a938Accf61F244A43c09745c234e36c36B30
VITE_CHAIN_ID=42101
VITE_BACKEND_URL=https://pong-it-pc.onrender.com
```

### Backend (Render Environment Variables)
```bash
PONG_ESCROW_ADDRESS=0xC76375B72D719a1F7C54114aa7943889bc27c33A
PONG_POWERUPS_ADDRESS=0xEf07a938Accf61F244A43c09745c234e36c36B30
CONTRACT_ADDRESS=0xC76375B72D719a1F7C54114aa7943889bc27c33A
CHAIN_ID=42101
PLAYER_SERVICE_URL=https://pong-it-pc.onrender.com
```

---

## Power-Up Token IDs

- **ID 1:** Speed Boost (Common - 60% drop rate)
- **ID 2:** Shield (Rare - 30% drop rate)
- **ID 3:** Multi-Ball (Legendary - 10% drop rate)

---

## Backend Wallet (Oracle)
```
0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22
```

This wallet has:
- ✅ Oracle role in PongEscrow
- ✅ Admin, Minter, and Game Operator roles in PongPowerUps

---

## 🔍 Verification Status

Both contracts are **fully verified** on BlockScout:
- ✅ **PongEscrow:** Verified with source code
- ✅ **PongPowerUps:** Verified with source code

You can view the complete source code, read contract functions, and interact with both contracts directly on the block explorer.

---

## 📝 Next Steps

1. **Update Frontend .env file:**
   ```bash
   cd push-chain-frontend
   nano .env  # Update the contract addresses
   ```

2. **Update Backend Environment Variables:**
   - Go to Render Dashboard → Your Service → Environment
   - Update `PONG_ESCROW_ADDRESS` and `PONG_POWERUPS_ADDRESS`

3. **Build and Deploy:**
   ```bash
   cd push-chain-frontend
   npm run build
   git add .
   git commit -m "Update contract addresses"
   git push
   ```

---

## 🎯 Contract Features

### PongEscrow
- Stake PC tokens for competitive matches
- Automatic escrow & prize distribution
- Signature-based winner verification
- Refund mechanism for abandoned matches
- Emergency pause functionality

### PongPowerUps (ERC-1155)
- Daily loot crates with commit-reveal randomness
- Three power-up types (Speed, Shield, Multi-Ball)
- Consumable boosts (burn on use)
- Time-boxed delegation/rental system
- Locked balance protection during delegations
- Role-based access control

---

**Last Updated:** October 24, 2025

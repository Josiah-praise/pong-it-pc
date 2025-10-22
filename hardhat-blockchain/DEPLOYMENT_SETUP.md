# 🚀 Contract Deployment Setup

## ⚠️ Error: "factory runner does not support sending transactions"

This error means your hardhat config doesn't have a valid private key to deploy the contract.

---

## 🔧 Fix: Create `.env` File

### Step 1: Create `.env` file

In the `hardhat-blockchain/` directory, create a file named `.env`:

```bash
cd hardhat-blockchain
touch .env
```

### Step 2: Add Your Private Key

Open `.env` and add:

```env
# Deployment Private Key (NEVER COMMIT THIS FILE)
PRIVATE_KEY=your_private_key_without_0x_prefix

# Backend Oracle Address (must match backend's SIGNING_WALLET_PRIVATE_KEY)
BACKEND_ORACLE_ADDRESS=0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22
```

**⚠️ IMPORTANT:**
- Remove the `0x` prefix from your private key
- This account needs Push Chain testnet funds for gas
- The `BACKEND_ORACLE_ADDRESS` MUST match the address derived from your backend's `SIGNING_WALLET_PRIVATE_KEY`

---

## 💰 Get Testnet Funds

Your deployment account needs Push Chain testnet tokens:

1. Go to Push Chain testnet faucet (check Push Chain docs)
2. Enter your deployer address
3. Request testnet tokens
4. Wait for confirmation

---

## 🔑 Where to Get Your Private Key

### From MetaMask:
1. Open MetaMask
2. Click account menu (three dots)
3. Select "Account Details"
4. Click "Show Private Key"
5. Enter password
6. Copy the private key (remove `0x` prefix)

### From a New Wallet:
```bash
# Generate a new wallet using ethers.js
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

---

## 🎯 Deploy Command

After setting up `.env`:

```bash
cd hardhat-blockchain
npx hardhat run scripts/deploy.ts --network pushTestnet
```

Expected output:
```
Deploying PongEscrow...
Backend Oracle: 0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22
✅ PongEscrow deployed to: 0x...

To verify on BlockScout:
npx hardhat verify --network pushTestnet 0x... 0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22
```

---

## 🔐 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Never commit private keys to git
- [ ] Use different keys for testnet and mainnet
- [ ] Backend oracle address matches backend signer
- [ ] Deployment account has sufficient gas

---

## 🐛 Troubleshooting

### "Insufficient funds"
- Your deployment account needs Push Chain testnet tokens
- Get funds from Push Chain faucet

### "Invalid private key"
- Make sure you removed the `0x` prefix
- Make sure there are no spaces or newlines
- Private key should be 64 hexadecimal characters

### "Backend oracle address mismatch"
- Check your backend's `SIGNING_WALLET_PRIVATE_KEY`
- Derive the address and use that as `BACKEND_ORACLE_ADDRESS`

---

## 📝 Quick Setup Script

Save this as `setup-env.sh`:

```bash
#!/bin/bash

echo "🔧 Setting up hardhat deployment environment..."

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get private key
echo "Enter your private key (without 0x prefix):"
read -s PRIVATE_KEY

# Get backend oracle address
echo "Enter backend oracle address (default: 0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22):"
read BACKEND_ORACLE
BACKEND_ORACLE=${BACKEND_ORACLE:-0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22}

# Create .env file
cat > .env << EOF
# Deployment Private Key
PRIVATE_KEY=$PRIVATE_KEY

# Backend Oracle Address
BACKEND_ORACLE_ADDRESS=$BACKEND_ORACLE
EOF

echo "✅ .env file created successfully!"
echo "🚀 You can now run: npx hardhat run scripts/deploy.ts --network pushTestnet"
```

Make it executable and run:
```bash
chmod +x setup-env.sh
./setup-env.sh
```

---

## ✅ After Successful Deployment

1. **Copy the deployed contract address**
2. **Update frontend constants:**
   ```typescript
   // push-chain-frontend/src/contracts/PongEscrow.ts
   export const PONG_ESCROW_ADDRESS = '0xYOUR_DEPLOYED_ADDRESS' as const
   ```

3. **Update backend .env:**
   ```env
   PONG_ESCROW_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
   ```

4. **Verify contract (optional but recommended):**
   ```bash
   npx hardhat verify --network pushTestnet <CONTRACT_ADDRESS> <BACKEND_ORACLE_ADDRESS>
   ```

---

## 🎉 Done!

Your contract is now deployed on Push Chain Testnet and ready to use!


# PONG-IT on Push Chain

Multiplayer Pong game with crypto staking, powered by Push Chain's universal transactions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Push Chain Testnet wallet with PC for gas
- PongEscrow contract deployed on Push Chain Testnet

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your contract address
```

3. **Run development server:**
```bash
npm run dev
```

Visit `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create `.env` in the root directory:

```bash
# Contract address (from your deployment)
VITE_PONG_ESCROW_ADDRESS=0x...

# Push Chain RPC (default is fine for testnet)
VITE_PUSH_RPC_URL=https://evm.rpc-testnet-donut-node1.push.org/

# Backend URL
VITE_BACKEND_URL=http://localhost:8080
```

### Deploy Contract to Push Chain

If you haven't deployed the contract yet:

```bash
cd ../hardhat-blockchain

# Configure Hardhat for Push Chain (add to hardhat.config.ts)
networks: {
  push_testnet: {
    url: 'https://evm.rpc-testnet-donut-node1.push.org/',
    chainId: 42101,
    accounts: [process.env.PRIVATE_KEY]
  }
}

# Deploy
npx hardhat run scripts/deploy.ts --network push_testnet

# Copy the deployed address to .env
```

## 📖 Architecture

### Tech Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Push Chain SDK** - Wallet & transactions
- **wagmi** - Contract reads
- **Socket.IO** - Real-time multiplayer
- **Vite** - Build tool

### Key Differences from Standard EVM

#### Universal Executor Account (UEA)
Push Chain uses a **UEA** system where contracts see a different address than your wallet:

```
Your Wallet (Origin)     →     Universal Executor Account (UEA)
    0xUSER123...         →         0xUEA789...
                                   ↑
                        Smart contract sees this!
```

**Important:** Always use UEA for on-chain comparisons, not origin address.

#### Transaction Pattern
```typescript
// Standard EVM (wagmi)
const { writeContract } = useWriteContract()
await writeContract({...})

// Push Chain (universal transactions)
const { pushChainClient } = usePushChainClient()
const tx = await pushChainClient.universal.sendTransaction({...})
await tx.wait(1)
```

## 🎮 Features

- **Quick Match** - Instant matchmaking
- **Private Rooms** - Play with friends
- **Staked Matches** - Crypto wagering with smart contracts
- **Cross-Chain Support** - Connect from Ethereum, Solana, or Push Chain
- **ELO Rankings** - Competitive ladder system
- **Real-time Gameplay** - 60 FPS multiplayer

## 🔐 Wallet Connection

Push Chain UI Kit supports multiple login methods:
- **Email** - Passwordless email login
- **Google** - OAuth social login
- **Crypto Wallets** - MetaMask, Coinbase, etc.
- **Solana Wallets** - Phantom, Solflare (cross-chain)

All methods work seamlessly with universal transactions.

## 🛠️ Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking (no emit)
npm run type-check

# Linting
npm run lint
```

### Project Structure

```
src/
├── components/        # React components
├── hooks/            # Custom hooks
│   ├── usePushContract.ts    # Contract interaction
│   └── useExecutorAddress.ts # UEA resolution
├── contracts/        # ABIs and contract types
├── providers/        # Push Chain provider setup
├── utils/            # Helper functions
├── styles/           # CSS files
├── constants.ts      # App constants
└── main.tsx          # Entry point
```

### Key Hooks

#### `usePushWalletContext`
Access wallet connection state:
```typescript
const { universalAccount, connectionStatus } = usePushWalletContext()
```

#### `useExecutorAddress`
Get UEA for on-chain comparisons:
```typescript
const { executorAddress } = useExecutorAddress()
const isWinner = match.winner === executorAddress // ✅ Correct
```

#### `useStakeAsPlayer1` / `useStakeAsPlayer2`
Stake in matches:
```typescript
const { stakeAsPlayer1, isPending, isSuccess, hash } = useStakeAsPlayer1()
await stakeAsPlayer1('ABC123', '0.01')
```

#### `useClaimPrize`
Claim winnings:
```typescript
const { claimPrize, isPending, isSuccess } = useClaimPrize()
await claimPrize(roomCode, signature)
```

## 🧪 Testing

### Get Test Funds
1. Visit https://faucet.push.org/
2. Connect your wallet
3. Request PC tokens for gas

### Test Flow
1. Connect wallet (email, Google, or crypto wallet)
2. Create a staked match
3. Open in incognito/different browser
4. Join the match
5. Play the game
6. Winner claims prize

## 🌐 Network Details

### Push Chain Testnet
- **Chain ID:** `42101`
- **RPC:** `https://evm.rpc-testnet-donut-node1.push.org/`
- **Explorer:** `https://donut.push.network/`
- **Faucet:** `https://faucet.push.org/`

### Supported Origin Chains
- Ethereum Sepolia (testnet)
- Solana Devnet (testnet)
- Push Chain Testnet (native)

## 📚 Resources

- **Migration Plan:** See `PUSH_CHAIN_MIGRATION_PLAN.md`
- **Quick Reference:** See `QUICK_REFERENCE.md`
- **Push Chain Docs:** https://docs.push.org/
- **UI Kit Docs:** https://docs.push.org/chain/ui-kit/
- **SDK Examples:** https://github.com/pushchain/push-chain-sdk

## ⚠️ Common Issues

### "Contract address not set"
Make sure `VITE_PONG_ESCROW_ADDRESS` is set in `.env`

### "Client not initialized"
Push Chain client takes a moment to initialize. Check connection status:
```typescript
if (!pushChainClient) return <div>Loading...</div>
```

### "My Wins is empty"
You're likely comparing with origin address instead of UEA. Use `useExecutorAddress()`:
```typescript
const { executorAddress } = useExecutorAddress()
// Filter by executorAddress, not universalAccount
```

### Transaction fails silently
Check browser console for detailed error messages. Common causes:
- Insufficient PC balance
- Wrong network
- Contract not deployed
- Invalid function arguments

## 🤝 Contributing

This is part of the PONG-IT project. See main README for contribution guidelines.

## 📄 License

Same as parent PONG-IT project (see root LICENSE file).



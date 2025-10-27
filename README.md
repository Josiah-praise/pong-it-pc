# PONG-IT: Universal Multiplayer Gaming on Push Chain

> **Built for Push Chain Project G.U.D Hackathon**

A real-time multiplayer Pong game built as a **Universal App** on Push Chain, demonstrating true cross-chain accessibility. Players from any blockchain (Ethereum, Solana, Base, etc.) can compete in instant matches, earn ERC-1155 NFT power-ups, stake in competitive matches, and climb the global leaderboard—all without switching wallets or bridging tokens.

## 🌐 The Problem We Solve

Traditional blockchain games face a critical barrier: **chain fragmentation**. Games deployed on a single chain can only reach users on that specific blockchain. Players need native tokens for gas, must bridge assets, and manage multiple wallets. This creates massive friction and limits user acquisition.

**PONG-IT leverages Push Chain's Universal App architecture to break these barriers.** Deploy once, reach everyone.

## 🔗 Blockchain Integration

### Push Chain Universal Executor Accounts (UEA)
- **Cross-chain identity** - Players from any blockchain use the same account
- **No chain switching** - Connect with MetaMask (Ethereum), Phantom (Solana), or any wallet
- **No gas token friction** - Users don't need PC tokens to play
- **Universal deployment** - One contract serves all chains

### Smart Contracts on Push Chain Testnet (Donut)

#### 🎮 PongPowerUps (ERC-1155)
**Contract Address:** `0xea62a8d39732dd3dd1C519bBc8a175219C7Dc65f`

A full-featured ERC-1155 implementation managing consumable gaming NFTs:

**Three Power-Up Types:**
- **Speed Surge (Token ID: 1)** - Common - Temporary paddle acceleration
- **Guardian Shield (Token ID: 2)** - Rare - Energy barrier blocking one goal
- **Multiball Mayhem (Token ID: 3)** - Legendary - Ball splitting effect

**Advanced Features:**
- **Daily Loot Crates** - Commitment-reveal scheme for provably fair random distribution
  - 60% Common, 30% Rare, 10% Legendary drop rates
  - Uses blockhash + prevrandao for cryptographic randomness
  - Time-limited opening with automatic expiry
  - Winner rewards after each match

- **Power-Up Delegation System** - Time-boxed NFT rentals
  - Delegate power-ups to other players with expiration timestamps
  - Balance locking prevents double-spending during active delegations
  - Multiple concurrent delegations per token type
  - Manual cancellation or automatic expiry release

- **Role-Based Access Control**
  - MINTER_ROLE for administrative minting
  - GAME_ROLE for in-game consumption
  - DEFAULT_ADMIN_ROLE for contract management

- **Security Features**
  - OpenZeppelin ERC-1155 + ERC1155Supply implementation
  - Pausable for emergency stops
  - ReentrancyGuard on all state-changing functions
  - Balance validation with locked amount tracking

#### 💰 PongEscrow
**Contract Address:** `0x76e1411ad898143B6A1d5674FFb96B49B16552D0`

Trustless escrow system for competitive staked matches:

**Core Functionality:**
- **Room-based staking** - Player 1 creates match and stakes ETH/PC
- **Equal stake matching** - Player 2 must match stake amount exactly
- **Pull-based prize claiming** - Winner withdraws with backend signature verification
- **ECDSA signature validation** - Backend signs winner using EIP-191 standard
- **Prize calculation** - Winner receives 2× stake amount

**Three Refund Mechanisms:**
1. **Timeout Refund** - Player 1 refund after 10 minutes if Player 2 doesn't join
2. **Abandoned Match Refund** - Instant refund with backend signature when host leaves before anyone joins
3. **Expired Match Refund** - Both players refunded after 30 days if winner never claims

**Security:**
- Checks-Effects-Interactions (CEI) pattern
- ReentrancyGuard on all functions
- Pausable emergency stop
- Owner-controlled oracle address

**Preset Stake Amounts:**
- 0.001 PC (micro stakes)
- 0.005 PC (low stakes)
- 0.01 PC (medium stakes)
- 0.05 PC (high stakes)

## 🎮 Game Features

### Multiplayer Modes
- **Quick Match** - Instant random matchmaking across all chains
- **Private Rooms** - 6-character codes for friend-based gameplay
- **Spectator Mode** - Watch live games in real-time
- **Multiple Concurrent Matches** - Scalable architecture supporting many simultaneous games

### Competitive Features
- **ELO Rating System** - Chess-style ranking with K-factor 32
- **Live Leaderboard** - Top 10 rankings with real-time WebSocket updates
- **Player Statistics** - Comprehensive tracking (wins, losses, win rate, earnings)
- **Game History** - Full match records with filtering
- **Rating Progression** - Dynamic adjustments based on opponent strength

### Real-Time Gameplay
- **60 FPS synchronized gameplay** - Server-authoritative physics
- **Anti-cheat architecture** - All game logic server-side
- **Ball physics** - Velocity calculations, collision detection, speed progression
- **Responsive controls** - Keyboard, mouse, and touch support
- **WebSocket communication** - Room-based broadcasting for efficiency

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │         │   Smart         │
│   (React +      │◄───────►│  (Node.js +     │◄───────►│   Contracts     │
│   Push SDK)     │  WS     │   Socket.IO)    │  RPC    │  (Push Chain)   │
│                 │         │                 │         │                 │
│  - Viem         │         │  - Game Engine  │         │  - PongPowerUps │
│  - UEA Support  │         │  - MongoDB      │         │  - PongEscrow   │
│  - TypeScript   │         │  - Signatures   │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Blockchain Layer

**Push Chain Testnet (Donut)**
- **Chain ID:** 42101
- **RPC:** `https://evm.rpc-testnet-donut-node1.push.org/`
- **Explorer:** `https://donut.push.network`
- **Native Token:** PC (Push Chain tokens)

**Contract Interactions:**
- **Power-Up Minting** - Backend mints NFTs to winners via MINTER_ROLE
- **Crate Opening** - Players call `openDailyCrate()` with reveal parameters
- **Delegation** - Players call `delegateBoost()` to rent NFTs
- **Staking** - Players call `stakeAsPlayer1()` and `stakeAsPlayer2()`
- **Prize Claiming** - Winners call `claimPrize()` with backend signature
- **Refunds** - Players call refund functions based on match state

### How Blockchain Integration Works

#### 1. Wallet Connection & UEA
**Location:** `push-chain-frontend/src/`

**Flow:**
1. Player connects any wallet (MetaMask, Phantom, Coinbase Wallet, etc.)
2. Push Chain SDK extracts Universal Executor Account (UEA) address
3. UEA address becomes player's cross-chain identity
4. Backend maps UEA to player profile (username, rating, stats)
5. Player can play without holding PC tokens for gas

**Key Implementation:**
```typescript
// Extract UEA from any wallet
const account = await getAccount()
const address = account.address // Cross-chain universal address
```

#### 2. Power-Up NFT Flow
**Location:** `hardhat-blockchain/contracts/PongPowerUps.sol`

**Earning Power-Ups:**
1. Player wins a match
2. Backend calls `registerDailyCrate()` with commitment hash
3. Player opens crate via frontend
4. Frontend calls `openDailyCrate(nonce, serverSecret)`
5. Contract verifies commitment and generates random roll
6. NFT automatically minted to player's UEA address

**Using Power-Ups In-Game:**
1. Player activates power-up during gameplay
2. Backend calls `consumeBoost(owner, tokenId, amount)`
3. NFT burned from player's balance
4. Effect applied (speed boost, shield, multiball)

**Delegating Power-Ups:**
1. Player calls `delegateBoost(renter, tokenId, amount, expiresAt)`
2. Contract locks balance and creates delegation record
3. Renter can use delegated power-ups via `consumeDelegatedBoost()`
4. Delegation expires automatically or can be cancelled

#### 3. Staking & Prize Flow
**Location:** `hardhat-blockchain/contracts/PongEscrow.sol`

**Creating Staked Match:**
1. Player 1 creates room and selects stake amount
2. Frontend calls `stakeAsPlayer1(roomCode)` with ETH value
3. Contract stores match state as PLAYER1_STAKED
4. Player 2 joins and calls `stakeAsPlayer2(roomCode)` with equal stake
5. Contract updates status to BOTH_STAKED
6. Game proceeds with 2× stake as prize pool

**Claiming Prize:**
1. Game ends, backend determines winner
2. Backend generates ECDSA signature: `sign(keccak256(roomCode, winnerAddress))`
3. Winner calls `claimPrize(roomCode, signature)` via frontend
4. Contract recovers signer from signature
5. Verifies signer is oracle address
6. Transfers prize to winner
7. Updates match status to COMPLETED

**Refund Scenarios:**
1. **No Player 2:** Player 1 calls `claimRefund()` after 10 minutes
2. **Abandoned:** Player 1 calls `claimRefundForAbandoned(signature)` immediately with backend proof
3. **Expired Prize:** Either player calls `claimExpiredMatchRefund()` after 30 days

#### 4. Backend Services
**Location:** `backend/src/`

**Key Services:**
- **Game Manager** - Server-authoritative 60 FPS physics engine
- **Room Manager** - Matchmaking and room lifecycle
- **Leaderboard Manager** - ELO calculations and player stats
- **Power-Up Service** - Smart contract interactions via ethers.js
- **Signature Service** - ECDSA signing for winner verification

**Smart Contract Integration:**
```javascript
// Backend mints power-up after win
const tx = await powerUpContract.mintBoost(
  playerAddress,
  tokenId,
  amount,
  context
)

// Backend generates winner signature
const messageHash = ethers.utils.solidityKeccak256(
  ['string', 'address'],
  [roomCode, winnerAddress]
)
const signature = await wallet.signMessage(messageHash)
```

### Data Persistence
**Database:** MongoDB

**Collections:**
- **Players** - UEA addresses, usernames, ratings, statistics
- **Games** - Match records, scores, stakes, winners, signatures
- **PowerUpStates** - Pending crates with TTL auto-cleanup
- **PowerUpDelegations** - Active rentals with expiry tracking

**Indexes:**
- Wallet address (unique constraint)
- Rating (sorted for leaderboard queries)
- Room codes (unique per match)
- Delegation expiry timestamps

## 🎯 Why Push Chain?

### Universal Apps Change Everything

1. **Deploy Once, Reach Everyone** - Single deployment serves users on all chains
2. **No Contract Rewrites** - Standard Solidity works perfectly on Push Chain
3. **Simplified UX** - Players don't need PC tokens or chain switching
4. **10X User Base** - Not limited to one chain's ecosystem
5. **Future-Proof** - Ready for shared state and programmable solvers

### What We've Proven

✅ **True cross-chain multiplayer** - Players from different chains in same game
✅ **Complex NFT mechanics** - ERC-1155 with delegation and loot crates
✅ **Trustless competitive staking** - Escrow with comprehensive refunds
✅ **Real-time performance** - 60 FPS synchronized gameplay
✅ **Complete gaming ecosystem** - Rankings, history, spectators, stats

## 📦 Deployment Information

### Live Application
- **Frontend:** `https://pong-it.netlify.app`
- **Backend API:** `https://pong-it-backend-b27t.onrender.com`

### Smart Contracts (Push Chain Testnet)
- **PongPowerUps (ERC-1155):** `0x76d28CA4B17e76dAa2D5c5889b3dAE6d18FcB9D0`
  - [View on Explorer](https://donut.push.network/address/0x76d28CA4B17e76dAa2D5c5889b3dAE6d18FcB9D0)
- **PongEscrow:** `0x00a8a40F87B5F7D2051a8D56CCa85c66fc1f6Da7`
  - [View on Explorer](https://donut.push.network/address/0x00a8a40F87B5F7D2051a8D56CCa85c66fc1f6Da7)

### Network Details
- **Chain ID:** 42101
- **Network Name:** Push Chain Testnet (Donut)
- **RPC URL:** `https://evm.rpc-testnet-donut-node1.push.org/`
- **Block Explorer:** `https://donut.push.network`
- **Faucet:** `https://faucet.push.org`

## 🛠️ Technologies Used

### Blockchain
- **Push Chain SDK** - Universal Executor Account integration
- **Solidity ^0.8.20** - Smart contract language
- **OpenZeppelin Contracts** - Audited security libraries
- **Hardhat** - Development environment and deployment
- **Viem** - TypeScript Ethereum library
- **ethers.js** - Backend blockchain interactions

### Smart Contract Standards
- **ERC-1155** - Multi-token NFT standard
- **ERC-165** - Interface detection
- **AccessControl** - Role-based permissions
- **ReentrancyGuard** - Attack prevention
- **Pausable** - Emergency controls
- **ECDSA** - Signature verification

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Push Chain SDK** - UEA and transaction handling
- **Viem** - Contract interactions
- **Socket.IO Client** - Real-time communication
- **React Router v6** - Navigation
- **HTML5 Canvas** - Game rendering

### Backend
- **Node.js 18** - Runtime
- **Express.js** - REST API
- **Socket.IO 4** - WebSocket server
- **MongoDB** - Database
- **ethers.js** - Contract calls and signing

### Infrastructure
- **Docker** - Containerization
- **Netlify** - Frontend hosting
- **Render** - Backend hosting

## 📂 Project Structure

```
pong-it-pc/
├── hardhat-blockchain/              # Smart Contracts
│   ├── contracts/
│   │   ├── PongPowerUps.sol        # ERC-1155 NFT power-ups
│   │   └── PongEscrow.sol          # Staking escrow
│   ├── ignition/modules/           # Deployment scripts
│   ├── deployments/                # Deployment records
│   └── test/                       # Contract tests
│
├── backend/                        # Node.js Game Server
│   ├── src/
│   │   ├── server.js              # Express + Socket.IO setup
│   │   ├── multiplayerHandler.js  # WebSocket events
│   │   ├── gameManager.js         # 60 FPS physics engine
│   │   ├── roomManager.js         # Matchmaking
│   │   ├── leaderboardManager.js  # ELO calculations
│   │   └── services/
│   │       ├── powerUpService.js  # Contract interactions
│   │       └── signatureService.js # ECDSA signing
│   └── models/                    # MongoDB schemas
│
├── push-chain-frontend/           # React TypeScript App
│   ├── src/
│   │   ├── components/
│   │   │   ├── Welcome.tsx        # Home + leaderboard
│   │   │   ├── MultiplayerGame.tsx # Game canvas
│   │   │   ├── PowerUps/
│   │   │   │   └── PowerUpDashboard.tsx
│   │   │   ├── MyWins.tsx         # Prize claiming
│   │   │   └── GameHistory.tsx    # Match records
│   │   ├── contracts/
│   │   │   ├── PongPowerUps.ts    # Contract ABIs
│   │   │   └── PongEscrow.ts
│   │   ├── services/              # API clients
│   │   └── hooks/                 # React hooks
│   └── public/
│
└── docker-compose.yml             # Container orchestration
```

## 🔌 API Documentation

### Smart Contract Functions

**PongPowerUps (ERC-1155):**
```solidity
// Power-up management
mintBoost(address to, uint256 id, uint256 amount, bytes32 context)
consumeBoost(address owner, uint256 id, uint256 amount)

// Daily crates
registerDailyCrate(address player, bytes32 commitment, uint64 deadline)
openDailyCrate(uint256 nonce, bytes32 serverSecret) returns (uint256 rewardId)
clearExpiredCrate(address player)

// Delegation system
delegateBoost(address renter, uint256 id, uint256 amount, uint64 expiresAt)
cancelDelegation(address renter, uint256 id)
consumeDelegatedBoost(address owner, address renter, uint256 id, uint256 amount)
releaseExpiredDelegation(address owner, address renter, uint256 id)

// View functions
balanceOf(address account, uint256 id) returns (uint256)
lockedBalanceOf(address owner, uint256 id) returns (uint256)
getDelegation(address owner, address renter, uint256 id) returns (Delegation)
pendingCrate(address player) returns (CrateInfo)
```

**PongEscrow:**
```solidity
// Staking
stakeAsPlayer1(string calldata roomCode) payable
stakeAsPlayer2(string calldata roomCode) payable

// Prize claiming
claimPrize(string calldata roomCode, bytes calldata signature)

// Refunds
claimRefund(string calldata roomCode)
claimRefundForAbandoned(string calldata roomCode, bytes calldata signature)
claimExpiredMatchRefund(string calldata roomCode)

// View functions
getMatch(string calldata roomCode) returns (Match)
getMatchStatus(string calldata roomCode) returns (MatchStatus)
isRoomCodeAvailable(string calldata roomCode) returns (bool)
```

### Backend REST API

```
GET    /api/players/top?limit=10           # Leaderboard
GET    /api/players/:address               # Player profile
GET    /api/games/:roomCode                # Match details
GET    /api/games/player/:address          # Player history
GET    /api/powerups/summary/:address      # Power-up balances
POST   /api/powerups/crate/reveal          # Request crate reveal
GET    /api/powerups/delegations/:address  # Active delegations
```

### WebSocket Events (Socket.IO)

**Client → Server:**
```typescript
socket.emit('createRoom', { player, isStaked, stakeAmount })
socket.emit('joinRoom', { roomCode, player })
socket.emit('findRandomMatch', { player })
socket.emit('paddleMove', { position })
socket.emit('activatePowerUp', { powerUpType }, callback)
socket.emit('spectateGame', { roomCode })
socket.emit('getLeaderboard')
socket.emit('getActiveGames')
```

**Server → Client:**
```typescript
socket.on('roomCreated', { roomCode, host, isStaked, stakeAmount })
socket.on('waitingForOpponent', { roomCode })
socket.on('gameStart', { player1, player2, gameState })
socket.on('gameUpdate', { ball, paddles, score, activePowerUps })
socket.on('gameOver', { winner, loser, ratingChanges, finalScore })
socket.on('leaderboardUpdate', { topPlayers })
socket.on('activeGamesList', { games })
socket.on('powerUpActivated', { player, powerUpType, duration })
socket.on('opponentDisconnected')
```

## 🚀 Future Enhancements

- Tournament system with bracket management
- Seasonal leaderboards with resets
- Additional power-ups and abilities
- Team-based 2v2 matches
- Mobile native apps (React Native)
- NFT skins and customization
- P2P power-up marketplace
- Cross-game asset compatibility
- AI training mode
- Replay system

## 📚 Documentation

- **Push Chain Docs:** https://pushchain.github.io/push-chain-website/pr-preview/pr-1067/docs/
- **Core SDK:** https://www.npmjs.com/package/@pushchain/core
- **UI Kit:** https://www.npmjs.com/package/@pushchain/ui-kit
- **Faucet:** https://faucet.push.org
- **Explorer:** https://donut.push.network

## 🏆 Hackathon Submission

**Project G.U.D - Push Chain Universal Apps Hackathon**

This project demonstrates:
- ✅ Universal App deployment on Push Chain
- ✅ Cross-chain accessibility via UEA
- ✅ Advanced ERC-1155 implementation
- ✅ Trustless competitive gaming
- ✅ Real-time multiplayer performance
- ✅ Complete gaming ecosystem

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- Push Chain team for Universal Apps architecture
- OpenZeppelin for audited smart contract libraries
- Atari for the original Pong (1972)
- DoraHacks for hosting Project G.U.D Hackathon

---

**Built with ❤️ for the Push Chain ecosystem**

*Deploy once. Play everywhere. Break the chains.*

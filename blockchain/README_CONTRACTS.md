# PONG-IT Smart Contracts

This directory contains the smart contracts for the PONG-IT staking system.

## 📋 Overview

The `PongEscrow` contract implements a secure escrow system for 1v1 Pong matches with cryptocurrency stakes. It uses a pull-based payout model with backend signature verification for security and gas efficiency.

## 🏗️ Architecture

### Key Design Choices

1. **Pull-Based Payouts**: Winners manually claim prizes (not automatically sent)
2. **Signature Verification**: Backend signs winner off-chain, contract verifies on-chain
3. **No Backend Gas Costs**: Backend only signs messages, winner pays gas to claim
4. **Refund Mechanisms**: Automatic refunds if opponent doesn't join or winner doesn't claim

### Trust Model

- **Backend Controls**: Game physics, winner determination, cheating prevention
- **Smart Contract Controls**: Fund custody, payout enforcement, refund rules
- **Winner Controls**: When to claim prize (anytime after match ends)

## 📁 File Structure

```
blockchain/
├── src/
│   └── PongEscrow.sol          # Main escrow contract
├── test/
│   └── PongEscrow.t.sol        # Comprehensive test suite
├── script/
│   └── Deploy.s.sol            # Deployment script
├── foundry.toml                # Foundry configuration
└── .env.example                # Environment variables template
```

## 🚀 Setup

### Install Dependencies

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install contract dependencies
forge install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required environment variables:
- `PRIVATE_KEY`: Deployer private key (testnet/mainnet)
- `BACKEND_ORACLE_ADDRESS`: Backend wallet address that signs winners
- `SEPOLIA_RPC_URL`: RPC endpoint for Sepolia testnet
- `ETHERSCAN_API_KEY`: For contract verification

## 🧪 Testing

```bash
# Run all tests
forge test

# Run with verbosity (show console.log output)
forge test -vv

# Run with detailed gas report
forge test --gas-report

# Run specific test
forge test --match-test test_ClaimPrize

# Run tests with coverage
forge coverage
```

### Test Coverage

The test suite covers:
- ✅ Match creation (player 1 stakes)
- ✅ Match joining (player 2 stakes)
- ✅ Prize claiming with signature verification
- ✅ Refund mechanisms (timeout, expired claims)
- ✅ Access control (owner functions)
- ✅ Emergency pause functionality
- ✅ Edge cases and error conditions

## 📦 Deployment

### Deploy to Testnet (Sepolia)

```bash
# Load environment variables
source .env

# Deploy
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Verify contract (if not done automatically)
forge verify-contract <CONTRACT_ADDRESS> src/PongEscrow.sol:PongEscrow \
    --chain sepolia \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(address)" $BACKEND_ORACLE_ADDRESS)
```

### Deploy to Mainnet (e.g., Base)

```bash
# IMPORTANT: Audit contract before mainnet deployment!

forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_RPC_URL --broadcast --verify
```

## 🔑 Contract Functions

### Player Functions

```solidity
// Player 1 creates match and stakes
function stakeAsPlayer1(string calldata roomCode) external payable;

// Player 2 joins match with equal stake
function stakeAsPlayer2(string calldata roomCode) external payable;

// Winner claims prize with backend signature
function claimPrize(string calldata roomCode, bytes calldata signature) external;

// Player 1 refunds if opponent never joins (after 10 min)
function claimRefund(string calldata roomCode) external;

// Either player refunds if winner never claims (after 30 days)
function claimExpiredMatchRefund(string calldata roomCode) external;
```

### Admin Functions (Owner Only)

```solidity
// Update backend oracle address (for key rotation)
function updateBackendOracle(address newOracle) external;

// Emergency pause/unpause
function pause() external;
function unpause() external;
```

### View Functions

```solidity
// Get full match details
function getMatch(string calldata roomCode) external view returns (Match memory);

// Get match status
function getMatchStatus(string calldata roomCode) external view returns (MatchStatus);

// Check if room code is available
function isRoomCodeAvailable(string calldata roomCode) external view returns (bool);
```

## 📊 Contract Events

```solidity
event MatchCreated(string indexed roomCode, address indexed player1, uint256 stakeAmount, uint256 timestamp);
event PlayerJoined(string indexed roomCode, address indexed player2, uint256 totalPot, uint256 timestamp);
event PrizeClaimed(string indexed roomCode, address indexed winner, uint256 amount, uint256 timestamp);
event MatchRefunded(string indexed roomCode, address indexed player, uint256 amount, uint256 timestamp);
event BackendOracleUpdated(address indexed oldOracle, address indexed newOracle, uint256 timestamp);
```

## 🔐 Security Features

1. **ReentrancyGuard**: Prevents reentrancy attacks on payouts
2. **Pull-based payouts**: Eliminates push-based reentrancy vectors
3. **Signature verification**: Only backend can declare winners
4. **Pausable**: Emergency stop mechanism
5. **Checks-Effects-Interactions**: Proper state update ordering
6. **No direct transfers**: Rejects accidental ETH sends

## 🛠️ Integration Guide

### Backend: Sign Winner

```javascript
const ethers = require('ethers');

// Backend wallet (keep private key secure!)
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY);

// Sign winner
const messageHash = ethers.utils.solidityKeccak256(
    ['string', 'address'],
    [roomCode, winnerAddress]
);
const signature = await backendWallet.signMessage(ethers.utils.arrayify(messageHash));

// Store signature in database for later claiming
await Match.findOneAndUpdate(
    { roomCode },
    { winnerSignature: signature, winner: winnerAddress }
);
```

### Frontend: Claim Prize

```javascript
const ethers = require('ethers');

// Get signature from backend
const response = await fetch(`/api/matches/${roomCode}/claim-signature`);
const { signature } = await response.json();

// Submit to contract
const contract = new ethers.Contract(contractAddress, abi, signer);
const tx = await contract.claimPrize(roomCode, signature);
await tx.wait();

console.log('Prize claimed!');
```

## 📈 Gas Costs (Estimated on Polygon)

| Function | Gas | Cost @ 30 gwei |
|----------|-----|----------------|
| stakeAsPlayer1 | ~120k | $0.01 |
| stakeAsPlayer2 | ~160k | $0.01 |
| claimPrize | ~200k | $0.02 |
| claimRefund | ~140k | $0.01 |

*Costs on Ethereum mainnet would be 100x higher - use L2 chains!*

## 🌐 Recommended Networks

1. **Sepolia** (testnet) - Free for testing
2. **Polygon** (mainnet) - ~$0.01/tx
3. **Base** (mainnet) - ~$0.01/tx
4. **Arbitrum** (mainnet) - ~$0.05/tx

## ⚠️ Pre-Launch Checklist

- [ ] Professional audit (CertiK, OpenZeppelin, Trail of Bits)
- [ ] Deploy to testnet for 2+ weeks
- [ ] Bug bounty program
- [ ] Backend private key secured (hardware wallet/KMS)
- [ ] Backend wallet funded with gas
- [ ] Monitor contract events
- [ ] Emergency pause plan documented
- [ ] Legal review completed

## 🔗 Useful Links

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## 📄 License

MIT

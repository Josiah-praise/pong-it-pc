# PONG-IT Deployment: Lisk Sepolia Testnet

## Deployment Summary

**Deployment Date**: 2025-10-17
**Network**: Lisk Sepolia Testnet
**Chain ID**: 4202

## Contract Details

| Parameter | Value |
|-----------|-------|
| **Contract Name** | PongEscrow |
| **Contract Address** | `0x3a067beD82789135caCE3A024B96248505fF883B` |
| **Deployer Address** | `0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22` |
| **Backend Oracle** | `0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22` |
| **Deployment Cost** | ~0.000002 ETH |
| **Gas Used** | 2,131,116 |

## Explorer Links

- **Contract**: https://sepolia-blockscout.lisk.com/address/0x3a067bed82789135cace3a024b96248505ff883b
- **Deployer**: https://sepolia-blockscout.lisk.com/address/0x9ad6b669eb355d4924eca26ddf0636f4897aef22

## Verification Status

✅ **Verified on Blockscout**
- Verification GUID: `3a067bed82789135cace3a024b96248505ff883b68f216d9`
- Verification URL: https://sepolia-blockscout.lisk.com/address/0x3a067bed82789135cace3a024b96248505ff883b

## Network Configuration

**RPC URL**: `https://rpc.sepolia-api.lisk.com`
**Explorer**: `https://sepolia-blockscout.lisk.com`

## Contract Functions

### Player Functions
- `stakeAsPlayer1(string roomCode)` - Create match and stake
- `stakeAsPlayer2(string roomCode)` - Join match with equal stake
- `claimPrize(string roomCode, bytes signature)` - Claim winnings with backend signature
- `claimRefund(string roomCode)` - Refund if opponent doesn't join (10 min timeout)
- `claimExpiredMatchRefund(string roomCode)` - Refund if winner doesn't claim (30 days)

### Admin Functions (Owner: 0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22)
- `updateBackendOracle(address)` - Update backend signing address
- `pause()` / `unpause()` - Emergency stop mechanism

### View Functions
- `getMatch(string roomCode)` - Get match details
- `getMatchStatus(string roomCode)` - Get match status
- `isRoomCodeAvailable(string roomCode)` - Check room code availability
- `backendOracle()` - Get current backend oracle address

## Testing the Contract

### Using Cast (Command Line)

```bash
# Check if room code is available
cast call 0x3a067beD82789135caCE3A024B96248505fF883B \
  "isRoomCodeAvailable(string)(bool)" \
  "ABC123" \
  --rpc-url https://rpc.sepolia-api.lisk.com

# Get Lisk Sepolia testnet ETH from faucet
# https://sepolia-faucet.lisk.com/

# Create a match (player 1 stakes 0.01 ETH)
cast send 0x3a067beD82789135caCE3A024B96248505fF883B \
  "stakeAsPlayer1(string)" \
  "ABC123" \
  --value 0.01ether \
  --private-key YOUR_PRIVATE_KEY \
  --rpc-url https://rpc.sepolia-api.lisk.com
```

## Integration Guide

### Backend: Generate Signature

```javascript
const ethers = require('ethers');

// Backend wallet (keep private key secure!)
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY);

// After game ends, sign winner
const roomCode = "ABC123";
const winnerAddress = "0x...";

const messageHash = ethers.utils.solidityKeccak256(
    ['string', 'address'],
    [roomCode, winnerAddress]
);

const signature = await backendWallet.signMessage(
    ethers.utils.arrayify(messageHash)
);

// Store signature in database for later claiming
await Match.findOneAndUpdate(
    { roomCode },
    { 
        winnerSignature: signature, 
        winner: winnerAddress,
        status: 'COMPLETED'
    }
);
```

### Frontend: Claim Prize

```javascript
const ethers = require('ethers');

// Contract ABI (simplified)
const abi = [
    "function claimPrize(string roomCode, bytes signature)",
    "function getMatch(string roomCode) view returns (tuple(address player1, address player2, uint256 stakeAmount, address winner, uint8 status, uint256 createdAt, uint256 completedAt))"
];

// Connect to contract
const provider = new ethers.providers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
const signer = provider.getSigner(); // MetaMask or other wallet
const contract = new ethers.Contract(
    "0x3a067beD82789135caCE3A024B96248505fF883B",
    abi,
    signer
);

// Fetch signature from your backend
const response = await fetch(`/api/matches/${roomCode}/claim-signature`);
const { signature } = await response.json();

// Claim prize
const tx = await contract.claimPrize(roomCode, signature);
await tx.wait();

console.log('Prize claimed successfully!');
```

## Environment Variables for Backend

```bash
# Add to backend/.env
CONTRACT_ADDRESS=0x3a067beD82789135caCE3A024B96248505fF883B
LISK_RPC_URL=https://rpc.sepolia-api.lisk.com
BACKEND_ORACLE_PRIVATE_KEY=0xba5a54fa02384c39545b62e736824b8f0147b1a072da0ee01936981c4d31da46
CHAIN_ID=4202
```

## Security Notes

⚠️ **Important:**
1. The backend oracle private key is currently exposed in `.env` - **MOVE TO SECURE VAULT** before mainnet
2. Same wallet is used for deployer and backend oracle - fine for testnet, separate for mainnet
3. Contract is **NOT AUDITED** - only use with testnet funds
4. Professional audit required before mainnet deployment

## Next Steps

- [ ] Integrate contract with backend (sign winners)
- [ ] Integrate contract with frontend (MetaMask connection, staking, claiming)
- [ ] Test full user flow on testnet
- [ ] Monitor contract events
- [ ] Get testnet ETH from faucet for testing
- [ ] Conduct security review
- [ ] Plan for mainnet deployment

## Support

- **Lisk Documentation**: https://docs.lisk.com
- **Lisk Faucet**: https://sepolia-faucet.lisk.com
- **Block Explorer**: https://sepolia-blockscout.lisk.com

---
*Generated: 2025-10-17*

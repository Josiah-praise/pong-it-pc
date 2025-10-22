# Contract Redeployment Required! 🚨

## Problem

The contract currently deployed at `0x9CC235568c9423a6cE83Ed659d28459E0332FbA6` **does not have** the `claimRefundForAbandoned` function because it was deployed **before** we added this function to the contract.

When the frontend tries to call this function, the transaction fails with "Direct transfers not allowed" because:
1. The function selector `0x57a80970` doesn't match any function in the deployed contract
2. Solidity routes unmatched calls to the `fallback()` function
3. The `fallback()` function reverts with "Direct transfers not allowed"

## Solution

You need to **redeploy the contract** with the updated code that includes `claimRefundForAbandoned`.

### Steps to Redeploy:

1. **Navigate to hardhat directory:**
   ```bash
   cd /home/praise/pong-it-pc/hardhat-blockchain
   ```

2. **Make sure your `.env` file has the required variables:**
   ```bash
   cat .env
   ```
   
   Should contain:
   ```
   PUSH_CHAIN_TESTNET_RPC_URL=https://evm.rpc-testnet-donut-node1.push.org/
   PRIVATE_KEY=your_private_key_here
   SIGNING_WALLET_PRIVATE_KEY=your_backend_signing_key_here
   PUSH_CHAIN_EXPLORER_API_KEY=your_explorer_api_key_here
   ```

3. **Compile the contract:**
   ```bash
   npx hardhat compile
   ```

4. **Deploy to Push Chain Testnet:**
   ```bash
   npx hardhat run scripts/deploy.ts --network pushChainTestnet
   ```

5. **Copy the new contract address** from the output

6. **Update frontend `.env` file:**
   ```bash
   # In /home/praise/pong-it-pc/push-chain-frontend/.env
   VITE_PONG_ESCROW_ADDRESS=<new_contract_address>
   ```

7. **Update backend `.env` file:**
   ```bash
   # In /home/praise/pong-it-pc/backend/.env
   PONG_ESCROW_ADDRESS=<new_contract_address>
   ```

8. **Verify the contract (optional but recommended):**
   ```bash
   npx hardhat verify --network pushChainTestnet <new_contract_address>
   ```

9. **Restart both frontend and backend:**
   - Frontend: Should auto-reload
   - Backend: Ctrl+C and `node src/server.js`

### What Changed in the Contract?

The new contract includes:
- `claimRefundForAbandoned(string roomCode, bytes signature)` function
- `AbandonedMatchRefunded` event
- Support for abandoned match refunds with backend signature verification

### Testing After Redeployment:

1. Create a staked room and stake
2. Click "Back" before opponent joins
3. Verify backend marks game as abandoned
4. Go to "Unclaimed Stakes" page
5. Click "Claim Refund" - should now work! ✅

---

**Note:** All previous staked games on the old contract will no longer be accessible. Make sure to claim any existing prizes before redeploying!

# Push Chain Quick Reference - PONG-IT

## 🚀 Quick Start

### Install & Run
```bash
cd push-chain-frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` in `push-chain-frontend/`:
```bash
VITE_PONG_ESCROW_ADDRESS=0x...  # Your deployed contract
VITE_PUSH_RPC_URL=https://evm.rpc-testnet-donut-node1.push.org/
VITE_BACKEND_URL=http://localhost:8080
```

---

## 📖 Common Code Patterns

### 1. Get Connected Wallet Info
```typescript
import { usePushWalletContext } from '@pushchain/ui-kit'

const { universalAccount, connectionStatus } = usePushWalletContext()
// universalAccount: CAIP format "eip155:42101:0x..."
// connectionStatus: 'connected' | 'connecting' | 'disconnected'

const isConnected = connectionStatus === 'connected'
```

### 2. Send Transaction
```typescript
import { usePushChainClient, usePushChain } from '@pushchain/ui-kit'

const { pushChainClient } = usePushChainClient()
const { PushChain } = usePushChain()

// Encode function data
const data = PushChain.utils.helpers.encodeTxData({
  abi: CONTRACT_ABI,
  functionName: 'stakeAsPlayer1',
  args: [roomCode]
})

// Send transaction
const tx = await pushChainClient.universal.sendTransaction({
  to: CONTRACT_ADDRESS,
  data,
  value: PushChain.utils.helpers.parseUnits('0.01', 18)
})

// Wait for confirmation
const receipt = await tx.wait(1)
console.log('Confirmed!', receipt.hash)
```

### 3. Get UEA (Universal Executor Account)
```typescript
import { useExecutorAddress } from '@/hooks/useExecutorAddress'

const { executorAddress, isLoading, originAddress } = useExecutorAddress()
// Use executorAddress for on-chain comparisons!
```

### 4. Read Contract Data
```typescript
import { useReadContract } from 'wagmi'

const { data, isLoading } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getMatch',
  args: [roomCode],
  query: { enabled: !!roomCode }
})
```

### 5. Explorer Link
```typescript
const { pushChainClient } = usePushChainClient()
const explorerUrl = pushChainClient.explorer.getTransactionUrl(txHash)
// https://donut.push.network/tx/0x...
```

---

## 🔄 Migration Cheat Sheet

| Need | Lisk (Old) | Push Chain (New) |
|------|-----------|------------------|
| **Wallet Button** | `<button onClick={() => open()}>` | `<PushUniversalAccountButton />` |
| **Account Hook** | `useAccount()` | `usePushWalletContext()` |
| **Address** | `address` | `universalAccount` |
| **Connected Check** | `isConnected` | `connectionStatus === 'connected'` |
| **Write Contract** | `writeContract({...})` | `pushChainClient.universal.sendTransaction({...})` |
| **Parse Value** | `parseEther('0.01')` | `PushChain.utils.helpers.parseUnits('0.01', 18)` |
| **Encode Data** | Auto | `PushChain.utils.helpers.encodeTxData({...})` |
| **Wait for Tx** | `useWaitForTransactionReceipt()` | `await tx.wait(1)` |
| **Read Contract** | `useReadContract()` | Same ✅ |
| **Chain ID** | `4202` | `42101` |
| **Explorer** | `sepolia-blockscout.lisk.com` | `donut.push.network` |

---

## ⚠️ Critical UEA Concept

```
User Wallet (Origin)          Push Chain Creates UEA
    0xUSER123...      →       0xUEA789... (Contract sees this!)
```

**Always use UEA for:**
- Filtering "My Wins"
- Checking ownership
- Comparing with contract data

**Use Origin for:**
- Display only
- User identification

---

## 🛠️ Hook Patterns

### Custom Write Hook Template
```typescript
export function useMyWriteFunction() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const executeFunction = useCallback(async (args) => {
    try {
      setState(prev => ({ ...prev, isPending: true, error: null }))

      const data = PushChain.utils.helpers.encodeTxData({
        abi: ABI,
        functionName: 'myFunction',
        args: [args]
      })

      const tx = await pushChainClient.universal.sendTransaction({
        to: CONTRACT_ADDRESS,
        data,
        value: BigInt(0) // or calculated value
      })

      setState(prev => ({ 
        ...prev, 
        hash: tx.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      await tx.wait(1)
      
      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false 
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return { executeFunction, ...state }
}
```

---

## 🎨 Component Patterns

### Transaction Loading Modal
```tsx
{isPending && (
  <div className="transaction-overlay">
    <div className="transaction-modal">
      <h3>
        {isPending && 'Confirm Transaction in Wallet...'}
        {isConfirming && 'Transaction Confirming...'}
      </h3>
      <div className="transaction-spinner"></div>
      <p>
        {isPending && 'Please confirm in your wallet'}
        {isConfirming && 'Waiting for blockchain confirmation'}
      </p>
    </div>
  </div>
)}
```

### Error Display
```tsx
{error && (
  <div className="error-container">
    <h3>Transaction Failed</h3>
    <div className="error-message">
      {getErrorMessage(error)}
    </div>
    <button onClick={retry}>Retry</button>
    <button onClick={cancel}>Cancel</button>
  </div>
)}
```

---

## 🧪 Testing Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check  # (need to add to package.json)

# Lint
npm run lint
```

---

## 🔍 Debugging Tips

### Check Connection Status
```typescript
const { connectionStatus, universalAccount } = usePushWalletContext()
console.log('Status:', connectionStatus)
console.log('Account:', universalAccount)
```

### Check Client Initialization
```typescript
const { pushChainClient } = usePushChainClient()
console.log('Client ready:', !!pushChainClient)
```

### Verify UEA Resolution
```typescript
const { executorAddress, originAddress } = useExecutorAddress()
console.log('Origin:', originAddress)
console.log('UEA:', executorAddress)
```

### Check Transaction Details
```typescript
const tx = await pushChainClient.universal.sendTransaction({...})
console.log('Tx hash:', tx.hash)
console.log('From (UEA):', tx.from)
console.log('To:', tx.to)
console.log('Value:', tx.value)
```

---

## 🚨 Common Errors & Solutions

### Error: "Client not initialized"
```typescript
// Check if client is ready
if (!pushChainClient || !PushChain) {
  throw new Error('Push Chain client not initialized')
}
```

### Error: "Cannot read property of undefined"
```typescript
// Always check connection status
if (connectionStatus !== 'connected') {
  return <div>Please connect wallet</div>
}
```

### Error: "Transaction failed"
```typescript
// Add better error handling
try {
  const tx = await pushChainClient.universal.sendTransaction({...})
} catch (error) {
  console.error('Full error:', error)
  console.error('Error message:', error.message)
  // Parse specific error types
}
```

### Error: "User not found in My Wins"
```typescript
// Use UEA, not origin!
const { executorAddress } = useExecutorAddress()
const wins = await fetchWins(executorAddress) // ✅
// NOT: await fetchWins(universalAccount) // ❌
```

---

## 📚 Useful Links

- **Push Chain Docs**: https://docs.push.org/
- **Push Chain Explorer**: https://donut.push.network/
- **Push Chain Faucet**: https://faucet.push.org/
- **UI Kit Docs**: https://docs.push.org/chain/ui-kit/
- **SDK Examples**: https://github.com/pushchain/push-chain-sdk
- **Full Migration Plan**: See `PUSH_CHAIN_MIGRATION_PLAN.md`
- **Summary**: See `MIGRATION_SUMMARY.md`



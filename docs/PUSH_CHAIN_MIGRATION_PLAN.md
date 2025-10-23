# Push Chain Migration Plan for PONG-IT

## Executive Summary

This document outlines the complete migration plan for moving the PONG-IT game from Lisk EVM (using Reown AppKit) to Push Chain (using Push Chain UI Kit). The migration focuses on wallet connection and blockchain transaction handling while maintaining all game logic unchanged.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Key Differences](#key-differences)
3. [Migration Phases](#migration-phases)
4. [Detailed Implementation Steps](#detailed-implementation-steps)
5. [Testing Strategy](#testing-strategy)
6. [Rollback Plan](#rollback-plan)

---

## Architecture Overview

### Current Setup (Lisk EVM)
```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Wallet: Reown AppKit + wagmi                    │   │
│  │ Chain: Lisk Sepolia (liskSepolia)               │   │
│  │ Contract Interactions: useWriteContract hooks    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  PongEscrow Smart Contract (Lisk Sepolia)              │
│  Address: 0xdDcF06C6312AB27a90a89bC247740DeDBADdc403  │
└─────────────────────────────────────────────────────────┘
```

### Target Setup (Push Chain)
```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Wallet: Push Universal Wallet (@pushchain/ui-kit)│  │
│  │ Chain: Push Chain Testnet (42101)               │   │
│  │ Contract Interactions: pushChainClient.universal │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  PongEscrow Smart Contract (Push Chain Testnet)        │
│  Address: [From .env - to be deployed]                 │
└─────────────────────────────────────────────────────────┘
```

---

## Key Differences

### 1. Wallet Connection
| Aspect | Lisk (Current) | Push Chain (Target) |
|--------|---------------|---------------------|
| **Library** | `@reown/appkit/react` | `@pushchain/ui-kit` |
| **Provider** | `WagmiProvider` + `createAppKit` | `PushUniversalWalletProvider` |
| **Button Component** | `useAppKit().open()` (custom button) | `PushUniversalAccountButton` |
| **Account Hook** | `useAccount()` from wagmi | `usePushWalletContext()` |
| **Address Access** | `address` from `useAccount()` | `universalAccount` from context |

### 2. Write Transactions
| Aspect | Lisk (Current) | Push Chain (Target) |
|--------|---------------|---------------------|
| **Method** | `useWriteContract()` hook | `pushChainClient.universal.sendTransaction()` |
| **Data Encoding** | wagmi handles it | `PushChain.utils.helpers.encodeTxData()` |
| **Value** | `parseEther(amount)` | `PushChain.utils.helpers.parseUnits(amount, 18)` |
| **Waiting for Confirmation** | `useWaitForTransactionReceipt()` | `await tx.wait()` |

### 3. Read Transactions
| Aspect | Lisk (Current) | Push Chain (Target) |
|--------|---------------|---------------------|
| **Method** | `useReadContract()` hook | Can keep using wagmi or use Push Chain SDK |
| **No Change Needed** | ✅ wagmi read hooks work on any EVM chain | ✅ |

### 4. Account Model (CRITICAL DIFFERENCE)
| Concept | Description | Impact |
|---------|-------------|--------|
| **Origin Address** | User's wallet address on source chain (e.g., EOA on Sepolia, or Push native) | This is what `universalAccount` contains |
| **UEA (Universal Executor Account)** | Deterministic executor contract on Push Chain | This is the `msg.sender` contracts see |
| **Key Issue** | Contracts see UEA as sender, not origin address | Must compare UEAs when checking ownership |

### 5. Network Configuration
```javascript
// Lisk Sepolia
Chain ID: 4202
RPC: https://rpc.sepolia-api.lisk.com
Explorer: https://sepolia-blockscout.lisk.com

// Push Chain Testnet
Chain ID: 42101
RPC: https://evm.rpc-testnet-donut-node1.push.org/
Explorer: https://donut.push.network/
```

---

## Migration Phases

### Phase 1: Setup & Dependencies ✅
**Status**: Partially complete (push-chain-frontend scaffold exists)

**Tasks**:
- [x] Create push-chain-frontend directory
- [x] Install @pushchain/ui-kit
- [ ] Add additional dependencies (socket.io-client, react-router-dom, etc.)
- [ ] Set up environment variables
- [ ] Copy assets (sounds, fonts, images)

### Phase 2: Provider & Wallet Integration
**Goal**: Replace Reown AppKit with Push Chain UI Kit

**Components to Modify**:
1. Root provider setup (`main.tsx` / `index.js`)
2. Web3 context provider
3. Wallet connect button

### Phase 3: Contract Interaction Hooks
**Goal**: Replace wagmi write hooks with Push Chain SDK

**Hooks to Migrate**:
1. `useStakeAsPlayer1` - Create match and stake
2. `useStakeAsPlayer2` - Join match and stake
3. `useClaimPrize` - Winner claims prize
4. `useClaimRefund` - Refund if opponent doesn't join
5. Read hooks (can keep as-is with wagmi)

### Phase 4: Component Migration
**Goal**: Update all components to use new hooks and context

**Components**:
1. `Welcome.js` → `Welcome.tsx`
2. `MultiplayerGame.js` → `MultiplayerGame.tsx`
3. `Game.js` → `Game.tsx`
4. `MyWins.js` → `MyWins.tsx`
5. `GameOver.js` → `GameOver.tsx`
6. `GameHistory.js` → `GameHistory.tsx`
7. `SpectatorView.js` → `SpectatorView.tsx`

### Phase 5: UEA Handling
**Goal**: Implement proper UEA resolution for account comparison

**Critical Areas**:
1. MyWins page - Must compare UEAs to filter user's wins
2. Backend integration - May need to store both origin and UEA
3. Signature verification - Ensure backend signs for correct address

### Phase 6: Testing & Validation
**Goal**: End-to-end testing on Push Chain Testnet

### Phase 7: Deployment & Launch
**Goal**: Deploy to production

---

## Detailed Implementation Steps

### Step 1: Environment Setup

**File**: `push-chain-frontend/.env`
```bash
# Contract addresses (from deployed PongEscrow)
VITE_PONG_ESCROW_ADDRESS=0x...  # To be filled after deployment

# Push Chain RPC
VITE_PUSH_RPC_URL=https://evm.rpc-testnet-donut-node1.push.org/

# Backend URL
VITE_BACKEND_URL=http://localhost:8080  # or production URL
```

**File**: `push-chain-frontend/.env.example` (for repo)
```bash
VITE_PONG_ESCROW_ADDRESS=your_contract_address_here
VITE_PUSH_RPC_URL=https://evm.rpc-testnet-donut-node1.push.org/
VITE_BACKEND_URL=http://localhost:8080
```

---

### Step 2: Install Dependencies

**File**: `push-chain-frontend/package.json`
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.1.4",
    "socket.io-client": "^4.8.1",
    "@pushchain/ui-kit": "^2.0.2",
    "@pushchain/core": "^2.0.20",
    "wagmi": "^2.14.11",
    "viem": "^2.23.8",
    "@tanstack/react-query": "^5.64.7"
  }
}
```

---

### Step 3: Root Provider Setup

**File**: `push-chain-frontend/src/main.tsx`
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import './index.css'
import App from './App.tsx'
import { PushChainProviders } from './providers/PushChainProviders.tsx'

// Push Chain Testnet configuration
const pushTestnet = {
  id: 42101,
  name: 'Push Chain Testnet',
  nativeCurrency: { name: 'Push Chain', symbol: 'PC', decimals: 18 },
  rpcUrls: { 
    default: { 
      http: [import.meta.env.VITE_PUSH_RPC_URL || 'https://evm.rpc-testnet-donut-node1.push.org/'] 
    } 
  },
  blockExplorers: { 
    default: { 
      name: 'Push Scan', 
      url: 'https://donut.push.network' 
    } 
  },
  testnet: true,
} as const

// Wagmi config for Push Chain (used for read operations)
const wagmiConfig = createConfig({
  chains: [pushTestnet],
  transports: { [pushTestnet.id]: http() },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PushChainProviders>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PushChainProviders>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
```

---

### Step 4: Update Push Chain Provider

**File**: `push-chain-frontend/src/providers/PushChainProviders.tsx`
```tsx
import {
  PushUI,
  PushUniversalWalletProvider,
  type AppMetadata,
  type ProviderConfigProps,
} from "@pushchain/ui-kit"

const PushChainProviders = ({ children }: { children: React.ReactNode }) => {
  const walletConfig: ProviderConfigProps = {
    network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,
    
    login: {
      email: true,
      google: true,
      wallet: {
        enabled: true,
      },
      appPreview: true,
    },
    
    modal: {
      loginLayout: PushUI.CONSTANTS.LOGIN.LAYOUT.SPLIT,
      connectedLayout: PushUI.CONSTANTS.CONNECTED.LAYOUT.HOVER,
      appPreview: true,
      connectedInteraction: PushUI.CONSTANTS.CONNECTED.INTERACTION.BLUR,
    },
    
    chainConfig: {
      rpcUrls: {
        // Ethereum Sepolia for cross-chain testing
        "eip155:11155111": ["https://rpc.sepolia.org"],
        // Solana devnet for cross-chain testing
        "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1": ["https://api.devnet.solana.com"],
      },
    },
  }

  const appMetadata: AppMetadata = {
    logoUrl: "/logo.png", // Add your logo
    title: "PONG-IT",
    description: "Multiplayer Pong with Crypto Staking on Push Chain",
  }

  return (
    <PushUniversalWalletProvider config={walletConfig} app={appMetadata}>
      {children}
    </PushUniversalWalletProvider>
  )
}

export { PushChainProviders }
```

---

### Step 5: Create Constants File

**File**: `push-chain-frontend/src/constants.ts`
```typescript
// Game constants
export const STORAGE_KEY = 'pong_username'

// Game settings
export const INITIAL_BALL_SPEED = 31
export const PADDLE_SPEED = 0.01
export const INITIAL_RATING = 1000

// Backend connection
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

// Contract address
export const PONG_ESCROW_ADDRESS = import.meta.env.VITE_PONG_ESCROW_ADDRESS as `0x${string}`

// Preset stake amounts (in PC/ETH)
export const STAKE_AMOUNTS = [
  { value: '0.001', label: '0.001 PC' },
  { value: '0.005', label: '0.005 PC' },
  { value: '0.01', label: '0.01 PC' },
  { value: '0.05', label: '0.05 PC' },
]

// Match status enum (must match contract)
export const MatchStatus = {
  NOT_CREATED: 0,
  PLAYER1_STAKED: 1,
  BOTH_STAKED: 2,
  COMPLETED: 3,
  REFUNDED: 4,
}
```

---

### Step 6: Create Contract ABI File

**File**: `push-chain-frontend/src/contracts/PongEscrow.ts`
```typescript
export const PONG_ESCROW_ABI = [
  // View functions
  {
    inputs: [{ internalType: 'string', name: 'roomCode', type: 'string' }],
    name: 'getMatch',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'player1', type: 'address' },
          { internalType: 'address', name: 'player2', type: 'address' },
          { internalType: 'uint256', name: 'stakeAmount', type: 'uint256' },
          { internalType: 'address', name: 'winner', type: 'address' },
          { internalType: 'enum PongEscrow.MatchStatus', name: 'status', type: 'uint8' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'completedAt', type: 'uint256' },
        ],
        internalType: 'struct PongEscrow.Match',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'roomCode', type: 'string' }],
    name: 'getMatchStatus',
    outputs: [{ internalType: 'enum PongEscrow.MatchStatus', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'roomCode', type: 'string' }],
    name: 'isRoomCodeAvailable',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Write functions
  {
    inputs: [{ internalType: 'string', name: 'roomCode', type: 'string' }],
    name: 'stakeAsPlayer1',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'roomCode', type: 'string' }],
    name: 'stakeAsPlayer2',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'roomCode', type: 'string' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'claimPrize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'roomCode', type: 'string' }],
    name: 'claimRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'roomCode', type: 'string' },
      { indexed: true, internalType: 'address', name: 'player1', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'stakeAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'MatchCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'roomCode', type: 'string' },
      { indexed: true, internalType: 'address', name: 'player2', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'totalPot', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'PlayerJoined',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'roomCode', type: 'string' },
      { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'PrizeClaimed',
    type: 'event',
  },
] as const
```

---

### Step 7: Create Contract Hooks with Push Chain SDK

**File**: `push-chain-frontend/src/hooks/usePushContract.ts`

This is the **MOST CRITICAL** file - it replaces wagmi's write hooks with Push Chain SDK.

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useReadContract } from 'wagmi'
import { usePushChainClient, usePushChain } from '@pushchain/ui-kit'
import { PONG_ESCROW_ADDRESS } from '../constants'
import { PONG_ESCROW_ABI } from '../contracts/PongEscrow'

// ============ READ HOOKS (Keep using wagmi) ============

export function useIsRoomCodeAvailable(roomCode: string) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'isRoomCodeAvailable',
    args: [roomCode],
    query: {
      enabled: !!roomCode && roomCode.length === 6,
    },
  })
}

export function useGetMatch(roomCode: string) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'getMatch',
    args: [roomCode],
    query: {
      enabled: !!roomCode && roomCode.length === 6,
    },
  })
}

export function useGetMatchStatus(roomCode: string) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'getMatchStatus',
    args: [roomCode],
    query: {
      enabled: !!roomCode && roomCode.length === 6,
    },
  })
}

// ============ WRITE HOOKS (Push Chain SDK) ============

interface TransactionState {
  hash: string | null
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
}

// Hook to stake as player 1 (create match)
export function useStakeAsPlayer1() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState<TransactionState>({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const stakeAsPlayer1 = useCallback(async (roomCode: string, stakeAmount: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not initialized')
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null }))

      // Encode function call
      const data = PushChain.utils.helpers.encodeTxData({
        abi: PONG_ESCROW_ABI,
        functionName: 'stakeAsPlayer1',
        args: [roomCode],
      })

      // Send transaction
      const txResponse = await pushChainClient.universal.sendTransaction({
        to: PONG_ESCROW_ADDRESS,
        data,
        value: PushChain.utils.helpers.parseUnits(stakeAmount, 18),
      })

      setState(prev => ({ 
        ...prev, 
        hash: txResponse.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      // Wait for confirmation
      const receipt = await txResponse.wait(1)
      
      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      console.error('Error staking as player 1:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false 
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return {
    stakeAsPlayer1,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}

// Hook to stake as player 2 (join match)
export function useStakeAsPlayer2() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState<TransactionState>({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const stakeAsPlayer2 = useCallback(async (roomCode: string, stakeAmount: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not initialized')
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null }))

      const data = PushChain.utils.helpers.encodeTxData({
        abi: PONG_ESCROW_ABI,
        functionName: 'stakeAsPlayer2',
        args: [roomCode],
      })

      const txResponse = await pushChainClient.universal.sendTransaction({
        to: PONG_ESCROW_ADDRESS,
        data,
        value: PushChain.utils.helpers.parseUnits(stakeAmount, 18),
      })

      setState(prev => ({ 
        ...prev, 
        hash: txResponse.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      const receipt = await txResponse.wait(1)
      
      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      console.error('Error staking as player 2:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false 
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return {
    stakeAsPlayer2,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}

// Hook to claim prize
export function useClaimPrize() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState<TransactionState>({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const claimPrize = useCallback(async (roomCode: string, signature: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not initialized')
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null }))

      const data = PushChain.utils.helpers.encodeTxData({
        abi: PONG_ESCROW_ABI,
        functionName: 'claimPrize',
        args: [roomCode, signature],
      })

      const txResponse = await pushChainClient.universal.sendTransaction({
        to: PONG_ESCROW_ADDRESS,
        data,
        value: BigInt(0),
      })

      setState(prev => ({ 
        ...prev, 
        hash: txResponse.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      const receipt = await txResponse.wait(1)
      
      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      console.error('Error claiming prize:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false 
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return {
    claimPrize,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}

// Hook to claim refund
export function useClaimRefund() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState<TransactionState>({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const claimRefund = useCallback(async (roomCode: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not initialized')
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null }))

      const data = PushChain.utils.helpers.encodeTxData({
        abi: PONG_ESCROW_ABI,
        functionName: 'claimRefund',
        args: [roomCode],
      })

      const txResponse = await pushChainClient.universal.sendTransaction({
        to: PONG_ESCROW_ADDRESS,
        data,
        value: BigInt(0),
      })

      setState(prev => ({ 
        ...prev, 
        hash: txResponse.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      const receipt = await txResponse.wait(1)
      
      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      console.error('Error claiming refund:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false 
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return {
    claimRefund,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}
```

---

### Step 8: Create Helper Hook for UEA Resolution

**File**: `push-chain-frontend/src/hooks/useExecutorAddress.ts`

```typescript
import { useEffect, useState } from 'react'
import { usePushWalletContext, usePushChain } from '@pushchain/ui-kit'

/**
 * Hook to resolve the Universal Executor Account (UEA) address
 * 
 * CRITICAL: On Push Chain, contracts see the UEA as msg.sender, not the origin address.
 * When checking ownership or filtering user-specific data, you MUST use the UEA.
 */
export function useExecutorAddress() {
  const { universalAccount } = usePushWalletContext()
  const { PushChain } = usePushChain()
  const [executorAddress, setExecutorAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const resolveExecutor = async () => {
      if (!universalAccount || !PushChain) {
        setExecutorAddress(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Convert origin account to executor (UEA)
        const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
          universalAccount,
          { onlyCompute: true }
        )
        
        setExecutorAddress(executorInfo.address)
      } catch (error) {
        console.error('Failed to resolve executor address:', error)
        setExecutorAddress(null)
      } finally {
        setIsLoading(false)
      }
    }

    resolveExecutor()
  }, [universalAccount, PushChain])

  return { executorAddress, isLoading, originAddress: universalAccount }
}
```

---

## Critical Implementation Notes

### 1. UEA vs Origin Address (MOST IMPORTANT)

**The Problem:**
- User connects with address `0xUSER123...` (origin)
- Push Chain creates deterministic UEA: `0xUEA789...`
- Contract sees `msg.sender = 0xUEA789...`
- Database stores `player1Address: 0xUSER123...`
- When filtering "My Wins", comparing `0xUSER123...` != `0xUEA789...` returns no results ❌

**The Solution:**
1. **In MyWins component**: Use `useExecutorAddress()` to get UEA, then query by UEA
2. **In Backend**: Store BOTH origin and UEA addresses:
   ```javascript
   {
     player1OriginAddress: "0xUSER123...",
     player1UEA: "0xUEA789...",
     // Use UEA for on-chain comparisons
   }
   ```
3. **In Smart Contract**: Already handles this correctly (sees UEA automatically)

### 2. Transaction Status Handling

Push Chain transactions return a different structure. Update your status checks:

```typescript
// Before (wagmi)
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

// After (Push Chain)
const [isConfirming, setIsConfirming] = useState(false)
const [isSuccess, setIsSuccess] = useState(false)

const txResponse = await pushChainClient.universal.sendTransaction({...})
setIsConfirming(true)
const receipt = await txResponse.wait(1)
setIsConfirming(false)
setIsSuccess(true)
```

### 3. Error Handling

Push Chain errors may have different structures. Update error parsing:

```typescript
const getErrorMessage = (error: Error) => {
  if (!error) return 'Unknown error occurred'

  const errorString = error.message || error.toString()

  // User rejection
  if (errorString.includes('User rejected') ||
      errorString.includes('User denied') ||
      errorString.includes('user rejected')) {
    return 'Transaction cancelled'
  }

  // Insufficient funds
  if (errorString.includes('insufficient funds')) {
    return 'Insufficient funds in your wallet'
  }

  // Contract revert messages
  if (errorString.includes('execution reverted:')) {
    const match = errorString.match(/execution reverted: (.+)/)
    if (match) return match[1]
  }

  return 'Transaction failed. Please try again.'
}
```

### 4. Explorer Links

Update block explorer URLs:

```typescript
// Before (Lisk)
const explorerUrl = `https://sepolia-blockscout.lisk.com/tx/${txHash}`

// After (Push Chain)
const explorerUrl = `https://donut.push.network/tx/${txHash}`

// Or use Push Chain SDK helper:
const explorerUrl = pushChainClient.explorer.getTransactionUrl(txHash)
```

---

## Component Migration Checklist

### Welcome Component
- [ ] Replace `useAppKit().open()` with `PushUniversalAccountButton`
- [ ] Replace `useAccount()` with `usePushWalletContext()`
- [ ] Update `isConnected` check to `connectionStatus === 'connected'`
- [ ] Update address display to use `universalAccount`
- [ ] Keep `useStakeAsPlayer1()` hook (but use new implementation)

### MultiplayerGame Component
- [ ] Replace wallet hooks
- [ ] Update staking modal to use new transaction states
- [ ] Keep all game logic (socket.io, canvas rendering, etc.)

### MyWins Component
- [ ] **CRITICAL**: Use `useExecutorAddress()` to get UEA
- [ ] Filter wins by UEA, not origin address
- [ ] Update explorer links to Push Chain
- [ ] Keep claim prize hook (but use new implementation)

### GameOver Component
- [ ] No wallet interaction - minimal changes
- [ ] May need to update explorer links if showing tx hashes

### App Component
- [ ] Update routing setup
- [ ] No major wallet changes needed

---

## Testing Strategy

### Unit Testing
1. Test hook transformations
   - `useStakeAsPlayer1` with mock Push Chain client
   - `useStakeAsPlayer2` with mock Push Chain client
   - `useClaimPrize` with signature verification
   - `useExecutorAddress` UEA resolution

### Integration Testing
1. **Wallet Connection Flow**
   - Connect with email
   - Connect with Google
   - Connect with MetaMask
   - Connect with Solana wallet (cross-chain)

2. **Staking Flow**
   - Player 1 creates staked match
   - Player 2 joins staked match
   - Verify both stakes on-chain

3. **Game Flow**
   - Complete full game
   - Winner claims prize
   - Verify prize receipt

4. **Edge Cases**
   - Player 1 cancels (refund)
   - Player 2 never joins (timeout refund)
   - Network switching
   - Transaction failures

### End-to-End Testing
1. Full game session with real wallets on Push Testnet
2. Cross-chain testing (Sepolia origin → Push Chain execution)
3. Mobile responsiveness testing
4. Multiple concurrent games

---

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**: Keep `frontend/` folder unchanged, switch DNS/routing back
2. **Partial Migration**: Run both frontends in parallel (different subdomains)
3. **Contract Rollback**: Deploy identical contract on Lisk if Push Chain has issues
4. **Data Consistency**: Ensure backend can handle both Lisk and Push Chain transactions

---

## Post-Migration Tasks

1. **Update Documentation**
   - Update README with Push Chain instructions
   - Add wallet connection guide
   - Document UEA concept for contributors

2. **Update Backend**
   - Store UEA addresses alongside origin addresses
   - Update winner signature to include UEA
   - Add Push Chain RPC for contract reads

3. **Monitoring**
   - Transaction success rates
   - Average confirmation times
   - Error rates by error type

4. **User Communication**
   - Migration announcement
   - New wallet setup guide
   - FAQ for Push Chain specifics

---

## Timeline Estimate

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Setup & Dependencies | 2 hours | High |
| Provider Integration | 3 hours | High |
| Contract Hooks | 6 hours | High |
| Component Migration | 12 hours | High |
| UEA Implementation | 4 hours | Critical |
| Testing | 8 hours | High |
| Bug Fixes | 4 hours | Medium |
| Documentation | 2 hours | Medium |
| **Total** | **41 hours** (~1 week) | |

---

## Success Criteria

✅ Wallet connects successfully with Push Chain UI Kit  
✅ Player 1 can create staked match on Push Chain  
✅ Player 2 can join and stake on Push Chain  
✅ Game completes and winner is determined correctly  
✅ Winner can claim prize using UEA  
✅ "My Wins" page shows correct wins using UEA  
✅ Explorer links work for Push Chain  
✅ No regression in game logic or user experience  
✅ Mobile-friendly and responsive  
✅ Cross-chain connections work (Sepolia, Solana)  

---

## Conclusion

This migration plan provides a **complete, step-by-step** approach to moving PONG-IT from Lisk EVM to Push Chain. The key challenges are:

1. **Wallet Integration**: Replacing Reown AppKit with Push Chain UI Kit
2. **Transaction Handling**: Using `pushChainClient.universal.sendTransaction()` instead of wagmi
3. **UEA Resolution**: **Most critical** - ensuring proper account address handling

Follow each step carefully, especially the UEA implementation, and test thoroughly before deploying to production.



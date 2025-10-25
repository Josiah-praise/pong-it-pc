// Game constants
// NOTE: STORAGE_KEY is DEPRECATED - Username is fetched from database via wallet address
// Kept for backwards compatibility only, not used for authentication
export const STORAGE_KEY = 'pong_username'

// Game settings
export const INITIAL_BALL_SPEED = 31
export const PADDLE_SPEED = 0.01
export const INITIAL_RATING = 1000

// Backend connection
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

// Contract address
export const PONG_ESCROW_ADDRESS = import.meta.env.VITE_PONG_ESCROW_ADDRESS as `0x${string}`
export const PONG_POWERUPS_ADDRESS = import.meta.env.VITE_PONG_POWERUPS_ADDRESS as `0x${string}`

// Validate that contract address is set
if (!PONG_ESCROW_ADDRESS || PONG_ESCROW_ADDRESS === 'undefined') {
}

export const POWER_UP_METADATA = {
  1: {
    id: 1,
    key: 'speed',
    name: 'Speed Surge',
    description: 'Temporary paddle acceleration for clutch saves',
    icon: '⚡'
  },
  2: {
    id: 2,
    key: 'shield',
    name: 'Guardian Shield',
    description: 'Summons an energy barrier that blocks one goal',
    icon: '🛡️'
  },
  3: {
    id: 3,
    key: 'multiball',
    name: 'Multiball Mayhem',
    description: 'Splits the ball for a burst of chaotic offense',
    icon: '💥'
  }
} as const

export const POWER_UP_IDS = Object.keys(POWER_UP_METADATA).map(Number)

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
} as const

// Chain configuration
export const PUSH_CHAIN_TESTNET = {
  id: 42101,
  name: 'Push Chain Testnet',
  nativeCurrency: { 
    name: 'Push Chain', 
    symbol: 'PC', 
    decimals: 18 
  },
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

// Push Chain Testnet Explorer URL
export const PUSH_CHAIN_TESTNET_EXPLORER = 'https://donut.push.network'

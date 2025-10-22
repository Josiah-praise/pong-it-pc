/**
 * PongEscrow Smart Contract ABI and Types
 * 
 * This contract handles staking and prize distribution for PONG-IT matches.
 * Deployed on Push Chain Testnet.
 */

export const PONG_ESCROW_ABI = [
  // ============ View Functions ============
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
  {
    inputs: [],
    name: 'backendOracle',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // ============ Write Functions ============
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
  {
    inputs: [
      { internalType: 'string', name: 'roomCode', type: 'string' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' }
    ],
    name: 'claimRefundForAbandoned',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'roomCode', type: 'string' }],
    name: 'claimExpiredMatchRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // ============ Events ============
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
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'roomCode', type: 'string' },
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'MatchRefunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'roomCode', type: 'string' },
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'AbandonedMatchRefunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'roomCode', type: 'string' },
      { indexed: true, internalType: 'address', name: 'player1', type: 'address' },
      { indexed: true, internalType: 'address', name: 'player2', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amountEach', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ExpiredMatchRefunded',
    type: 'event',
  },
] as const

// TypeScript types for better type safety
export interface Match {
  player1: `0x${string}`
  player2: `0x${string}`
  stakeAmount: bigint
  winner: `0x${string}`
  status: number
  createdAt: bigint
  completedAt: bigint
}

export type MatchStatus = 0 | 1 | 2 | 3 | 4



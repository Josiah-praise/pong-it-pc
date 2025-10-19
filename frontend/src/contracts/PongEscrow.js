// PongEscrow Contract Configuration
export const PONG_ESCROW_ADDRESS = '0xdDcF06C6312AB27a90a89bC247740DeDBADdc403';

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
  {
    inputs: [],
    name: 'backendOracle',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
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
  {
    inputs: [{ internalType: 'string', name: 'roomCode', type: 'string' }],
    name: 'claimExpiredMatchRefund',
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
];

// Match status enum
export const MatchStatus = {
  NOT_CREATED: 0,
  PLAYER1_STAKED: 1,
  BOTH_STAKED: 2,
  COMPLETED: 3,
  REFUNDED: 4,
};

// Preset stake amounts (in ETH)
export const STAKE_AMOUNTS = [
  { value: '0.001', label: '0.001 ETH' },
  { value: '0.005', label: '0.005 ETH' },
  { value: '0.01', label: '0.01 ETH' },
  { value: '0.05', label: '0.05 ETH' },
];

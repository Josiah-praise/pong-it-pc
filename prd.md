# Product Requirements Document (PRD)
# PONG-IT: Web2-Web3 Staking Game

---

## Document Information

| Field | Value |
|-------|-------|
| **Product Name** | PONG-IT |
| **Version** | 1.0 |
| **Date** | 2025-01-XX |
| **Status** | Draft |
| **Author** | Development Team |
| **Stakeholders** | Product, Engineering, Design |

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Functional Requirements (FRs)](#functional-requirements-frs)
4. [Non-Functional Requirements (NFRs)](#non-functional-requirements-nfrs)
5. [User Stories](#user-stories)
6. [Technical Specifications](#technical-specifications)
7. [Dependencies](#dependencies)
8. [Success Criteria](#success-criteria)
9. [Timeline](#timeline)
10. [Appendix](#appendix)

---

## Executive Summary

PONG-IT is a hybrid Web2-Web3 multiplayer Pong game that allows players to stake cryptocurrency on matches with winner-takes-all payouts. The MVP focuses on delivering a smooth, low-latency gaming experience while integrating blockchain-based staking through a smart contract escrow system.

**Core Value Proposition**: Real-time skill-based gaming with cryptocurrency stakes, combining the speed of traditional web games with the transparency and financial incentives of blockchain.

---

## Product Overview

### Vision
Create the first truly playable real-time Web3 game that doesn't compromise on gameplay quality while offering meaningful financial stakes.

### Goals
1. Launch functional staking system by Q1 2025
2. Achieve 100+ daily active matches in first month
3. Process $10k+ in staked volume in first quarter
4. Maintain <100ms gameplay latency
5. Zero fund losses due to smart contract vulnerabilities

### Out of Scope (v1.0)
- Tournament brackets
- Team play (2v2)
- NFT cosmetics
- Mobile native app
- Multiple token support (ETH only for MVP)

---

## Functional Requirements (FRs)

### FR-1: Wallet Integration

#### FR-1.1: Wallet Connection
**Priority**: P0 (Critical)
**Description**: Users must be able to connect their Web3 wallet to the application.

**Acceptance Criteria**:
- [ ] Detect MetaMask installation
- [ ] Display "Connect Wallet" button when not connected
- [ ] Show wallet address (truncated: 0x1234...5678) when connected
- [ ] Persist connection state across page refreshes
- [ ] Support wallet disconnection
- [ ] Handle wallet switching (update UI when user changes wallet)
- [ ] Show appropriate error if wallet not installed

**User Flow**:
```
User lands on homepage
→ Clicks "Connect Wallet"
→ MetaMask popup appears
→ User approves connection
→ Wallet address displayed in header
→ Staking features now accessible
```

#### FR-1.2: Network Detection
**Priority**: P1 (High)
**Description**: Application must detect and handle different blockchain networks.

**Acceptance Criteria**:
- [ ] Detect current network (chainId)
- [ ] Display network name in UI
- [ ] Prompt user to switch to supported network if on wrong chain
- [ ] Support multiple networks (Sepolia testnet, Polygon mainnet, Base)
- [ ] Disable staking features if on unsupported network

---

### FR-2: Match Creation

#### FR-2.1: Create Staked Match
**Priority**: P0 (Critical)
**Description**: Authenticated users can create a new staked match.

**Acceptance Criteria**:
- [ ] Button visible only when wallet connected
- [ ] Modal opens to select stake amount
- [ ] Preset stake amounts: 0.01, 0.05, 0.1, 0.5 ETH
- [ ] Display equivalent USD value
- [ ] Generate unique 6-character room code (e.g., "ABC123")
- [ ] Trigger MetaMask transaction popup with correct amount
- [ ] Show transaction pending state
- [ ] Update UI after transaction confirmation
- [ ] Display shareable room code prominently
- [ ] Provide "Copy Code" and "Copy Link" buttons
- [ ] Show "Waiting for opponent..." state

**Technical Details**:
- Contract function: `stakeAsPlayer1(string roomCode) payable`
- Room code format: `[A-Z0-9]{6}`
- Transaction timeout: 5 minutes

**Error Handling**:
- User rejects transaction → Show error, allow retry
- Insufficient balance → Show clear error message
- Transaction fails → Refund user, show error
- Network error → Retry mechanism

#### FR-2.2: Create Free Match
**Priority**: P1 (High)
**Description**: Users can create non-staked matches (existing functionality preserved).

**Acceptance Criteria**:
- [ ] Works without wallet connection
- [ ] Same room code system as staked matches
- [ ] No contract interaction
- [ ] Clearly labeled as "Free Mode"

---

### FR-3: Match Joining

#### FR-3.1: Join Staked Match
**Priority**: P0 (Critical)
**Description**: Users can join existing staked matches by entering room code.

**Acceptance Criteria**:
- [ ] Button visible only when wallet connected
- [ ] Input field for 6-character room code
- [ ] Real-time validation (uppercase conversion, length check)
- [ ] Display match details before joining:
  - Creator's address (truncated)
  - Stake amount
  - Total pot (stake × 2)
- [ ] "Join & Stake" button triggers MetaMask transaction
- [ ] Verify stake amount matches exactly
- [ ] Show transaction pending state
- [ ] Navigate to game screen after confirmation
- [ ] Start game when both players staked

**User Flow**:
```
User clicks "Join Staked Match"
→ Enters room code "ABC123"
→ Sees match details: "0.1 ETH stake, 0.2 ETH pot"
→ Clicks "Join & Stake"
→ MetaMask shows: "Send 0.1 ETH to PongEscrow"
→ User confirms
→ Transaction pending...
→ Both players staked!
→ Game starts automatically
```

**Error Handling**:
- Invalid room code → "Match not found"
- Match already full → "Match is full"
- Wrong stake amount → "Stake must be exactly X ETH"
- Creator tries to join own match → "Cannot join own match"

#### FR-3.2: Browse Public Matches
**Priority**: P2 (Medium)
**Description**: Users can browse available staked matches in a lobby.

**Acceptance Criteria**:
- [ ] Display list of waiting matches
- [ ] Show: Room code, stake amount, creator (truncated address), time waiting
- [ ] Real-time updates (WebSocket)
- [ ] Filter by stake amount
- [ ] Sort by newest/oldest/stake size
- [ ] Click to join directly

---

### FR-4: Gameplay

#### FR-4.1: Real-Time Game Session
**Priority**: P0 (Critical)
**Description**: Both players experience synchronized, low-latency gameplay.

**Acceptance Criteria**:
- [ ] Game starts automatically when both staked
- [ ] Display both players' addresses/names
- [ ] Show current score (0-5)
- [ ] Display stake amount on screen
- [ ] 60 FPS rendering (existing functionality)
- [ ] Responsive controls (mouse, keyboard, touch)
- [ ] Ball physics consistent across clients
- [ ] First to 5 points wins
- [ ] Game over screen displays winner with "Claim Prize" button

**Performance Requirements**:
- Latency: <100ms average
- Frame rate: 60 FPS stable
- Network tick rate: 60 Hz
- Max desync: 1 frame

**Note**: Spectator mode removed from MVP scope

#### FR-4.2: Game Abandonment
**Priority**: P1 (High)
**Description**: Handle player disconnection during game.

**Acceptance Criteria**:
- [ ] Detect player disconnect (socket timeout)
- [ ] Wait 30 seconds for reconnection
- [ ] If player doesn't return, declare other player winner
- [ ] Winner can claim prize
- [ ] Show appropriate message: "Opponent disconnected. You win! Claim your prize."

---

### FR-5: Payout System

#### FR-5.1: Winner Claim Payout (Pull-Based)
**Priority**: P0 (Critical)
**Description**: Winner manually claims full pot after game ends (pull-based pattern for security).

**Acceptance Criteria**:
- [ ] Backend determines winner (authoritative)
- [ ] Backend calls smart contract: `declareWinner(roomCode, winnerAddress)`
- [ ] Contract marks winner as eligible to claim (does NOT auto-transfer)
- [ ] Game over screen shows "Claim Prize" button for winner
- [ ] Winner clicks button → Triggers `claimPrize(roomCode)` transaction
- [ ] Winner pays gas for claim transaction
- [ ] Contract transfers full pot (stake × 2) to winner
- [ ] Display success message with transaction hash
- [ ] Update user's total winnings in database

**User Flow**:
```
Game ends → Backend declares winner
→ Winner sees: "You won! Claim 0.2 ETH"
→ Winner clicks "Claim Prize"
→ MetaMask popup: Gas fee ~$0.50
→ Winner confirms
→ Receives 0.2 ETH
→ "Prize claimed successfully! ✅"
```

**Technical Details**:
- Backend wallet only needed for `declareWinner()` call (low gas)
- Winner pays gas for their own claim (more decentralized)
- Prevents push-based reentrancy attacks
- Event emission: `MatchCompleted(roomCode, winner)` then `PrizeClaimed(roomCode, winner, amount)`

**Error Handling**:
- Winner rejects claim transaction → Can retry anytime
- Claim transaction fails → Retry mechanism
- Winner never claims → Funds locked (consider timeout after 30 days)

#### FR-5.2: Refund for Abandoned Matches
**Priority**: P1 (High)
**Description**: Players get refunded if opponent never joins or match is abandoned.

**Acceptance Criteria**:
- [ ] If only player 1 staked and 10 minutes pass → Refund available
- [ ] "Cancel Match & Refund" button visible after 10 minutes
- [ ] User triggers refund (self-serve, no backend needed)
- [ ] Contract function: `claimRefund(roomCode)`
- [ ] Stake returned minus gas fees (user pays gas)
- [ ] Match marked as cancelled

#### FR-5.3: Unclaimed Prize Timeout
**Priority**: P2 (Medium)
**Description**: Handle prizes that are never claimed by winners.

**Acceptance Criteria**:
- [ ] If winner doesn't claim within 30 days → Loser can claim refund
- [ ] Contract function: `claimExpiredMatchRefund(roomCode)`
- [ ] Both players get original stake back
- [ ] Prevents funds locked forever

---

### FR-6: User Profile & Stats

#### FR-6.1: Player Statistics
**Priority**: P1 (High)
**Description**: Track and display player performance metrics.

**Acceptance Criteria**:
- [ ] Total matches played
- [ ] Win/loss record
- [ ] Win rate percentage
- [ ] Total ETH staked
- [ ] Total ETH won
- [ ] Net profit/loss
- [ ] Current streak (wins/losses)
- [ ] Last played timestamp

#### FR-6.2: Leaderboard
**Priority**: P2 (Medium)
**Description**: Global ranking of top players.

**Acceptance Criteria**:
- [ ] Ranked by total winnings (default)
- [ ] Alternate sorts: win rate, matches played, streak
- [ ] Top 100 players displayed
- [ ] Real-time updates
- [ ] Show player's rank (if in top 100)

---

### FR-7: Match History

#### FR-7.1: Personal Match History
**Priority**: P2 (Medium)
**Description**: Users can view their past matches.

**Acceptance Criteria**:
- [ ] List of last 50 matches
- [ ] Show: Date, opponent, stake, result, payout
- [ ] Filter by: Won/Lost, Stake amount, Date range
- [ ] Link to transaction on block explorer
- [ ] Paginated results

---

### FR-8: Admin & Safety

#### FR-8.1: Emergency Pause
**Priority**: P1 (High)
**Description**: Ability to pause contract in case of critical bug.

**Acceptance Criteria**:
- [ ] Contract owner can pause new match creation
- [ ] Existing matches can still be completed
- [ ] Refunds still available when paused
- [ ] Clear message to users when paused

#### FR-8.2: Backend Health Monitoring
**Priority**: P1 (High)
**Description**: Monitor backend services for failures.

**Acceptance Criteria**:
- [ ] Health check endpoint (`/health`)
- [ ] Alert if backend wallet gas < threshold
- [ ] Alert if contract calls fail repeatedly
- [ ] Monitor WebSocket connection count
- [ ] Log all critical errors

---

## Non-Functional Requirements (NFRs)

### NFR-1: Performance

#### NFR-1.1: Gameplay Latency
**Priority**: P0 (Critical)
**Requirement**: Average input-to-screen latency must be <100ms

**Measurement**:
- 95th percentile latency <150ms
- 99th percentile latency <200ms
- Monitor via New Relic / Datadog

**Rationale**: Pong requires real-time responsiveness. Anything >100ms feels laggy.

#### NFR-1.2: Frame Rate
**Priority**: P0 (Critical)
**Requirement**: Game must maintain 60 FPS on target devices

**Target Devices**:
- Desktop: Chrome/Firefox/Safari (latest 2 versions)
- Mobile: iPhone 11+, Android flagship devices
- Screen sizes: 375px - 2560px width

**Measurement**:
- FPS monitoring via `requestAnimationFrame` timing
- Drop rate <1% (less than 1% of frames dropped)

#### NFR-1.3: Load Time
**Priority**: P1 (High)
**Requirement**: Page load to interactive <3 seconds

**Measurement**:
- First Contentful Paint (FCP): <1.5s
- Time to Interactive (TTI): <3s
- Lighthouse Performance Score: >90

#### NFR-1.4: WebSocket Stability
**Priority**: P0 (Critical)
**Requirement**: Socket connection uptime >99.5%

**Measurement**:
- Reconnection rate <5%
- Connection success rate >99%
- Automatic reconnection within 5 seconds

---

### NFR-2: Security

#### NFR-2.1: Smart Contract Security
**Priority**: P0 (Critical)
**Requirements**:
- [ ] Professional audit by reputable firm (CertiK, OpenZeppelin, Trail of Bits)
- [ ] Zero critical vulnerabilities
- [ ] Reentrancy protection (ReentrancyGuard)
- [ ] Pull-over-push pattern for payouts (prevents reentrancy)
- [ ] Checks-Effects-Interactions pattern
- [ ] Access control (Ownable)
- [ ] Input validation on all functions
- [ ] Emergency pause mechanism

**Pre-Launch**:
- Deploy to testnet for 2+ weeks
- Bug bounty program ($5k-$50k rewards)
- Internal security review

**Security Benefits of Pull-Based Payouts**:
- Eliminates reentrancy attack vectors
- Winner controls when to claim (no forced transfers)
- Reduces backend gas costs (winners pay own gas)
- More transparent (explicit claim transactions)

#### NFR-2.2: Backend Security
**Priority**: P0 (Critical)
**Requirements**:
- [ ] Private keys stored in secure vault (AWS KMS, HashiCorp Vault)
- [ ] Backend wallet only authorized to call `declareWinner()`
- [ ] Rate limiting on API endpoints (100 req/min per IP)
- [ ] DDoS protection (Cloudflare)
- [ ] HTTPS only (no HTTP)
- [ ] CORS properly configured

#### NFR-2.3: Frontend Security
**Priority**: P1 (High)
**Requirements**:
- [ ] No sensitive data in localStorage
- [ ] Input sanitization (prevent XSS)
- [ ] Content Security Policy (CSP) headers
- [ ] Subresource Integrity (SRI) for CDN assets
- [ ] Wallet connection via secure protocols only

#### NFR-2.4: Cheating Prevention
**Priority**: P0 (Critical)
**Requirements**:
- [ ] Server-authoritative game logic (client can't fake position)
- [ ] Ball physics calculated server-side only
- [ ] Score validated server-side
- [ ] Packet encryption (WSS)
- [ ] Unusual behavior detection (too-fast inputs, impossible moves)

---

### NFR-3: Scalability

#### NFR-3.1: Concurrent Matches
**Priority**: P1 (High)
**Requirement**: Support 100+ concurrent matches

**Measurement**:
- CPU usage <70% at 100 matches
- Memory usage <4GB at 100 matches
- No performance degradation

**Horizontal Scaling**:
- Stateless backend (can add more servers)
- Redis for session state
- Load balancer ready

#### NFR-3.2: Database Performance
**Priority**: P1 (High)
**Requirement**: Query response time <50ms (95th percentile)

**Optimization**:
- Index on walletAddress
- Index on createdAt (for match history)
- Connection pooling
- Query caching (Redis)

#### NFR-3.3: Blockchain Throughput
**Priority**: P1 (High)
**Requirement**: Handle transaction spikes during peak times

**Strategy**:
- Use L2 chain (Polygon, Base) for low fees + high throughput
- Gas price oracle for optimal pricing
- Transaction batching (if possible)
- Fallback RPC nodes

---

### NFR-4: Availability

#### NFR-4.1: Uptime
**Priority**: P0 (Critical)
**Requirement**: 99.5% uptime (SLA)

**Maximum Downtime**:
- 3.65 hours per month
- 43.8 hours per year

**Monitoring**:
- Pingdom / UptimeRobot for external monitoring
- PagerDuty alerts for downtime
- Status page (status.pongit.io)

#### NFR-4.2: Disaster Recovery
**Priority**: P1 (High)
**Requirements**:
- [ ] Daily database backups (7-day retention)
- [ ] Contract upgradability (proxy pattern) OR verified deployment script
- [ ] Backend redundancy (multiple servers)
- [ ] Recovery Time Objective (RTO): <1 hour
- [ ] Recovery Point Objective (RPO): <5 minutes

---

### NFR-5: Usability

#### NFR-5.1: Mobile Responsiveness
**Priority**: P0 (Critical)
**Requirement**: Fully playable on mobile devices

**Criteria**:
- Touch controls responsive
- UI scales properly (320px - 768px width)
- No horizontal scrolling
- Buttons large enough for touch (44px min)
- Text readable without zoom

#### NFR-5.2: Wallet Onboarding
**Priority**: P1 (High)
**Requirement**: Clear guidance for new Web3 users

**Criteria**:
- [ ] "What is a wallet?" help text
- [ ] Link to MetaMask installation
- [ ] Tooltips on first wallet connection
- [ ] Error messages in plain English (not tech jargon)
- [ ] Tutorial video (optional)

#### NFR-5.3: Transaction Clarity
**Priority**: P1 (High)
**Requirement**: Users understand what they're paying for

**Criteria**:
- [ ] Show exact amount before transaction
- [ ] Display USD equivalent
- [ ] Explain gas fees
- [ ] Show pending/confirmed/failed states clearly
- [ ] Provide block explorer links

#### NFR-5.4: Accessibility
**Priority**: P2 (Medium)
**Requirements**:
- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation support
- [ ] Screen reader compatible
- [ ] Color contrast ratios >4.5:1
- [ ] Alt text for images

---

### NFR-6: Maintainability

#### NFR-6.1: Code Quality
**Priority**: P1 (High)
**Requirements**:
- [ ] ESLint + Prettier configured
- [ ] Code coverage >70%
- [ ] No console.log in production
- [ ] TypeScript for new code (optional)
- [ ] Code reviews required for PRs

#### NFR-6.2: Documentation
**Priority**: P1 (High)
**Requirements**:
- [ ] README with setup instructions
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Smart contract NatSpec comments
- [ ] Architecture diagrams
- [ ] Runbook for common issues

#### NFR-6.3: Monitoring & Logging
**Priority**: P1 (High)
**Requirements**:
- [ ] Structured logging (JSON format)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic / Datadog)
- [ ] User analytics (Mixpanel / Amplitude)
- [ ] Contract event monitoring (The Graph / Dune Analytics)

---

### NFR-7: Compliance

#### NFR-7.1: Legal Compliance
**Priority**: P0 (Critical)
**Requirements**:
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Age verification (18+)
- [ ] Geo-blocking for restricted jurisdictions (if applicable)
- [ ] GDPR compliance (data deletion on request)

**Gambling vs. Skill Game**:
- Emphasize skill-based nature
- Avoid "gambling" terminology
- Consult legal counsel before launch

#### NFR-7.2: AML/KYC (Future)
**Priority**: P3 (Low for MVP)
**Note**: Not required for MVP (<$600 transactions), but plan for future

---

### NFR-8: Testability

#### NFR-8.1: Unit Test Coverage
**Priority**: P1 (High)
**Requirement**: >70% code coverage

**Focus Areas**:
- Smart contract: 100% (critical)
- Backend game logic: 80%
- Frontend components: 60%

**Tools**:
- Hardhat (contract testing)
- Jest + React Testing Library (frontend)
- Mocha (backend)

#### NFR-8.2: Integration Tests
**Priority**: P1 (High)
**Requirements**:
- [ ] End-to-end test: Create match → Join → Play → Win → Payout
- [ ] Test on testnet before mainnet
- [ ] Load testing (100 concurrent users)
- [ ] Chaos engineering (simulate failures)

---

## User Stories

### Epic 1: Wallet & Authentication

**US-1.1**: As a new user, I want to connect my MetaMask wallet so I can play staked matches.
- **Priority**: P0
- **Estimate**: 2 story points
- **Acceptance Criteria**: FR-1.1

**US-1.2**: As a user, I want to see my wallet balance so I know if I have enough funds to stake.
- **Priority**: P2
- **Estimate**: 1 story point

---

### Epic 2: Match Creation & Joining

**US-2.1**: As a user, I want to create a staked match with a custom amount so I can challenge others.
- **Priority**: P0
- **Estimate**: 5 story points
- **Acceptance Criteria**: FR-2.1

**US-2.2**: As a user, I want to share a match code with my friend so they can join my private match.
- **Priority**: P0
- **Estimate**: 2 story points
- **Acceptance Criteria**: Copy code, share link

**US-2.3**: As a user, I want to browse public matches so I can find opponents quickly.
- **Priority**: P2
- **Estimate**: 3 story points
- **Acceptance Criteria**: FR-3.2

---

### Epic 3: Gameplay

**US-3.1**: As a player, I want smooth 60 FPS gameplay so I can compete fairly.
- **Priority**: P0
- **Estimate**: 0 (already exists)
- **Acceptance Criteria**: NFR-1.1, NFR-1.2

**US-3.2**: As a player, I want to see the stake amount during the game so I remember what I'm playing for.
- **Priority**: P1
- **Estimate**: 1 story point

---

### Epic 4: Payouts

**US-4.1**: As a winner, I want to claim my prize with a single click so I can receive my winnings securely.
- **Priority**: P0
- **Estimate**: 5 story points
- **Acceptance Criteria**: FR-5.1

**US-4.2**: As a user, I want to get refunded if my opponent never joins so I don't lose my stake.
- **Priority**: P1
- **Estimate**: 3 story points
- **Acceptance Criteria**: FR-5.2

---

### Epic 5: Profile & Stats

**US-5.1**: As a user, I want to see my win/loss record so I can track my performance.
- **Priority**: P1
- **Estimate**: 3 story points
- **Acceptance Criteria**: FR-6.1

**US-5.2**: As a competitive player, I want to see the leaderboard so I can compare myself to others.
- **Priority**: P2
- **Estimate**: 2 story points
- **Acceptance Criteria**: FR-6.2

---

## Technical Specifications

### Tech Stack

**Frontend**:
- React 18
- ethers.js v6 (blockchain interaction)
- Socket.io-client (real-time communication)
- React Router (navigation)
- Canvas API (game rendering)

**Backend**:
- Node.js 18+
- Express.js
- Socket.io (WebSocket server)
- ethers.js (contract interaction)
- MongoDB (user data, stats)

**Smart Contract**:
- Solidity ^0.8.20
- Hardhat (development)
- OpenZeppelin contracts (ReentrancyGuard, Ownable)

**Infrastructure**:
- Hosting: Vercel (frontend), Railway/Render (backend)
- Database: MongoDB Atlas
- RPC: Alchemy / Infura
- Monitoring: Sentry, Datadog

---

### Smart Contract API

**Contract Address**: TBD (deploy to testnet first)

**Functions**:
```solidity
// Player 1 creates match and stakes
function stakeAsPlayer1(string calldata roomCode) external payable;

// Player 2 joins match with equal stake
function stakeAsPlayer2(string calldata roomCode) external payable;

// Backend declares winner (only backend can call) - does NOT transfer funds
function declareWinner(string calldata roomCode, address winner) external;

// Winner claims their prize (pull-based)
function claimPrize(string calldata roomCode) external;

// Player can refund if opponent doesn't join (after timeout)
function claimRefund(string calldata roomCode) external;

// Either player can claim refund if winner doesn't claim (after 30 days)
function claimExpiredMatchRefund(string calldata roomCode) external;

// Emergency pause (only owner)
function pause() external;
function unpause() external;
```

**Events**:
```solidity
event MatchCreated(string indexed roomCode, address indexed player1, uint256 stake);
event PlayerStaked(string indexed roomCode, address indexed player2, uint256 stake);
event WinnerDeclared(string indexed roomCode, address indexed winner);
event PrizeClaimed(string indexed roomCode, address indexed winner, uint256 amount);
event MatchRefunded(string indexed roomCode, address indexed player, uint256 amount);
```

---

### API Endpoints

**Authentication**:
- `POST /api/auth/nonce` - Get nonce for signature
- `POST /api/auth/verify` - Verify signature, return JWT

**User**:
- `GET /api/user/:address` - Get user profile
- `GET /api/user/:address/stats` - Get user statistics
- `GET /api/user/:address/matches` - Get match history

**Leaderboard**:
- `GET /api/leaderboard` - Get top players
- `GET /api/leaderboard/:address` - Get user rank

**Health**:
- `GET /health` - Health check

---

### Database Schema

**Users Collection**:
```javascript
{
  _id: ObjectId,
  walletAddress: String, // Lowercase, indexed, unique
  username: String, // Optional display name
  totalGamesPlayed: Number,
  wins: Number,
  losses: Number,
  totalStaked: String, // In ETH (string for precision)
  totalWon: String,
  netProfit: String, // Calculated: totalWon - totalStaked
  currentStreak: Number, // Win streak
  bestStreak: Number,
  createdAt: Date,
  lastActive: Date
}
```

**Matches Collection** (Optional - contract is source of truth):
```javascript
{
  _id: ObjectId,
  roomCode: String, // Indexed
  player1: String, // Wallet address
  player2: String,
  stakeAmount: String,
  winner: String,
  status: String, // CREATED, ACTIVE, COMPLETED, CANCELLED
  txHash: {
    create: String,
    join: String,
    complete: String
  },
  createdAt: Date,
  completedAt: Date
}
```

---

## Dependencies

### External Services
- **MetaMask**: Required for wallet connection
- **Blockchain RPC**: Alchemy or Infura (10k req/day free tier sufficient for MVP)
- **MongoDB Atlas**: Free tier (512MB) sufficient for MVP
- **Block Explorer**: Etherscan/Polygonscan for transaction links

### Internal Dependencies
- Existing game already has: Room system, Socket.io, Game physics
- Need to add: Wallet integration, Contract interaction, Backend contract listener

---

## Success Criteria

### Launch Success (Week 1)
- [ ] 50+ unique wallet connections
- [ ] 20+ staked matches completed
- [ ] $100+ total volume processed
- [ ] Zero critical bugs
- [ ] <1% transaction failure rate

### Month 1 Success
- [ ] 500+ unique wallets
- [ ] 100+ daily matches
- [ ] $5k+ monthly volume
- [ ] 99.5% uptime
- [ ] 30%+ player retention (return within 7 days)

### Quarter 1 Success
- [ ] 2,000+ unique wallets
- [ ] 500+ daily matches
- [ ] $50k+ quarterly volume
- [ ] Featured in 1+ crypto gaming publication
- [ ] Active Discord community (200+ members)

---

## Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Smart contract development
- [ ] Contract testing (Hardhat)
- [ ] Contract audit (internal)
- [ ] Deploy to testnet
- [ ] Wallet connect UI
- [ ] Contract interaction frontend

### Phase 2: Integration (Week 3-4)
- [ ] Backend contract listener
- [ ] Match creation flow
- [ ] Match joining flow
- [ ] Payout system
- [ ] End-to-end testing
- [ ] Bug fixes

### Phase 3: Polish (Week 5-6)
- [ ] UI/UX improvements
- [ ] Transaction status indicators
- [ ] Error handling
- [ ] Help documentation
- [ ] Load testing
- [ ] Security review

### Phase 4: Launch (Week 7-8)
- [ ] Testnet public beta (1 week)
- [ ] Bug bounty program
- [ ] External audit (optional)
- [ ] Mainnet deployment
- [ ] Marketing push
- [ ] Community onboarding

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Smart contract vulnerability | Low | Critical | Professional audit, pull-based pattern, testnet beta, bug bounty |
| Backend downtime during match | Medium | High | Auto-refund after timeout, redundant servers |
| Low user adoption | High | High | Free mode + staked mode, low minimum stakes |
| Gas fees too high | Medium | Medium | Deploy on L2 (Polygon/Base), not Ethereum mainnet |
| Regulatory issues | Low | Critical | Legal review, emphasize skill-based nature |
| Backend wallet key compromise | Low | Medium | Pull-based payouts reduce risk, hardware wallet, key rotation |
| Winner never claims prize | Low | Low | 30-day timeout allows refund for both players |

---

## Appendix

### Glossary

- **Stake**: Amount of cryptocurrency locked by both players before match
- **Pot**: Total prize pool (stake × 2)
- **Room Code**: Unique 6-character identifier for a match
- **Escrow**: Smart contract holding funds until match completion
- **Gas**: Transaction fee paid to blockchain network
- **L2**: Layer 2 scaling solution (Polygon, Arbitrum, etc.)
- **Oracle**: Off-chain data source (backend) that informs smart contract

### References

- [Solidity Documentation](https://docs.soliditylang.org/)
- [ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Socket.io Documentation](https://socket.io/docs/)

### Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-XX | Initial PRD | Development Team |

---

**End of Document**

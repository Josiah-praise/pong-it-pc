# PONG-IT Startup Guide

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- 8GB RAM available
- Ports 3000, 8080, and 5001 available

### Starting the Application

**1. Open Terminal/Command Prompt**

```bash
cd path/to/k-pong
```

**2. Start All Services**

```bash
docker-compose up --build
```

This single command will:
- Build Docker images for all 3 services
- Start containers in correct order
- Display logs from all services

**3. Wait for Services to Start**

Watch the logs until you see:
```
frontend_1         | webpack compiled successfully
backend_1          | Server running on port 8080
player-service_1   | Player ranking service running on port 5001
```

**4. Open Your Browser**

Navigate to: `http://localhost:3000`

**5. Play!**

Enter your username and start playing!

---

## Game Modes

### 🎮 Quick Match
**What:** Instant matchmaking with random online players

**How to Use:**
1. Click "Quick Match" button
2. Wait for an opponent
3. Game starts automatically when matched

**Best For:** Quick games, practicing, meeting new players

---

### ➕ Create Private Room
**What:** Create a room with a shareable code to play with friends

**How to Use:**
1. Click "Create Private Room"
2. Share the 6-character code (e.g., "XY4K2N") with your friend
3. Wait for them to join
4. Game starts when both players connected

**Best For:** Playing with specific friends, tournaments, private matches

---

### 🔗 Join Room
**What:** Join a friend's game using their room code

**How to Use:**
1. Get the room code from your friend
2. Click "Join Room"
3. Enter the 6-character code
4. Game starts immediately

**Best For:** Joining friend's games, accepting challenges

---

### 👁 Spectate Games
**What:** Watch live matches in real-time

**How to Use:**
1. Scroll to "Live Games" section on home screen
2. See list of active games showing:
   - Player names
   - Room code
   - Number of spectators
   - Game status (🎮 playing / ⏳ waiting)
3. Click any game to spectate
4. Watch the game live
5. Click "Leave" button to stop spectating

**Features:**
- Real-time game updates
- See spectator count live
- Multiple people can spectate same game
- No lag or delays

---

## Troubleshooting

### "Cannot connect to backend"

**Fix:**
```bash
docker-compose down
docker-compose up --build
```

### "Port already in use"

**Find what's using the port:**
```bash
# Windows
netstat -ano | findstr :8080

# Mac/Linux
lsof -i :8080
```

**Stop Docker and try again:**
```bash
docker-compose down
docker-compose up
```

### "Services not starting"

**Check Docker Desktop is running:**
1. Open Docker Desktop application
2. Ensure it shows "Docker Desktop is running"

**Clean restart:**
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### "Frontend shows blank screen"

**Clear browser cache:**
1. Open browser DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

---

## Development Mode

### Run Services Individually

**Backend:**
```bash
cd backend
pnpm install
pnpm dev
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm start
```

**Player Service:**
```bash
cd player-service
pnpm install
pnpm dev
```

**Note:** When running locally (not Docker):
- Update `.env` files to use `localhost` instead of service names
- Backend: `PLAYER_SERVICE_URL=http://localhost:5001`
- Frontend: `REACT_APP_BACKEND_URL=http://localhost:8080`

---

## Stopping the Application

### Stop Services
```bash
Ctrl + C  (in terminal running docker-compose)
```

### Stop and Remove Containers
```bash
docker-compose down
```

### Stop and Remove Everything (including volumes)
```bash
docker-compose down -v
```

---

## Monitoring

### View Service Logs

**All services:**
```bash
docker-compose logs -f
```

**Specific service:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f player-service
```

### Check Service Health

**Visit health endpoints:**
- Backend: `http://localhost:8080/health`
- Player Service: `http://localhost:5001/health`

**Expected response:**
```json
{
  "status": "OK",
  "service": "backend-service",
  "timestamp": "2025-10-16T..."
}
```

---

## Performance Tips

### Reduce Memory Usage

**Limit Docker resources:**
1. Open Docker Desktop
2. Settings → Resources
3. Set Memory to 4GB (minimum)
4. Set CPUs to 2 (minimum)

### Speed Up Builds

**Use cached layers:**
```bash
docker-compose build --parallel
```

---

## Features Overview

### Home Screen

**Top Section:**
- PONG-IT title with neon glow effect
- Three game mode buttons with icons

**Live Games Section:**
- Shows all active games
- Click any game to spectate
- Real-time spectator counts
- Game status indicators

**Leaderboard:**
- Top 10 players by ELO rating
- Win/Loss statistics
- Updates live after each game

**Instructions:**
- Controls explanation
- Game rules

### In-Game

**Player View:**
- Player names at top
- Live score board
- Room code display (private rooms only)
- 60 FPS gameplay
- Touch/mouse/keyboard controls

**Spectator View:**
- "SPECTATING" badge
- Spectator count
- Leave button
- Same smooth 60 FPS experience
- No control input (view only)

---

## Advanced Features

### ELO Rating System

**How it works:**
- All players start at 1000 rating
- Win against higher-rated player: gain more points
- Win against lower-rated player: gain fewer points
- Minimum gain: 5 points per win
- Rating determines leaderboard position

**Formula:**
```
New Rating = Old Rating + K * (Actual - Expected)
K = 32 (standard chess ELO)
Expected = 1 / (1 + 10^((Opponent - Player)/400))
```

### Multiple Simultaneous Games

**Architecture:**
- Each game runs independently
- Separate 60 FPS loop per game
- Isolated game state
- No cross-game interference
- Unlimited concurrent games (limited by server resources)

### Real-Time Synchronization

**How players stay in sync:**
1. Server calculates all game physics
2. Broadcasts game state 60 times/second
3. Clients render received state
4. Player inputs sent to server immediately
5. Server validates and applies inputs

**Benefits:**
- No cheating possible
- Perfect synchronization
- Fair gameplay for all players

---

## Data Persistence

### Current Setup (Development)

**Player Data:**
- Stored in memory (Map data structure)
- Lost when services restart
- Fast access, no database overhead

**Game Data:**
- Temporary per-game session
- Deleted when game ends
- Results saved to Player Service

### Production Considerations

**To add database:**
1. Add MongoDB/PostgreSQL to `docker-compose.yml`
2. Update Player Service to connect to DB
3. Replace `Map` with database queries
4. No changes needed to Backend or Frontend

---

## Keyboard Shortcuts

**In Game:**
- `↑` / `W` - Move paddle up
- `↓` / `S` - Move paddle down

**Browser:**
- `F12` - Open DevTools (see console logs)
- `Ctrl + Shift + R` - Hard refresh (clear cache)

---

## Support

**Issues:**
- GitHub: https://github.com/escapeSeq/k-pong/issues

**Logs Location:**
- Docker logs: `docker-compose logs -f`
- Browser console: F12 → Console tab

**Common Log Patterns:**

Good:
```
✓ Server running on port 8080
✓ Socket connected with ID: abc123
✓ Game started for room: XY4K2N
```

Bad:
```
✗ Connection error: ECONNREFUSED
✗ Socket error: timeout
✗ Failed to fetch player rating
```

---

## Next Steps

1. ✅ Start the app: `docker-compose up --build`
2. ✅ Open browser: `http://localhost:3000`
3. ✅ Enter username
4. ✅ Choose game mode
5. ✅ Start playing!

**Happy Gaming! 🎮**

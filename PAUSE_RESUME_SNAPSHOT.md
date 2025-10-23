# 🧊 Pause Resume Snapshot Fix

## Issue
After the 10-second pause timeout the pause overlay disappeared, but the ball remained frozen. The frontend never received a fresh game state, so the UI continued to display the last pre-pause frame.

## Fix
1. **Request refreshed game state on resume**
   - Frontend emits `requestGameState` when pause ends.
2. **Backend handler**
   - `handleRequestGameState` finds the player's current game and emits `gameStateSnapshot` directly to the requesting socket.
3. **Frontend listener**
   - Updates `gameData` and `prevGameDataRef` when `gameStateSnapshot` is received, resuming animations.

## Additional improvement
- Pause banner now shows a live countdown (already implemented).

Result: when the timer finishes, the game resumes with live ball movement.


# 🏓 Pause Ball Reset Fix

## Issue
After a pause, sometimes the ball stayed stationary even when the countdown ended. The game resumed but ball velocity remained zero (often because a score/reset occurred during the pause).

## Fix
Inside `handleResumeGame`:
1. After resuming the game in GameManager, call `resetBall(game)` to ensure ball velocity is restored.
2. Emit `gameStateSnapshot` to the whole room before the `gameResumed` event so clients update immediately.

Result: ball always relaunches with velocity upon resume.


# ⏳ Pause Limit Update

## Summary
- Enforced **one pause per player** per match.
- Added a `pauseHistory` map to track which socket IDs have already paused.
- Updated error handling to show a clear message when a player attempts a second pause.
- Frontend now displays the parsed error message via `showAlert`.

## Code Touchpoints
1. `backend/src/gameManager.js`
   ```js
   if (game.pauseHistory[playerSocketId]) {
     return { success: false, error: 'You have already used your pause' };
   }
   game.pauseHistory[playerSocketId] = true;
   ```
2. `push-chain-frontend/src/components/MultiplayerGame.tsx`
   ```ts
   const parsedError = parseTransactionError(player2StakingError);
   setStakingErrorMessage(parsedError.message);
   showAlert(parsedError.message, 'Staking Error');
   ```

Players now get exactly one pause each, and they receive a clear message if they try to pause again.


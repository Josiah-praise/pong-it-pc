# 🏳️ Forfeit UX Update

## Summary
- Prevent the forfeiting player from seeing the intrusive "opponent left" modal.
- Broadcast `playerForfeited` to everyone but also emit a targeted `playerForfeitedSelf` event to the forfeiting socket.
- On the frontend, the local player now receives a subtle toast (`showInfoToast`) while opponents keep the existing modal.

## Files Touched
1. `backend/src/multiplayerHandler.js`
2. `push-chain-frontend/src/components/MultiplayerGame.tsx`


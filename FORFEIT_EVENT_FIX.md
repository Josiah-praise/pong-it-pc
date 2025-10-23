# 🏳️ Forfeit Event Fix

## Issue
The opponent returned to home without seeing the forfeit alert because the client filtered out `playerForfeited` events when `data.forfeitedPlayer === username`.

## Fix
- Removed the local check so only the forfeiting player handles `playerForfeitedSelf`, and everyone else still sees `playerForfeited`.
- Forfeiting player receives the subtle toast and navigation via the `playerForfeitedSelf` event only.

## Result
- Forfeiting player gets the subtle notification and quick navigation home.
- Opponent receives the full modal with winner information before leaving.


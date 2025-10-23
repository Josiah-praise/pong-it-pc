# 🎯 Rematch Decline Targeting Fix

## Issue
When a player declined a rematch, the backend broadcasted `rematchDeclined` to the entire room. Both players (including the decliner) saw the popup, causing confusing UX.

## Fix
In `handleRematchResponse`, determine which player initiated the rematch and emit the decline event only to that player:
```js
const hostSocketId = room.host?.name ? this.gameOverPlayers.get(room.host.name) : null;
const guestSocketId = room.guest?.name ? this.gameOverPlayers.get(room.guest.name) : null;

let requesterSocketId = null;
if (socket.id === hostSocketId && guestSocketId) {
  requesterSocketId = guestSocketId; // host declined, notify guest
} else if (socket.id === guestSocketId && hostSocketId) {
  requesterSocketId = hostSocketId; // guest declined, notify host
}

if (requesterSocketId) {
  this.io.sockets.sockets.get(requesterSocketId)?.emit('rematchDeclined');
}
```

## Result
Only the rematch initiator receives the “opponent declined” message; the decliner no longer sees the popup.


# 🔒 Wallet Required For Actions

## Summary
- All primary mode buttons (`Play Now`, `Create Room`, `Join Room`, `Staked Match`) now require a connected wallet.
- If the wallet isn’t connected, buttons are disabled and clicking triggers a friendly alert prompting connection.

## Implementation
- Added `isWalletReady = isConnected && !!address` in `Welcome.tsx`.
- Wrapped each handler with an early return + `showAlert` when wallet is missing.
- Bound `disabled={!isWalletReady}` to all four buttons.


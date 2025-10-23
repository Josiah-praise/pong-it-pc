# 🟣 Wallet Gate for All Modes

Synced the behaviour across all mode buttons:
- `Quick Match`, `Create Room`, `Join Room`, and `Staked Match` all have `disabled={!isWalletReady}`.
- Clicking any of them without a connected wallet raises the same gentle "Please connect your wallet" alert.

File: `push-chain-frontend/src/components/Welcome.tsx`

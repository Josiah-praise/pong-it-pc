# Push Chain Ticketing — Deploy and Integrate Guide

This README teaches you how to deploy the TicketChain contracts to Push Chain testnet and integrate the Push Chain UI Kit to build a universal, cross‑chain dApp. It assumes you know how to build EVM dApps with wagmi/viem/ethers and standard wallet modals.

Sections
- Deploy Contracts on Push
- Integrate the UI Kit
- Send Universal Transactions
- Cross‑Chain (Solana/EVM) Flows
- UEA vs Origin Explained
- Troubleshooting
- Appendix: Env & RPC

Important Notes
- Use only the network details and patterns in this repo.
- UI kit and SDK versions are not pinned; install latest.
- Contract addresses are dynamic; plug in your own deployments.
- This guide intentionally skips IPFS specifics.

## Deploy Contracts on Push

Prerequisites
- Node.js LTS and npm
- Push Testnet wallet private key with PC for gas
- `.env` at repo root with `PRIVATE_KEY=...` (never commit secrets)

Network (from this repo)
- Chain ID: `42101`
- RPCs: `https://evm.rpc-testnet-donut-node1.push.org/` (primary), `https://evm.rpc-testnet-donut-node2.push.org/` (alt)
- Explorer: `https://donut.push.network/`

Install & Compile
```
npm install
npx hardhat compile
```

Deploy with Hardhat Script
```
npx hardhat run scripts/deploy.js --network push_testnet
```
This deploys:
- `TicketNFT` then `TicketFactory` and `TicketMarketplace`
- Calls `TicketNFT.setFactory(<TicketFactory>)`

Deploy with Ignition (alternative)
```
npx hardhat ignition deploy ignition/modules/DeployTicketChain.ts --network push_testnet
```
Latest example deployment in this repo (treat as example only):
- `TicketNFT`: `0xb01EA7C00cCe6D8d481e4947c8dBd8589e5fD04c`
- `TicketFactory`: `0xbaf600B3343a32Dfff5991D2c470D885B4D1E2Ea`
- `TicketMarketplace`: `0x46132Ea822faA3aa9BdCdBa0693cf51E86703065`

Verify on Push Scan (Blockscout)
```
npx hardhat verify --network push_testnet <TicketNFT>
npx hardhat verify --network push_testnet <TicketFactory> <TicketNFT>
npx hardhat verify --network push_testnet <TicketMarketplace> <TicketNFT>
```

## Integrate the UI Kit

Install Dependencies (latest)
```
npm i @pushchain/ui-kit @pushchain/core wagmi viem ethers @tanstack/react-query react react-dom
```

Provider Setup
- Wrap your React tree with Push UI Kit, wagmi, and React Query.
- Keep the same login surface, modal layouts, and RPC overrides used here.

Example root setup (condensed)
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PushUniversalWalletProvider, PushUI, type AppMetadata, type ProviderConfigProps } from '@pushchain/ui-kit';

const pushTestnet = {
  id: 42101,
  name: 'Push Chain Testnet',
  nativeCurrency: { name: 'Push Chain', symbol: 'PC', decimals: 18 },
  rpcUrls: { default: { http: ['https://evm.rpc-testnet-donut-node1.push.org/'] } },
  blockExplorers: { default: { name: 'Push Scan', url: 'https://donut.push.network' } },
  testnet: true,
} as const;

const wagmiConfig = createConfig({
  chains: [pushTestnet],
  transports: { [pushTestnet.id]: http() },
});

const walletConfig: ProviderConfigProps = {
  network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,
  login: { email: true, google: true, wallet: { enabled: true }, appPreview: true },
  modal: {
    loginLayout: PushUI.CONSTANTS.LOGIN.LAYOUT.SPLIT,
    connectedLayout: PushUI.CONSTANTS.CONNECTED.LAYOUT.HOVER,
    appPreview: true,
    connectedInteraction: PushUI.CONSTANTS.CONNECTED.INTERACTION.BLUR,
  },
  chainConfig: {
    rpcUrls: {
      'eip155:11155111': ['https://rpc.sepolia.org'],
      'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': ['https://api.devnet.solana.com'],
    },
  },
};

const appMetadata: AppMetadata = {
  title: 'TicketChain',
  description: 'Universal ticketing powered by Push Chain',
  logoUrl: 'https://avatars.githubusercontent.com/u/64157541?v=4',
};

const queryClient = new QueryClient();

function App() { return <div>…</div>; }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PushUniversalWalletProvider config={walletConfig} app={appMetadata}>
          <App />
        </PushUniversalWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
```

Wallet Button
```tsx
import { PushUniversalAccountButton, usePushWalletContext } from '@pushchain/ui-kit';

function Header() {
  const { connectionStatus } = usePushWalletContext();
  return (
    <div>
      <PushUniversalAccountButton />
      {connectionStatus !== 'connected' && <span>Connect to start</span>}
    </div>
  );
}
```

## Send Universal Transactions

Simple Native Transfer on Push (no bridging)
```ts
const tx = await pushChainClient.universal.sendTransaction({
  to: '0xRecipient',
  value: PushChain.utils.helpers.parseUnits('0.001', 18), // 0.001 PC
});
await tx.wait();
```

Contract Call on Push (no bridging)
```ts
const data = PushChain.utils.helpers.encodeTxData({
  abi: TicketFactoryABI,
  functionName: 'addTicketType',
  args: [eventId, name, price, supply, imageHash],
});
const tx = await pushChainClient.universal.sendTransaction({ to: FACTORY, data });
await tx.wait();
```

Bridged Funds + Contract Call (origin → Push)
```ts
const tx = await pushChainClient.universal.sendTransaction({
  to: FACTORY,
  data: PushChain.utils.helpers.encodeTxData({
    abi: TicketFactoryABI,
    functionName: 'purchaseTicket',
    args: [eventId, ticketTypeId],
  }),
  value: priceInPC,
  funds: { amount: PushChain.utils.helpers.parseUnits('0.1', 18) }, // move 0.1 native from origin
});
await tx.wait();
```

Explorer Link
```ts
pushChainClient.explorer.getTransactionUrl(tx.hash);
```

## Cross‑Chain (Solana/EVM) Flows

EVM Origin (e.g., Sepolia)
- Connect via Push modal; universal writes work without switching to a Push-native wallet.
- Use `value` in PC for on‑Push payments, or `funds` to bridge origin native within the call.

Solana Origin (devnet)
- Set wallet to Solana devnet with a small SOL balance.
- Keep CAIP mapping: `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` → `https://api.devnet.solana.com`.
- Use the same `sendTransaction` API; the SDK handles fee‑locker and execution.

## UEA vs Origin Explained

Concepts
- Origin address: user’s wallet on the source chain (e.g., Sepolia EOA or Solana pubkey).
- UEA (Universal Executor Account): deterministic executor on Push; contracts see `msg.sender = UEA`.

Always Compare UEAs
```ts
const { universalAccount } = usePushWalletContext();
const { PushChain } = usePushChain();
const executor = await PushChain.utils.account.convertOriginToExecutor(
  universalAccount,
  { onlyCompute: true }
);
const organizerUEA = executor.address; // compare this to addresses stored on Push
```

Important Nuance
- UEAs are contracts on Push; ERC‑721 mints may use `_mint` (not `_safeMint`) for contract recipients.

## Troubleshooting

Solana purchase fails with `SimulateError`
- Ensure Solana CAIP maps to devnet (`https://api.devnet.solana.com`) and wallet is on devnet with enough SOL.

Empty “My Tickets” after cross‑chain purchase
- Compare with UEA, not origin; resolve executor with `convertOriginToExecutor`.

`IncorrectPayment` on purchases
- Refresh price and ensure `value` equals ticket price in PC.

Batch listing rejects with universal account
- Current marketplace batch listing is EVM‑direct; connect a Push testnet EVM wallet or migrate to universal writes.

Explorer/chain mismatch
- Use chain ID `42101` across wagmi/Hardhat.

## Appendix: Env & RPC

Push Testnet
- Chain ID: `42101`
- RPCs: `https://evm.rpc-testnet-donut-node1.push.org/`, `https://evm.rpc-testnet-donut-node2.push.org/`
- Explorer: `https://donut.push.network/`

Frontend Env (dynamic)
- `VITE_TICKET_FACTORY_ADDRESS`, `VITE_TICKET_NFT_ADDRESS`, `VITE_MARKETPLACE_ADDRESS`
- Choose a single Push RPC var name (e.g., `VITE_PUSH_RPC_URL`) and use consistently in your code.

CAIP Mappings
- `eip155:11155111` → `https://rpc.sepolia.org`
- `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` → `https://api.devnet.solana.com`

Mini Demo Snippets
```tsx
// Send 0.001 PC and link to explorer
import { useState } from 'react';
import { usePushChain, usePushChainClient } from '@pushchain/ui-kit';

export function SendPcButton({ to }: { to: `0x${string}` }) {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [hash, setHash] = useState<string | null>(null);
  const send = async () => {
    const tx = await pushChainClient!.universal.sendTransaction({
      to,
      value: PushChain.utils.helpers.parseUnits('0.001', 18),
    });
    setHash(tx.hash);
    await tx.wait();
  };
  return hash ? (
    <a href={pushChainClient!.explorer.getTransactionUrl(hash)} target="_blank" rel="noreferrer">View on Explorer</a>
  ) : (
    <button onClick={send}>Send 0.001 PC</button>
  );
}
```

```ts
// Resolve UEA for user-specific reads
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { usePushWalletContext, usePushChain } from '@pushchain/ui-kit';

export function useExecutorAddress() {
  const { address: origin } = useAccount();
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();
  const [executor, setExecutor] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      if (!universalAccount || !PushChain) { setExecutor(origin ?? null); return; }
      const info = await PushChain.utils.account.convertOriginToExecutor(universalAccount, { onlyCompute: true });
      setExecutor(info.address);
    })();
  }, [origin, universalAccount, PushChain]);
  return executor;
}
```

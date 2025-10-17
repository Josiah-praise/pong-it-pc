import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { liskSepolia } from '@reown/appkit/networks';

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Project metadata for AppKit
const metadata = {
  name: 'PONG-IT',
  description: 'Multiplayer Pong with Crypto Staking',
  url: 'https://pong-it.app',
  icons: ['https://pong-it.app/logo.png']
};

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [liskSepolia],
  projectId
});

// Create AppKit - must be called at module level before any components use it
createAppKit({
  adapters: [wagmiAdapter],
  networks: [liskSepolia],
  projectId,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#7b3fe4',
    '--w3m-border-radius-master': '8px',
  },
  features: {
    analytics: true,
  }
});

// Export the chain for use elsewhere
export { liskSepolia };

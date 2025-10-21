import {
  PushUI,
  PushUniversalWalletProvider,
  type AppMetadata,
  type ProviderConfigProps,
} from "@pushchain/ui-kit"

/**
 * PushChainProviders Component
 * 
 * Wraps the PONG-IT application with Push Chain's Universal Wallet Provider.
 * Enables cross-chain wallet connections and universal transactions.
 */

const PushChainProviders = ({ children }: { children: React.ReactNode }) => {
  // Wallet configuration for PONG-IT
  const walletConfig: ProviderConfigProps = {
    // Use testnet for development
    network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,
    
    // Enable multiple login methods for accessibility
    login: {
      email: true,        // Email authentication
      google: true,       // Google OAuth
      wallet: {
        enabled: true,    // Crypto wallet connection (MetaMask, etc.)
      },
      appPreview: true,   // Show app preview in login modal
    },
    
    // Modal UI configuration
    modal: {
      loginLayout: PushUI.CONSTANTS.LOGIN.LAYOUT.SPLIT,
      connectedLayout: PushUI.CONSTANTS.CONNECTED.LAYOUT.HOVER,
      appPreview: true,
      connectedInteraction: PushUI.CONSTANTS.CONNECTED.INTERACTION.BLUR,
    },
    
    // Cross-chain RPC configuration (for testing cross-chain features)
    chainConfig: {
      rpcUrls: {
        // Ethereum Sepolia testnet
        "eip155:11155111": ["https://rpc.sepolia.org"],
        // Solana devnet
        "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1": ["https://api.devnet.solana.com"],
      },
    },
  }

  // PONG-IT app branding
  const appMetadata: AppMetadata = {
    logoUrl: "/logo.png", // TODO: Add your logo to public folder
    title: "PONG-IT",
    description: "Multiplayer Pong with Crypto Staking on Push Chain. Challenge opponents and win real rewards!",
  }

  return (
    <PushUniversalWalletProvider config={walletConfig} app={appMetadata}>
      {children}
    </PushUniversalWalletProvider>
  )
}

export { PushChainProviders }
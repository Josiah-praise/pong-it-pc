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
    
    // Modal UI configuration - Dark theme
    modal: {
      loginLayout: PushUI.CONSTANTS.LOGIN.LAYOUT.SPLIT,
      connectedLayout: PushUI.CONSTANTS.CONNECTED.LAYOUT.HOVER,
      appPreview: true,
      connectedInteraction: PushUI.CONSTANTS.CONNECTED.INTERACTION.BLUR,
      theme: PushUI.CONSTANTS.THEME.DARK,  // Dark mode
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
    logoUrl: `${window.location.origin}/logo.svg`,
    title: "PONG-IT",
    description: "Multiplayer Pong with Crypto Staking on Push Chain. Challenge opponents and win real rewards!",
  }

  // Dark theme customization - top level overrides
  const themeOverrides = {
    // Primary backgrounds - Black theme (applies to ALL backgrounds)
    '--pw-core-bg-primary-color': '#000000',
    '--pw-core-bg-secondary-color': '#000000',
    '--pw-core-bg-tertiary-color': '#0A0A0A',
    '--pw-core-bg-disabled-color': '#1A1A1A',
    
    // Brand colors - Your pink theme
    '--pw-core-brand-primary-color': '#DA76EC',
    '--pw-core-modal-border-color': '#DA76EC',
    '--pw-core-btn-primary-bg-color': '#DA76EC',
    '--pw-core-btn-primary-text-color': '#FFFFFF',
    '--pwauth-btn-connect-bg-color': '#DA76EC',
    '--pwauth-btn-connect-text-color': '#FFFFFF',
    
    // Text colors for dark theme
    '--pw-core-text-primary-color': '#FFFFFF',
    '--pw-core-text-secondary-color': '#E0E0E0',
    '--pw-core-text-tertiary-color': '#B0B0B0',
    '--pw-core-text-link-color': '#DA76EC',
    
    // Border radius for modern look
    '--pw-core-modal-border-radius': '16px',
    '--pw-core-btn-border-radius': '12px',
    '--pwauth-btn-connect-border-radius': '12px',
  }

  return (
    <PushUniversalWalletProvider 
      config={walletConfig} 
      app={appMetadata}
      themeOverrides={themeOverrides}
      themeMode={PushUI.CONSTANTS.THEME.DARK}
    >
      {children}
    </PushUniversalWalletProvider>
  )
}

export { PushChainProviders }
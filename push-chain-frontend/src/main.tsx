import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import './index.css'
import App from './App.tsx'
import { PushChainProviders } from './providers/PushChainProviders.tsx'
import { PUSH_CHAIN_TESTNET } from './constants'

// Wagmi config for Push Chain (used for read operations)
const wagmiConfig = createConfig({
  chains: [PUSH_CHAIN_TESTNET],
  transports: { 
    [PUSH_CHAIN_TESTNET.id]: http(PUSH_CHAIN_TESTNET.rpcUrls.default.http[0])
  },
})

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PushChainProviders>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PushChainProviders>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
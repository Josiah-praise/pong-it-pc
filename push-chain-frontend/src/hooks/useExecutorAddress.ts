/**
 * Hook to Resolve Universal Executor Account (UEA)
 * 
 * CRITICAL: On Push Chain, contracts see the UEA as msg.sender, not the origin address.
 * 
 * Example Flow:
 * 1. User connects wallet: 0xUSER123... (origin address)
 * 2. Push Chain creates UEA: 0xUEA789... (deterministic)
 * 3. User calls stakeAsPlayer1()
 * 4. Contract records: player1 = 0xUEA789... (UEA, not origin!)
 * 5. To check ownership, compare with UEA, not origin
 * 
 * @example
 * const { executorAddress, isLoading, originAddress } = useExecutorAddress()
 * 
 * // Use executorAddress for on-chain comparisons
 * const isWinner = match.winner === executorAddress
 * 
 * // Use originAddress for display only
 * <div>Connected: {originAddress}</div>
 */

import { useEffect, useState } from 'react'
import { usePushWalletContext, usePushChain } from '@pushchain/ui-kit'

interface UseExecutorAddressReturn {
  /** The Universal Executor Account address (use for on-chain comparisons) */
  executorAddress: string | null
  /** Loading state while resolving executor */
  isLoading: boolean
  /** The origin wallet address (CAIP format, use for display) */
  originAddress: string | null
  /** Error if resolution fails */
  error: Error | null
}

export function useExecutorAddress(): UseExecutorAddressReturn {
  const { universalAccount, connectionStatus } = usePushWalletContext()
  const { PushChain } = usePushChain()
  
  const [executorAddress, setExecutorAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const resolveExecutor = async () => {
      // Reset state
      setError(null)
      
      // Not connected
      if (connectionStatus !== 'connected' || !universalAccount) {
        setExecutorAddress(null)
        setIsLoading(false)
        return
      }

      // Push Chain SDK not ready
      if (!PushChain) {
        setExecutorAddress(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        console.log('🔍 Resolving UEA for:', universalAccount)
        
        // Convert origin account to executor (UEA)
        // onlyCompute: true means we just calculate the address without deploying
        const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
          universalAccount,
          { onlyCompute: true }
        )
        
        const ueaAddress = executorInfo.address
        
        console.log('✅ UEA resolved:', {
          origin: universalAccount,
          uea: ueaAddress
        })
        
        setExecutorAddress(ueaAddress)
        setError(null)
      } catch (err) {
        console.error('❌ Failed to resolve executor address:', err)
        setExecutorAddress(null)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    resolveExecutor()
  }, [universalAccount, connectionStatus, PushChain])

  return { 
    executorAddress, 
    isLoading, 
    originAddress: universalAccount,
    error
  }
}

/**
 * Helper function to extract address from CAIP format
 * 
 * @param caipAddress - Address in CAIP format (e.g., "eip155:42101:0x123...")
 * @returns Plain address (e.g., "0x123...")
 */
export function extractAddressFromCAIP(caipAddress: string | null): string | null {
  if (!caipAddress) return null
  
  // CAIP format: "eip155:chainId:address" or "solana:chainId:address"
  const parts = caipAddress.split(':')
  if (parts.length >= 3) {
    return parts[2]
  }
  
  // Already a plain address
  if (caipAddress.startsWith('0x')) {
    return caipAddress
  }
  
  return caipAddress
}

/**
 * Hook variant that returns both UEA and plain origin address
 */
export function useAddresses() {
  const { executorAddress, isLoading, originAddress, error } = useExecutorAddress()
  
  return {
    /** UEA address - use for on-chain comparisons */
    ueaAddress: executorAddress,
    /** Plain origin address (extracted from CAIP) - use for display */
    plainOriginAddress: extractAddressFromCAIP(originAddress),
    /** Raw CAIP origin address */
    caipOriginAddress: originAddress,
    isLoading,
    error
  }
}



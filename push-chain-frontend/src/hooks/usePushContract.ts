/**
 * Push Chain Contract Interaction Hooks
 * 
 * These hooks replace wagmi's useWriteContract with Push Chain SDK's universal transactions.
 * Read operations continue to use wagmi's useReadContract (works on any EVM chain).
 */

import { useState, useCallback } from 'react'
import { useReadContract } from 'wagmi'
import { usePushChainClient, usePushChain } from '@pushchain/ui-kit'
import { PONG_ESCROW_ADDRESS } from '../constants'
import { PONG_ESCROW_ABI } from '../contracts/PongEscrow'

// ============ Types ============

interface TransactionState {
  hash: string | null
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
}

// ============ READ HOOKS (Using wagmi - no changes needed) ============

/**
 * Hook to check if a room code is available
 */
export function useIsRoomCodeAvailable(roomCode: string) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'isRoomCodeAvailable',
    args: [roomCode],
    query: {
      enabled: !!roomCode && roomCode.length === 6,
    },
  })
}

/**
 * Hook to get match details
 */
export function useGetMatch(roomCode: string) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'getMatch',
    args: [roomCode],
    query: {
      enabled: !!roomCode && roomCode.length === 6,
    },
  })
}

/**
 * Hook to get match status
 */
export function useGetMatchStatus(roomCode: string) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'getMatchStatus',
    args: [roomCode],
    query: {
      enabled: !!roomCode && roomCode.length === 6,
    },
  })
}

// ============ WRITE HOOKS (Using Push Chain SDK) ============

/**
 * Hook to stake as player 1 (create match)
 * 
 * @example
 * const { stakeAsPlayer1, isPending, isSuccess, hash, error } = useStakeAsPlayer1()
 * await stakeAsPlayer1('ABC123', '0.01')
 */
export function useStakeAsPlayer1() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState<TransactionState>({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const stakeAsPlayer1 = useCallback(async (roomCode: string, stakeAmount: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not initialized')
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null, isSuccess: false }))

      // Encode function call
      const data = PushChain.utils.helpers.encodeTxData({
        abi: PONG_ESCROW_ABI,
        functionName: 'stakeAsPlayer1',
        args: [roomCode],
      })

      console.log('🎲 Staking as Player 1:', { roomCode, stakeAmount })

      // Send universal transaction
      const txResponse = await pushChainClient.universal.sendTransaction({
        to: PONG_ESCROW_ADDRESS,
        data,
        value: PushChain.utils.helpers.parseUnits(stakeAmount, 18),
      })

      console.log('✅ Transaction sent:', txResponse.hash)

      setState(prev => ({ 
        ...prev, 
        hash: txResponse.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      // Wait for confirmation
      const receipt = await txResponse.wait(1)
      
      console.log('✅ Transaction confirmed:', receipt)

      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      console.error('❌ Error staking as player 1:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false,
        isSuccess: false
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return {
    stakeAsPlayer1,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}

/**
 * Hook to stake as player 2 (join match)
 * 
 * @example
 * const { stakeAsPlayer2, isPending, isSuccess, hash, error } = useStakeAsPlayer2()
 * await stakeAsPlayer2('ABC123', '0.01')
 */
export function useStakeAsPlayer2() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState<TransactionState>({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const stakeAsPlayer2 = useCallback(async (roomCode: string, stakeAmount: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not initialized')
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null, isSuccess: false }))

      const data = PushChain.utils.helpers.encodeTxData({
        abi: PONG_ESCROW_ABI,
        functionName: 'stakeAsPlayer2',
        args: [roomCode],
      })

      console.log('🎲 Staking as Player 2:', { roomCode, stakeAmount })

      const txResponse = await pushChainClient.universal.sendTransaction({
        to: PONG_ESCROW_ADDRESS,
        data,
        value: PushChain.utils.helpers.parseUnits(stakeAmount, 18),
      })

      console.log('✅ Transaction sent:', txResponse.hash)

      setState(prev => ({ 
        ...prev, 
        hash: txResponse.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      const receipt = await txResponse.wait(1)
      
      console.log('✅ Transaction confirmed:', receipt)

      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      console.error('❌ Error staking as player 2:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false,
        isSuccess: false
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return {
    stakeAsPlayer2,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}

/**
 * Hook to claim prize (winner only)
 * 
 * @example
 * const { claimPrize, isPending, isSuccess, hash, error } = useClaimPrize()
 * await claimPrize('ABC123', '0x...')
 */
export function useClaimPrize() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState<TransactionState>({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const claimPrize = useCallback(async (roomCode: string, signature: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not initialized')
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null, isSuccess: false }))

      const data = PushChain.utils.helpers.encodeTxData({
        abi: PONG_ESCROW_ABI,
        functionName: 'claimPrize',
        args: [roomCode, signature],
      })

      console.log('🏆 Claiming prize:', { roomCode })

      const txResponse = await pushChainClient.universal.sendTransaction({
        to: PONG_ESCROW_ADDRESS,
        data,
        value: BigInt(0),
      })

      console.log('✅ Transaction sent:', txResponse.hash)

      setState(prev => ({ 
        ...prev, 
        hash: txResponse.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      const receipt = await txResponse.wait(1)
      
      console.log('✅ Prize claimed:', receipt)

      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      console.error('❌ Error claiming prize:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false,
        isSuccess: false
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return {
    claimPrize,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}

/**
 * Hook to claim refund (if player 2 never joins)
 * 
 * @example
 * const { claimRefund, isPending, isSuccess, hash, error } = useClaimRefund()
 * await claimRefund('ABC123')
 */
export function useClaimRefund() {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()
  
  const [state, setState] = useState<TransactionState>({
    hash: null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  })

  const claimRefund = useCallback(async (roomCode: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not initialized')
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null, isSuccess: false }))

      const data = PushChain.utils.helpers.encodeTxData({
        abi: PONG_ESCROW_ABI,
        functionName: 'claimRefund',
        args: [roomCode],
      })

      console.log('💰 Claiming refund:', { roomCode })

      const txResponse = await pushChainClient.universal.sendTransaction({
        to: PONG_ESCROW_ADDRESS,
        data,
        value: BigInt(0),
      })

      console.log('✅ Transaction sent:', txResponse.hash)

      setState(prev => ({ 
        ...prev, 
        hash: txResponse.hash, 
        isPending: false, 
        isConfirming: true 
      }))

      const receipt = await txResponse.wait(1)
      
      console.log('✅ Refund claimed:', receipt)

      setState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }))

    } catch (error) {
      console.error('❌ Error claiming refund:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isPending: false, 
        isConfirming: false,
        isSuccess: false
      }))
      throw error
    }
  }, [pushChainClient, PushChain])

  return {
    claimRefund,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}



import { useState, useCallback } from 'react'
import { usePushChainClient, usePushChain } from '@pushchain/ui-kit'
import { PONG_POWERUPS_ABI } from '../contracts/PongPowerUps'
import { PONG_POWERUPS_ADDRESS } from '../constants'

interface TransactionState {
  hash: string | null
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
}

interface UsePowerUpResult<TArgs extends unknown[]> extends TransactionState {
  execute: (...args: TArgs) => Promise<string>
}

const initialState: TransactionState = {
  hash: null,
  isPending: false,
  isConfirming: false,
  isSuccess: false,
  error: null,
}

function usePowerUpTransaction<TArgs extends unknown[]>(
  functionName: string,
  argsFormatter: (...args: TArgs) => unknown[]
): UsePowerUpResult<TArgs> {
  const { pushChainClient } = usePushChainClient()
  const { PushChain } = usePushChain()

  const [state, setState] = useState<TransactionState>(initialState)

  const execute = useCallback(
    async (...args: TArgs) => {
      if (!pushChainClient || !PushChain) {
        throw new Error('Push Chain client not initialized')
      }

      try {
        setState(prev => ({
          ...prev,
          isPending: true,
          error: null,
          isSuccess: false,
          hash: null,
        }))

        const formattedArgs = argsFormatter(...args)

        const data = PushChain.utils.helpers.encodeTxData({
          abi: PONG_POWERUPS_ABI,
          functionName,
          args: formattedArgs,
        })

        const txResponse = await pushChainClient.universal.sendTransaction({
          to: PONG_POWERUPS_ADDRESS,
          data,
        })

        setState(prev => ({
          ...prev,
          hash: txResponse.hash,
          isPending: false,
          isConfirming: true,
        }))

        await txResponse.wait(1)

        setState(prev => ({
          ...prev,
          isConfirming: false,
          isSuccess: true,
        }))
        return txResponse.hash
      } catch (error) {
        setState({
          hash: null,
          isPending: false,
          isConfirming: false,
          isSuccess: false,
          error: error as Error,
        })
        throw error
      }
    },
    [PushChain, pushChainClient, functionName, argsFormatter]
  )

  return {
    execute,
    hash: state.hash,
    isPending: state.isPending,
    isConfirming: state.isConfirming,
    isSuccess: state.isSuccess,
    error: state.error,
  }
}

export function useOpenDailyCrate() {
  return usePowerUpTransaction<[string, string]>('openDailyCrate', (nonce, serverSecret) => [
    BigInt(nonce),
    serverSecret as `0x${string}`,
  ])
}

export function useDelegateBoost() {
  return usePowerUpTransaction<[string, number, number, number]>(
    'delegateBoost',
    (renter, tokenId, amount, expiresAt) => [
      renter as `0x${string}`,
      BigInt(tokenId),
      BigInt(amount),
      BigInt(expiresAt),
    ]
  )
}

export function useCancelDelegation() {
  return usePowerUpTransaction<[string, number]>(
    'cancelDelegation',
    (renter, tokenId) => [renter as `0x${string}`, BigInt(tokenId)]
  )
}

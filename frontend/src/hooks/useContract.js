import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { PONG_ESCROW_ADDRESS, PONG_ESCROW_ABI } from '../contracts/PongEscrow';

// Hook to check if room code is available
export function useIsRoomCodeAvailable(roomCode) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'isRoomCodeAvailable',
    args: [roomCode],
    enabled: !!roomCode && roomCode.length === 6,
  });
}

// Hook to get match details
export function useGetMatch(roomCode) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'getMatch',
    args: [roomCode],
    enabled: !!roomCode && roomCode.length === 6,
  });
}

// Hook to get match status
export function useGetMatchStatus(roomCode) {
  return useReadContract({
    address: PONG_ESCROW_ADDRESS,
    abi: PONG_ESCROW_ABI,
    functionName: 'getMatchStatus',
    args: [roomCode],
    enabled: !!roomCode && roomCode.length === 6,
  });
}

// Hook to stake as player 1 (create match)
export function useStakeAsPlayer1() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stakeAsPlayer1 = async (roomCode, stakeAmount) => {
    try {
      await writeContract({
        address: PONG_ESCROW_ADDRESS,
        abi: PONG_ESCROW_ABI,
        functionName: 'stakeAsPlayer1',
        args: [roomCode],
        value: parseEther(stakeAmount),
      });
    } catch (err) {
      console.error('Error staking as player 1:', err);
      throw err;
    }
  };

  return {
    stakeAsPlayer1,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to stake as player 2 (join match)
export function useStakeAsPlayer2() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stakeAsPlayer2 = async (roomCode, stakeAmount) => {
    try {
      await writeContract({
        address: PONG_ESCROW_ADDRESS,
        abi: PONG_ESCROW_ABI,
        functionName: 'stakeAsPlayer2',
        args: [roomCode],
        value: parseEther(stakeAmount),
      });
    } catch (err) {
      console.error('Error staking as player 2:', err);
      throw err;
    }
  };

  return {
    stakeAsPlayer2,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to claim prize
export function useClaimPrize() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPrize = async (roomCode, signature) => {
    try {
      await writeContract({
        address: PONG_ESCROW_ADDRESS,
        abi: PONG_ESCROW_ABI,
        functionName: 'claimPrize',
        args: [roomCode, signature],
      });
    } catch (err) {
      console.error('Error claiming prize:', err);
      throw err;
    }
  };

  return {
    claimPrize,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to claim refund
export function useClaimRefund() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRefund = async (roomCode) => {
    try {
      await writeContract({
        address: PONG_ESCROW_ADDRESS,
        abi: PONG_ESCROW_ABI,
        functionName: 'claimRefund',
        args: [roomCode],
      });
    } catch (err) {
      console.error('Error claiming refund:', err);
      throw err;
    }
  };

  return {
    claimRefund,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

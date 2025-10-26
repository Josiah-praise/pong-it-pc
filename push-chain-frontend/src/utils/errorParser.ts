/**
 * Parse blockchain/contract errors into user-friendly messages
 */

export interface ParsedError {
  title: string;
  message: string;
  isUserAction: boolean; // true if user can retry
}

export function parseTransactionError(error: any): ParsedError {
  if (!error) {
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred. Please try again.',
      isUserAction: true
    };
  }

  const errorString = error.message || error.toString();
  const errorData = error.data?.message || '';
  const lowerError = errorString.toLowerCase() + ' ' + errorData.toLowerCase();

  // User rejected transaction
  if (
    lowerError.includes('user rejected') ||
    lowerError.includes('user denied') ||
    lowerError.includes('user cancelled') ||
    error.name === 'UserRejectedRequestError'
  ) {
    return {
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction. Click "Retry" when you\'re ready to proceed.',
      isUserAction: true
    };
  }

  // Insufficient funds
  if (
    lowerError.includes('insufficient funds') ||
    lowerError.includes('insufficient balance')
  ) {
    return {
      title: 'Insufficient Funds',
      message: 'You don\'t have enough PC tokens in your wallet to complete this transaction. Please add funds and try again.',
      isUserAction: true
    };
  }

  // Contract-specific errors
  if (lowerError.includes('cannot join own match') || lowerError.includes('owner cannot join')) {
    return {
      title: 'Cannot Join Own Game',
      message: 'You cannot join a game that you created. Please create a new game or join a different one.',
      isUserAction: false
    };
  }

  if (lowerError.includes('room not available') || lowerError.includes('room does not exist')) {
    return {
      title: 'Game Not Found',
      message: 'This game room does not exist or has already started. Please check the room code and try again.',
      isUserAction: false
    };
  }

  if (lowerError.includes('already joined') || lowerError.includes('room full')) {
    return {
      title: 'Game Already Full',
      message: 'This game already has two players. Please join a different game or create your own.',
      isUserAction: false
    };
  }

  if (lowerError.includes('incorrect stake amount') || lowerError.includes('invalid amount')) {
    return {
      title: 'Incorrect Stake Amount',
      message: 'The stake amount doesn\'t match the game requirements. Please check the required amount.',
      isUserAction: false
    };
  }

  if (lowerError.includes('game already started')) {
    return {
      title: 'Game Already Started',
      message: 'This game has already begun. You cannot join a game in progress.',
      isUserAction: false
    };
  }

  if (lowerError.includes('already claimed') || lowerError.includes('prize claimed')) {
    return {
      title: 'Already Claimed',
      message: 'This prize has already been claimed. Please refresh the page to see updated prizes.',
      isUserAction: false
    };
  }

  if (lowerError.includes('delegationinsufficient')) {
    return {
      title: 'Nothing To Reclaim',
      message: 'This rental has already been fully used or cancelled on-chain. Refresh to update your rentals.',
      isUserAction: false
    };
  }

  if (lowerError.includes('delegationexpired')) {
    return {
      title: 'Rental Expired',
      message: 'This rental already expired. Refresh the page to update your inventory.',
      isUserAction: false
    };
  }

  if (lowerError.includes('invalid expiry')) {
    return {
      title: 'Rental Still Active',
      message: 'This rental period is still active. Try again after the expiry time.',
      isUserAction: false
    };
  }

  // Network errors
  if (lowerError.includes('network error') || lowerError.includes('connection failed')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the blockchain. Please check your internet connection and try again.',
      isUserAction: true
    };
  }

  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return {
      title: 'Transaction Timeout',
      message: 'The transaction took too long to process. Please try again.',
      isUserAction: true
    };
  }

  // Gas estimation errors
  if (lowerError.includes('gas required exceeds') || lowerError.includes('out of gas')) {
    return {
      title: 'Gas Estimation Failed',
      message: 'The transaction requires more gas than available. This usually means the transaction would fail. Please check your wallet balance.',
      isUserAction: true
    };
  }

  if (lowerError.includes('execution reverted')) {
    // Try to extract custom error message
    const revertMatch = errorString.match(/reverted with reason string '([^']+)'/);
    if (revertMatch) {
      return {
        title: 'Transaction Reverted',
        message: revertMatch[1],
        isUserAction: false
      };
    }

    return {
      title: 'Transaction Failed',
      message: 'The transaction was rejected by the smart contract. This could be due to game rules or invalid state.',
      isUserAction: false
    };
  }

  // Nonce errors
  if (lowerError.includes('nonce too low') || lowerError.includes('nonce too high')) {
    return {
      title: 'Transaction Order Issue',
      message: 'There was a problem with the transaction order. Please refresh the page and try again.',
      isUserAction: true
    };
  }

  // Generic fallback
  return {
    title: 'Transaction Failed',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    isUserAction: true
  };
}

/**
 * Extract short error hint for inline display
 */
export function getErrorHint(error: any): string {
  const parsed = parseTransactionError(error);
  return parsed.message;
}

import { useState, useEffect, useCallback, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePushWalletContext, usePushChainClient } from '@pushchain/ui-kit';
import { useClaimPrize } from '../hooks/usePushContract';
import { useExecutorAddress } from '../hooks/useExecutorAddress';
import { formatEther } from 'viem';
import { BACKEND_URL, PUSH_CHAIN_TESTNET_EXPLORER } from '../constants';
import '../styles/MyWins.css';
import { parseTransactionError } from '../utils/errorParser';
import AddressDisplay from './AddressDisplay';

interface Game {
  _id: string
  roomCode: string
  stakeAmount: string
  score?: {
    player1: number
    player2: number
  }
  endedAt?: string
  claimed: boolean
  claimTxHash?: string
  winnerSignature?: string
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const MyWins: FC = () => {
  const navigate = useNavigate();
  
  // Push Chain wallet context
  const { connectionStatus } = usePushWalletContext();
  const { pushChainClient } = usePushChainClient();
  const isConnected = connectionStatus === 'connected';
  
  // Get the user's account address from Push Chain client
  const originAddress = pushChainClient?.universal?.account?.toLowerCase() || null;
  
  // CRITICAL: Get the Universal Executor Account (UEA) address
  // The contract sees UEA as msg.sender, not the origin address
  const { executorAddress, isLoading: isLoadingUEA } = useExecutorAddress();
  
  const [wins, setWins] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingGameId, setClaimingGameId] = useState<string | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ 
    total: 0, 
    limit: 20, 
    offset: 0, 
    hasMore: false 
  });

  const {
    claimPrize,
    hash: claimTxHash,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
    isSuccess: isClaimSuccess,
    error: claimError
  } = useClaimPrize();

  // Fetch user's wins - CRITICAL: Use UEA address for filtering
  const fetchWins = useCallback(async () => {
    // CRITICAL: Must use executorAddress (UEA) for filtering wins
    // because the contract stores the UEA as the winner, not the origin address
    if (!executorAddress) {
      console.log('⏳ Waiting for executor address (UEA) to be resolved...');
      return;
    }

    console.log('🔍 Fetching wins for UEA:', executorAddress);
    console.log('📝 Origin address:', originAddress);

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        address: executorAddress, // CRITICAL: Use UEA, not origin address!
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });

      const response = await fetch(`${BACKEND_URL}/games/my-wins?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch wins: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Fetched wins:', data);
      setWins(data.games);
      setPagination(data.pagination);
    } catch (err) {
      console.error('❌ Error fetching wins:', err);
      setError('Failed to load your wins. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [executorAddress, originAddress, pagination.limit, pagination.offset]);

  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  useEffect(() => {
    if (isConnected && executorAddress && !isLoadingUEA) {
      fetchWins();
    } else {
      setLoading(false);
    }
  }, [isConnected, executorAddress, isLoadingUEA, fetchWins]);

  // Handle claim success
  useEffect(() => {
    if (isClaimSuccess && claimTxHash && claimingGameId) {
      console.log('✅ Prize claimed successfully!');

      // Mark game as claimed in database
      fetch(`${BACKEND_URL}/games/${claimingGameId}/claimed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: claimTxHash })
      })
        .then(res => res.json())
        .then(data => {
          console.log('Game marked as claimed:', data);
          // Refresh wins list
          fetchWins();
        })
        .catch(err => {
          console.error('Failed to mark game as claimed:', err);
        });

      setClaimingGameId(null);
    }
  }, [isClaimSuccess, claimTxHash, claimingGameId, fetchWins]);

  // Handle claim error
  useEffect(() => {
    if (claimError) {
      console.error('Claim error:', claimError);
      const parsedError = parseTransactionError(claimError);
      setClaimErrorMessage(parsedError.message);
      setClaimingGameId(null);
    }
  }, [claimError]);

  const handleClaimPrize = async (game: Game) => {
    if (!game.winnerSignature) {
      setClaimErrorMessage('Signature not available yet. Please try again later.');
      setClaimingGameId(game._id);
      return;
    }

    console.log('🎁 Claiming prize for room:', game.roomCode);
    setClaimingGameId(game._id);
    setClaimErrorMessage(null);

    try {
      await claimPrize(game.roomCode, game.winnerSignature);
    } catch (error) {
      console.error('Error initiating claim:', error);
      setClaimingGameId(null);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatPrizeAmount = (stakeAmount: string): string => {
    const prizeValue = parseFloat(stakeAmount) * 2;
    if (isNaN(prizeValue)) return '0';
    
    // Format to 4 significant figures
    return parseFloat(prizeValue.toPrecision(4)).toString();
  };

  if (!isConnected) {
    return (
      <div className="my-wins-container">
        <div className="my-wins-header">
          <button onClick={() => navigate('/')} className="back-button">← Back</button>
          <h1>My Wins</h1>
        </div>
        <div className="connect-wallet-prompt">
          <p>Please connect your wallet to view your wins</p>
        </div>
      </div>
    );
  }

  // Show loading while UEA is being resolved
  if (isLoadingUEA || !executorAddress) {
    return (
      <div className="my-wins-container">
        <div className="my-wins-header">
          <button onClick={() => navigate('/')} className="back-button">← Back</button>
          <h1>My Wins</h1>
        </div>
        <div className="loading">Resolving your Universal Executor Account...</div>
      </div>
    );
  }

  return (
    <div className="my-wins-container">
      <AddressDisplay />
      <div className="my-wins-header">
        <button onClick={() => navigate('/')} className="back-button">← Back</button>
        <h1>My Wins</h1>
      </div>

      {/* Transaction Progress Modal */}
      {claimingGameId && (
        <div className="transaction-overlay">
          <div className="transaction-modal">
            {claimErrorMessage ? (
              <>
                <h3 style={{ color: '#ff6b6b', marginBottom: '20px' }}>Transaction Failed</h3>
                <div style={{
                  background: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid #ff6b6b',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px',
                  color: '#ff6b6b',
                  fontSize: '0.9rem'
                }}>
                  {claimErrorMessage}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      const game = wins.find(w => w._id === claimingGameId);
                      if (game) {
                        handleClaimPrize(game);
                      }
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'rgb(116,113,203)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontFamily: 'Press Start 2P, monospace',
                      fontSize: '0.8rem'
                    }}
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      setClaimingGameId(null);
                      setClaimErrorMessage(null);
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontFamily: 'Press Start 2P, monospace',
                      fontSize: '0.8rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>
                  {isClaimPending && 'Confirm Transaction in Wallet...'}
                  {isClaimConfirming && 'Claiming Prize...'}
                </h3>
                <div className="transaction-spinner"></div>
                <p>
                  {isClaimPending && 'Please confirm the transaction in your wallet'}
                  {isClaimConfirming && 'Waiting for blockchain confirmation'}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="wins-content">
        {loading && pagination.offset === 0 ? (
          <div className="loading">Loading your wins...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : wins.length === 0 ? (
          <div className="no-wins">
            <p>No wins yet!</p>
            <p>Play some staked matches to win prizes</p>
            <button onClick={() => navigate('/')} className="play-button">
              Play Now
            </button>
          </div>
        ) : (
          <>
            <div className="wins-list">
              {wins.map((game) => (
                <div key={game._id} className={`win-card ${game.claimed ? 'claimed' : 'claimable'}`}>
                  <div className="win-header">
                    <span className="room-code">Room: {game.roomCode}</span>
                    <span className={`status-badge ${game.claimed ? 'claimed' : 'unclaimed'}`}>
                      {game.claimed ? '✅ Claimed' : '💎 Claimable'}
                    </span>
                  </div>

                  <div className="win-details">
                    <div className="detail-row">
                      <span className="detail-label">Prize Amount:</span>
                      <span className="detail-value prize-amount">
                        {formatPrizeAmount(game.stakeAmount)} PC
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Stake Amount:</span>
                      <span className="detail-value">
                        {game.stakeAmount} PC
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Final Score:</span>
                      <span className="detail-value">
                        {game.score && game.score.player1 !== undefined && game.score.player2 !== undefined
                          ? `${game.score.player1} - ${game.score.player2}`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Won At:</span>
                      <span className="detail-value">
                        {formatDate(game.endedAt)}
                      </span>
                    </div>

                    {game.claimed && game.claimTxHash && (
                      <div className="detail-row">
                        <span className="detail-label">Claim Tx:</span>
                        <span className="detail-value tx-hash">
                          <a
                            href={`${PUSH_CHAIN_TESTNET_EXPLORER}/tx/${game.claimTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {game.claimTxHash.slice(0, 10)}...{game.claimTxHash.slice(-8)}
                          </a>
                        </span>
                      </div>
                    )}
                  </div>

                  {!game.claimed && (
                    <button
                      onClick={() => handleClaimPrize(game)}
                      className="claim-button"
                      disabled={claimingGameId === game._id || !game.winnerSignature}
                    >
                      {!game.winnerSignature ? 'Signature Pending...' : 'Claim Prize'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pagination.hasMore && (
              <div className="load-more-section">
                <button
                  onClick={loadMore}
                  className="load-more-button"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
                <p className="pagination-info">
                  Showing {Math.min(pagination.offset + wins.length, pagination.total)} of {pagination.total} wins
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyWins;

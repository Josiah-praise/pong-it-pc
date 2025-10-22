import { useState, useEffect, useCallback, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePushWalletContext } from '@pushchain/ui-kit';
import { usePushChainClient } from '@pushchain/ui-kit';
import { useClaimRefundForAbandoned } from '../hooks/usePushContract';
import { formatEther } from 'viem';
import { BACKEND_URL, PUSH_CHAIN_TESTNET_EXPLORER } from '../constants';
import { parseTransactionError } from '../utils/errorParser';
import '../styles/UnclaimedStakes.css';

interface AbandonedStake {
  _id: string;
  roomCode: string;
  player1: {
    name: string;
    rating: number;
  };
  stakeAmount: string;
  refundSignature: string;
  createdAt: string;
  canRefund: boolean;
  refundClaimed: boolean;
}

const UnclaimedStakes: FC = () => {
  const navigate = useNavigate();
  const { connectionStatus } = usePushWalletContext();
  const { pushChainClient } = usePushChainClient();
  const isConnected = connectionStatus === 'connected';
  const address = pushChainClient?.universal?.account?.toLowerCase() || null;

  const [stakes, setStakes] = useState<AbandonedStake[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimingGameId, setClaimingGameId] = useState<string | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);

  const {
    claimRefundForAbandoned,
    isPending: isClaimPending,
    isSuccess: isClaimSuccess,
    hash: claimHash,
    error: claimError,
  } = useClaimRefundForAbandoned();

  // Fetch abandoned stakes
  const fetchAbandonedStakes = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/games/abandoned-stakes/${address}?limit=50`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch abandoned stakes');
      }

      const data = await response.json();
      setStakes(data.games);
    } catch (error) {
      console.error('Error fetching abandoned stakes:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchAbandonedStakes();
    }
  }, [isConnected, address, fetchAbandonedStakes]);

  // Handle claim success
  useEffect(() => {
    if (isClaimSuccess && claimHash && claimingGameId) {
      const markRefundAsClaimed = async () => {
        try {
          await fetch(`${BACKEND_URL}/games/${claimingGameId}/refund-claimed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash: claimHash }),
          });

          // Refresh the list
          fetchAbandonedStakes();
          setClaimingGameId(null);
        } catch (error) {
          console.error('Error updating refund status:', error);
        }
      };

      markRefundAsClaimed();
    }
  }, [isClaimSuccess, claimHash, claimingGameId, fetchAbandonedStakes]);

  // Handle claim error
  useEffect(() => {
    if (claimError) {
      console.error('Claim refund error:', claimError);
      const parsedError = parseTransactionError(claimError);
      setClaimErrorMessage(parsedError.message);
      setClaimingGameId(null);
    }
  }, [claimError]);

  const handleClaimRefund = async (stake: AbandonedStake) => {
    setClaimErrorMessage(null);
    setClaimingGameId(stake._id);

    try {
      await claimRefundForAbandoned(stake.roomCode, stake.refundSignature);
    } catch (error) {
      console.error('Error claiming refund:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="unclaimed-stakes-container">
        <div className="unclaimed-stakes-content">
          <div className="error-state">
            <h2>🔌 Wallet Not Connected</h2>
            <p>Please connect your wallet to view unclaimed stakes</p>
            <button onClick={() => navigate('/')} className="btn-back">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="unclaimed-stakes-container">
      <div className="unclaimed-stakes-content">
        <div className="header">
          <button onClick={() => navigate('/')} className="btn-back">
            ← Back
          </button>
          <h1>💰 Unclaimed Stakes</h1>
          <p className="subtitle">
            Recover your stakes from abandoned games
          </p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading abandoned stakes...</p>
          </div>
        ) : stakes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h2>All Clear!</h2>
            <p>You have no unclaimed stakes</p>
            <p className="empty-hint">
              Stakes appear here when you create a staked game but leave before anyone joins.
            </p>
          </div>
        ) : (
          <>
            <div className="stakes-count">
              <span className="count-badge">{stakes.length}</span>
              <span>Unclaimed Stake{stakes.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="stakes-list">
              {stakes.map((stake) => (
                <div key={stake._id} className="stake-card">
                  <div className="stake-header">
                    <div className="stake-info">
                      <div className="room-code">
                        Room: <span className="code-value">{stake.roomCode}</span>
                      </div>
                      <div className="stake-date">
                        {new Date(stake.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="stake-amount">
                      {formatEther(BigInt(Math.floor(parseFloat(stake.stakeAmount) * 1e18)))} PC
                    </div>
                  </div>

                  <div className="stake-status">
                    <span className="status-badge abandoned">Abandoned</span>
                    <span className="status-text">No one joined</span>
                  </div>

                  {claimErrorMessage && claimingGameId === stake._id && (
                    <div className="error-message">
                      <span className="error-icon">⚠️</span>
                      {claimErrorMessage}
                    </div>
                  )}

                  <button
                    className="btn-claim"
                    onClick={() => handleClaimRefund(stake)}
                    disabled={isClaimPending && claimingGameId === stake._id}
                  >
                    {claimingGameId === stake._id && isClaimPending ? (
                      <>
                        <div className="btn-spinner"></div>
                        Claiming...
                      </>
                    ) : (
                      <>
                        💸 Claim Refund
                      </>
                    )}
                  </button>

                  {claimingGameId === stake._id && claimHash && (
                    <div className="tx-link">
                      <a
                        href={`${PUSH_CHAIN_TESTNET_EXPLORER}/tx/${claimHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View transaction →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Transaction overlay */}
      {isClaimPending && (
        <div className="transaction-overlay">
          <div className="transaction-modal">
            <div className="spinner-large"></div>
            <h3>Processing Refund...</h3>
            <p>Please confirm the transaction in your wallet</p>
            {claimHash && (
              <a
                href={`${PUSH_CHAIN_TESTNET_EXPLORER}/tx/${claimHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link-overlay"
              >
                View on Explorer →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnclaimedStakes;


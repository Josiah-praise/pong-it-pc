import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useClaimPrize } from '../hooks/useContract';
import { formatEther } from 'viem';
import '../styles/MyWins.css';

const PLAYER_SERVICE_URL = process.env.REACT_APP_PLAYER_SERVICE_URL || 'http://localhost:5001';

const MyWins = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingGameId, setClaimingGameId] = useState(null);

  const {
    claimPrize,
    hash: claimTxHash,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
    isSuccess: isClaimSuccess,
    error: claimError
  } = useClaimPrize();

  // Fetch user's wins
  const fetchWins = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${PLAYER_SERVICE_URL}/games/my-wins?address=${address}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch wins: ${response.status}`);
      }

      const data = await response.json();
      setWins(data);
    } catch (err) {
      console.error('Error fetching wins:', err);
      setError('Failed to load your wins. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchWins();
    } else {
      setLoading(false);
    }
  }, [isConnected, address, fetchWins]);

  // Handle claim success
  useEffect(() => {
    if (isClaimSuccess && claimTxHash && claimingGameId) {
      console.log('✅ Prize claimed successfully!');

      // Mark game as claimed in database
      fetch(`${PLAYER_SERVICE_URL}/games/${claimingGameId}/claimed`, {
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
      setClaimingGameId(null);
      alert(`Failed to claim prize: ${claimError.message || 'Unknown error'}`);
    }
  }, [claimError]);

  const handleClaimPrize = async (game) => {
    if (!game.winnerSignature) {
      alert('Signature not available yet. Please try again later.');
      return;
    }

    console.log('🎁 Claiming prize for room:', game.roomCode);
    setClaimingGameId(game._id);

    try {
      await claimPrize(game.roomCode, game.winnerSignature);
    } catch (error) {
      console.error('Error initiating claim:', error);
      setClaimingGameId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

  return (
    <div className="my-wins-container">
      <div className="my-wins-header">
        <button onClick={() => navigate('/')} className="back-button">← Back</button>
        <h1>My Wins</h1>
        <p className="wallet-address">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>

      {/* Transaction Progress Modal */}
      {claimingGameId && (
        <div className="transaction-overlay">
          <div className="transaction-modal">
            <h3>
              {isClaimPending && 'Confirm Transaction in Wallet...'}
              {isClaimConfirming && 'Claiming Prize...'}
            </h3>
            <div className="transaction-spinner"></div>
            <p>
              {isClaimPending && 'Please confirm the transaction in your wallet'}
              {isClaimConfirming && 'Waiting for blockchain confirmation'}
            </p>
          </div>
        </div>
      )}

      <div className="wins-content">
        {loading ? (
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
                      {game.stakeAmount} ETH
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
                          href={`https://sepolia-blockscout.lisk.com/tx/${game.claimTxHash}`}
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
        )}
      </div>
    </div>
  );
};

export default MyWins;

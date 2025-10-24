import { useRef, useState, useEffect, useCallback, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePushWalletContext, PushUniversalAccountButton, usePushChainClient } from '@pushchain/ui-kit';
import io, { Socket } from 'socket.io-client';
import '../styles/Welcome.css';
import { BACKEND_URL, STAKE_AMOUNTS } from '../constants';
import soundManager from '../utils/soundManager';
import { useStakeAsPlayer1 } from '../hooks/usePushContract';
import { parseTransactionError } from '../utils/errorParser';
import { useDialog } from '../hooks/useDialog';
import Dialog from './Dialog';
import { type Player as AuthPlayer } from '../services/authService';

interface WelcomeProps {
  setGameState: (state: any) => void
  savedUsername: string | null
  onUsernameSet: (username: string, walletAddress?: string) => void
  authenticatedPlayer: AuthPlayer | null
  isAuthenticating: boolean
  walletAddress: string | null
}

interface Ranking {
  name: string
  rating: number
  wins?: number
  losses?: number
}

interface ActiveGame {
  roomCode: string
  players: string[]
  status: string
  spectatorCount: number
}

const Welcome: FC<WelcomeProps> = ({ setGameState, savedUsername, onUsernameSet, authenticatedPlayer, isAuthenticating, walletAddress }) => {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [showTitle, setShowTitle] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [stakingInProgress, setStakingInProgress] = useState(false);
  const [selectedStakeAmount, setSelectedStakeAmount] = useState<string | null>(null);
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);
  const [stakingErrorMessage, setStakingErrorMessage] = useState<string | null>(null);
  const [unclaimedStakesCount, setUnclaimedStakesCount] = useState<number>(0);
  const titleRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  // Push Chain wallet context
  const { connectionStatus } = usePushWalletContext();
  const { pushChainClient } = usePushChainClient();
  const isConnected = connectionStatus === 'connected';
  const isWalletReady = isConnected && !!pushChainClient?.universal?.account;
  
  // Get the user's account address from Push Chain client
  const address = pushChainClient?.universal?.account?.toLowerCase() || null;

  // Dialog hook
  const { dialogState, showAlert, handleConfirm, handleCancel } = useDialog();

  // Push Chain staking hook
  const {
    stakeAsPlayer1,
    hash: stakingTxHash,
    isPending: isStakingPending,
    isConfirming: isStakingConfirming,
    isSuccess: isStakingSuccess,
    error: stakingError
  } = useStakeAsPlayer1();

  // Fetch unclaimed stakes count when wallet is connected
  useEffect(() => {
    const fetchUnclaimedStakesCount = async () => {
      if (!address || !isConnected) {
        setUnclaimedStakesCount(0);
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/games/abandoned-stakes/${address}?limit=100`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch unclaimed stakes');
        }

        const data = await response.json();
        setUnclaimedStakesCount(data.pagination.total);
      } catch (error) {
        setUnclaimedStakesCount(0);
      }
    };

    fetchUnclaimedStakesCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnclaimedStakesCount, 30000);
    return () => clearInterval(interval);
  }, [address, isConnected]);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/rankings/top?limit=10`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setRankings(data);
      } catch (error) {
        setRankings([]);
      }
    };

    fetchRankings();

    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('getActiveGames');
    });

    socket.on('rankingsUpdate', (newRankings: Ranking[]) => {
      setRankings(newRankings);
    });

    socket.on('activeGamesList', (games: ActiveGame[]) => {
      setActiveGames(games);
    });

    const gamesInterval = setInterval(() => {
      socket.emit('getActiveGames');
    }, 3000);

    return () => {
      clearInterval(gamesInterval);
      socket.disconnect();
    };
  }, []);

  // Add handler to start audio after user interaction
  const handleStartAudio = useCallback(() => {
    if (!audioStarted) {
      setShowTitle(true);
      soundManager.playWithErrorHandling(
        () => soundManager.playIntroSound(),
        'Intro sound failed to play'
      );
      setAudioStarted(true);
    }
  }, [audioStarted]);

  // Add effect for title animation and sound
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTitle(true);
    }, 100);

    if (!audioStarted) {
      document.addEventListener('click', handleStartAudio, { once: true });
      document.addEventListener('touchstart', handleStartAudio, { once: true });
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleStartAudio);
      document.removeEventListener('touchstart', handleStartAudio);
    };
  }, [audioStarted, handleStartAudio]);

  // Handle successful staking transaction
  useEffect(() => {

    if (isStakingSuccess && pendingRoomCode && stakingTxHash) {

      // Notify backend about the staked match
      fetch(`${BACKEND_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: pendingRoomCode,
          player1: { name: savedUsername, rating: 800 },
          isStaked: true,
          stakeAmount: selectedStakeAmount,
          player1Address: address,
          player1TxHash: stakingTxHash,
          status: 'waiting'
        })
      })
        .then(res => res.json())
        .then(data => {
        })
        .catch(err => {
        });

      setStakingInProgress(false);
      setGameState((prev: any) => ({
        ...prev,
        player1: { name: savedUsername, rating: 800 },
        gameMode: 'create-staked',
        roomCode: pendingRoomCode,
        stakeAmount: selectedStakeAmount,
        player1Address: address,
        player1TxHash: stakingTxHash
      }));

      navigate('/game', {
        state: {
          gameMode: 'create-staked',
          roomCode: pendingRoomCode,
          stakeAmount: selectedStakeAmount,
          player1Address: address,
          player1TxHash: stakingTxHash
        }
      });

      setPendingRoomCode(null);
      setSelectedStakeAmount(null);
    }
  }, [isStakingSuccess, pendingRoomCode, stakingTxHash, selectedStakeAmount, savedUsername, address, navigate, setGameState]);

  // Handle staking errors
  useEffect(() => {
    if (stakingError) {
      const parsedError = parseTransactionError(stakingError);
      setStakingErrorMessage(parsedError.message);
      setStakingInProgress(false);
    }
  }, [stakingError]);

  const promptUsername = (callback: (username: string) => void) => {
    // If user is authenticated, use their player data
    if (authenticatedPlayer) {
      callback(authenticatedPlayer.name);
      return;
    }

    // If not authenticated but wallet is connected, prompt for username
    if (!walletAddress) {
      showAlert('Please connect your wallet first.', 'Wallet Required');
      return;
    }

    const modal = document.createElement('dialog');
    modal.innerHTML = `
      <form method="dialog">
        <h2>Welcome! Create Your Profile</h2>
        <p style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem;">
          This is your first time connecting this wallet.<br/>
          Choose a unique username to get started.
        </p>
        <input type="text" id="username" value="" required minlength="2" maxlength="15" placeholder="Your unique username" autocomplete="off">
        <p id="error-message" style="color: #ff4444; font-size: 0.85rem; margin-top: 0.5rem; display: none;"></p>
        <div class="buttons">
          <button type="submit" id="submit-btn">Create Profile</button>
        </div>
      </form>
    `;

    document.body.appendChild(modal);
    modal.showModal();

    // Clear and focus the input
    const input = document.getElementById('username') as HTMLInputElement;
    const errorMsg = document.getElementById('error-message') as HTMLElement;
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    
    if (input) {
      input.value = '';
      input.focus();
    }

    const form = modal.querySelector('form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const username = input.value.trim();
        
        if (!username || !walletAddress) return;

        // Disable submit button during request
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        errorMsg.style.display = 'none';

        try {
          // Call onUsernameSet with wallet address
          await onUsernameSet(username, walletAddress);
          callback(username);
          modal.remove();
        } catch (error: any) {
          // Handle username taken error
          if (error.message === 'USERNAME_TAKEN') {
            errorMsg.textContent = `Username "${username}" is already taken. Please choose another.`;
            errorMsg.style.display = 'block';
            input.value = '';
            input.focus();
          } else {
            errorMsg.textContent = 'Failed to create profile. Please try again.';
            errorMsg.style.display = 'block';
          }
          
          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Profile';
        }
      };
    }
  };

  const handleStartGame = () => {
    if (!isWalletReady) {
      showAlert('Please connect your wallet to start a match.', 'Wallet Not Connected');
      return;
    }
    promptUsername((username) => {
      setGameState((prev: any) => ({
        ...prev,
        player1: { 
          name: username, 
          rating: authenticatedPlayer?.rating || 1000 
        },
        gameMode: 'quick'
      }));
      navigate('/game', { state: { gameMode: 'quick' } });
    });
  };

  const handleCreateRoom = () => {
    if (!isWalletReady) {
      showAlert('Please connect your wallet to create a room.', 'Wallet Not Connected');
      return;
    }
    promptUsername((username) => {
      setGameState((prev: any) => ({
        ...prev,
        player1: { 
          name: username, 
          rating: authenticatedPlayer?.rating || 1000 
        },
        gameMode: 'create'
      }));
      navigate('/game', { state: { gameMode: 'create' } });
    });
  };

  const handleJoinRoom = () => {
    if (!isWalletReady) {
      showAlert('Please connect your wallet to join a room.', 'Wallet Not Connected');
      return;
    }
    promptUsername((username) => {
      const modal = document.createElement('dialog');
      modal.innerHTML = `
        <form method="dialog">
          <h2>Enter Room Code</h2>
          <input type="text" id="roomCode" value="" required minlength="6" maxlength="6" placeholder="ABC123" style="text-transform: uppercase;" autocomplete="off">
          <div class="buttons">
            <button type="submit">Join Room</button>
            <button type="button" id="cancel-btn">Cancel</button>
          </div>
        </form>
      `;

      document.body.appendChild(modal);
      modal.showModal();

      // Clear and focus the input
      const input = document.getElementById('roomCode') as HTMLInputElement;
      if (input) {
        input.value = '';
        input.focus();
      }

      const cancelBtn = document.getElementById('cancel-btn');
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          modal.close();
          modal.remove();
        };
      }

      const form = modal.querySelector('form');
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          const input = document.getElementById('roomCode') as HTMLInputElement;
          const roomCode = input.value.toUpperCase();
          setGameState((prev: any) => ({
            ...prev,
            player1: { 
              name: username, 
              rating: authenticatedPlayer?.rating || 1000 
            },
            gameMode: 'join',
            roomCode
          }));
          navigate('/game', { state: { gameMode: 'join', roomCode } });
          modal.remove();
        };
      }
    });
  };

  const handleSpectateGame = (roomCode: string) => {
    promptUsername((username) => {
      navigate('/spectate', { state: { roomCode, spectatorName: username } });
    });
  };

  const handleCreateStakedMatch = () => {
    if (!isWalletReady) {
      showAlert('Please connect your wallet to create a staked match', 'Wallet Not Connected');
      return;
    }
    promptUsername((username) => {
      const modal = document.createElement('dialog');
      modal.className = 'stake-modal';
      modal.innerHTML = `
        <form method="dialog">
          <h2>Select Stake Amount</h2>
          <p style="margin-bottom: 20px; color: #888;">Choose how much PC (Push Chain tokens) you want to stake</p>
          <div class="stake-options">
            ${STAKE_AMOUNTS.map(({ value, label }) => `
              <button type="button" class="stake-option" data-amount="${value}">
                ${label.replace('ETH', 'PC')}
              </button>
            `).join('')}
          </div>
          <div style="margin: 20px 0; padding: 15px; background: rgba(116,113,203,0.1); border-radius: 8px;">
            <label style="display: block; margin-bottom: 10px; color: #888; font-size: 0.9rem;">
              Or enter custom amount (min 0.001 PC):
            </label>
            <input
              type="number"
              id="custom-stake-input"
              placeholder="0.001"
              step="0.001"
              min="0.001"
              style="
                width: 100%;
                padding: 10px;
                background: #1a1a1a;
                border: 1px solid rgb(116,113,203);
                border-radius: 5px;
                color: #fff;
                font-size: 1rem;
              "
            />
            <div id="custom-amount-error" style="
              display: none;
              margin-top: 8px;
              padding: 8px;
              background: rgba(255, 107, 107, 0.1);
              border: 1px solid #ff6b6b;
              border-radius: 5px;
              color: #ff6b6b;
              font-size: 0.75rem;
            "></div>
            <button
              type="button"
              id="use-custom-amount-btn"
              style="
                width: 100%;
                margin-top: 10px;
                padding: 10px;
                background: rgb(116,113,203);
                color: #000;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                fontFamily: 'Press Start 2P', monospace;
                font-size: 0.8rem;
              "
            >
              Use Custom Amount
            </button>
          </div>
          <div class="buttons" style="margin-top: 20px;">
            <button type="button" id="cancel-stake-btn">Cancel</button>
          </div>
        </form>
      `;

      document.body.appendChild(modal);
      modal.showModal();

      const cancelStakeBtn = modal.querySelector('#cancel-stake-btn') as HTMLButtonElement;
      if (cancelStakeBtn) {
        cancelStakeBtn.onclick = () => {
          modal.close();
          modal.remove();
        };
      }

      const customInput = modal.querySelector('#custom-stake-input') as HTMLInputElement;
      const useCustomBtn = modal.querySelector('#use-custom-amount-btn') as HTMLButtonElement;
      const errorDiv = modal.querySelector('#custom-amount-error') as HTMLDivElement;

      if (customInput) {
        customInput.oninput = () => {
          customInput.style.borderColor = 'rgb(116,113,203)';
          if (errorDiv) errorDiv.style.display = 'none';
        };
      }

      if (useCustomBtn && customInput && errorDiv) {
        useCustomBtn.onclick = async () => {
          const customAmount = parseFloat(customInput.value);

          if (!customAmount || isNaN(customAmount)) {
            customInput.style.borderColor = '#ff6b6b';
            errorDiv.textContent = 'Please enter a valid amount';
            errorDiv.style.display = 'block';
            return;
          }

          if (customAmount < 0.001) {
            customInput.style.borderColor = '#ff6b6b';
            errorDiv.textContent = 'Minimum stake amount is 0.001 PC';
            errorDiv.style.display = 'block';
            return;
          }

          customInput.style.borderColor = 'rgb(116,113,203)';
          errorDiv.style.display = 'none';

          const stakeAmount = customAmount.toString();
          modal.remove();

          const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

          setStakingInProgress(true);
          setSelectedStakeAmount(stakeAmount);
          setPendingRoomCode(roomCode);
          setStakingErrorMessage(null);

          try {
            await stakeAsPlayer1(roomCode, stakeAmount);
          } catch (error) {
            setStakingInProgress(false);
            setPendingRoomCode(null);
            setSelectedStakeAmount(null);
          }
        };
      }

      modal.querySelectorAll('.stake-option').forEach(button => {
        (button as HTMLButtonElement).onclick = async () => {
          const stakeAmount = button.getAttribute('data-amount');
          modal.remove();

          if (!stakeAmount) return;

          const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

          setStakingInProgress(true);
          setSelectedStakeAmount(stakeAmount);
          setPendingRoomCode(roomCode);
          setStakingErrorMessage(null);

          try {
            await stakeAsPlayer1(roomCode, stakeAmount);
          } catch (error) {
            setStakingInProgress(false);
            setPendingRoomCode(null);
            setSelectedStakeAmount(null);
          }
        };
      });
    });
  };

  return (
    <div className="welcome">
      {/* Push Chain Wallet Connect Button */}
      <div className="wallet-connect-container">
        <PushUniversalAccountButton />
        {savedUsername && (
          <button onClick={() => navigate('/game-history')} className="game-history-btn">
            📊 History
          </button>
        )}
        {isConnected && (
          <button onClick={() => navigate('/my-wins')} className="my-wins-btn">
            🏆 My Wins
          </button>
        )}
        {isConnected && (
          <button onClick={() => navigate('/unclaimed-stakes')} className="unclaimed-stakes-btn">
            💰 Unclaimed Stakes
            {unclaimedStakesCount > 0 && (
              <span className="badge">{unclaimedStakesCount}</span>
            )}
          </button>
        )}
      </div>

      <div className={`title-container ${showTitle ? 'show' : ''}`}>
        <h1 className="game-title">PONG-IT</h1>
        <div className="title-glow"></div>
      </div>

      <div className="menu">
        <div className="game-modes">
          <button onClick={handleStartGame} className="mode-button quick-match">
            <span className="button-icon">⚡</span>
            <span className="button-text">Quick Match</span>
          </button>
          <button onClick={handleCreateRoom} className="mode-button create-room">
            <span className="button-icon">➕</span>
            <span className="button-text">Create Room</span>
          </button>
          <button onClick={handleJoinRoom} className="mode-button join-room">
            <span className="button-icon">🔗</span>
            <span className="button-text">Join Room</span>
          </button>
          <button
            onClick={handleCreateStakedMatch}
            className="mode-button staked-match"
          >
            <span className="button-icon">💎</span>
            <span className="button-text">Staked Match</span>
          </button>
        </div>

        {/* Transaction Status Overlay */}
        {stakingInProgress && (
          <div className="transaction-overlay">
            <div className="transaction-modal">
              {stakingErrorMessage ? (
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
                    {stakingErrorMessage}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={async () => {
                        if (pendingRoomCode && selectedStakeAmount) {
                          setStakingErrorMessage(null);
                          try {
                            await stakeAsPlayer1(pendingRoomCode, selectedStakeAmount);
                          } catch (error) {
                          }
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
                        setStakingInProgress(false);
                        setStakingErrorMessage(null);
                        setPendingRoomCode(null);
                        setSelectedStakeAmount(null);
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
                    {isStakingPending && 'Confirm Transaction in Wallet...'}
                    {isStakingConfirming && 'Transaction Confirming...'}
                  </h3>
                  <div className="transaction-spinner"></div>
                  <p>
                    {isStakingPending && 'Please confirm the transaction in your wallet'}
                    {isStakingConfirming && 'Waiting for blockchain confirmation'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="active-games">
          <h2>Live Games ({activeGames.length})</h2>
          <div className="games-list">
            {activeGames.length > 0 ? (
              activeGames.map((game) => (
                <div key={game.roomCode} className="game-item" onClick={() => handleSpectateGame(game.roomCode)}>
                  <div className="game-info">
                    <span className="game-players">{game.players.join(' vs ')}</span>
                    <span className="game-code">Room: {game.roomCode}</span>
                  </div>
                  <div className="game-stats">
                    <span className="spectator-count">👁 {game.spectatorCount}</span>
                    <span className="game-status">{game.status === 'playing' ? '🎮' : '⏳'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-games">No live games at the moment</div>
            )}
          </div>
        </div>

        <div className="instructions">
          <h2>How to Play</h2>
          <p>Move your paddle to hit the ball past your opponent!</p>
          <p>Use UP/DOWN arrow keys to move your paddle</p>
          <p>First to 5 points wins!</p>
        </div>
        
        <div className="rankings">
          <h2>Top Players</h2>
          <div className="rankings-list">
            {rankings.length > 0 ? (
              rankings.map((player, index) => (
                <div key={player.name} className="ranking-item">
                  <span className="rank">{index + 1}</span>
                  <span className="name">{player.name}</span>
                  <span className="rating">{player.rating}</span>
                  <span className="stats">{player.wins || 0}W/{player.losses || 0}L</span>
                </div>
              ))
            ) : (
              <div className="no-rankings">No players ranked yet</div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        dialogState={dialogState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default Welcome;

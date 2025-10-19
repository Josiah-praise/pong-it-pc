import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import io from 'socket.io-client';
import '../styles/Welcome.css';
import { BACKEND_URL } from '../constants';
import soundManager from '../utils/soundManager';
import { useStakeAsPlayer1, useStakeAsPlayer2, useGetMatch } from '../hooks/useContract';
import { STAKE_AMOUNTS } from '../contracts/PongEscrow';

const Welcome = ({ setGameState, savedUsername, onUsernameSet }) => {
  const [rankings, setRankings] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [showTitle, setShowTitle] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [stakingInProgress, setStakingInProgress] = useState(false);
  const [selectedStakeAmount, setSelectedStakeAmount] = useState(null);
  const [pendingRoomCode, setPendingRoomCode] = useState(null);
  const titleRef = useRef();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Web3 hooks
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const {
    stakeAsPlayer1,
    hash: stakingTxHash,
    isPending: isStakingPending,
    isConfirming: isStakingConfirming,
    isSuccess: isStakingSuccess,
    error: stakingError
  } = useStakeAsPlayer1();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        console.log('Fetching rankings...');
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
        console.log('Received rankings:', data);
        setRankings(data);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
        // Use empty array instead of showing an error to the user
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
      console.log('Socket connected');
      socket.emit('getActiveGames');
    });

    socket.on('rankingsUpdate', (newRankings) => {
      console.log('Received rankings update:', newRankings);
      setRankings(newRankings);
    });

    socket.on('activeGamesList', (games) => {
      console.log('Received active games:', games);
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
      console.log('Starting audio from user interaction');
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
    // Show title animation without sound initially
    const timer = setTimeout(() => {
      setShowTitle(true);
    }, 100);

    // Setup click listener to start audio
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
    console.log('🔍 Staking useEffect triggered:', {
      isStakingSuccess,
      pendingRoomCode,
      stakingTxHash,
      selectedStakeAmount,
      address,
      savedUsername
    });

    if (isStakingSuccess && pendingRoomCode && stakingTxHash) {
      console.log('✅ All conditions met! Staking successful! Creating game record...');

      // Notify player-service about the staked match
      fetch(`${process.env.REACT_APP_PLAYER_SERVICE_URL || 'http://localhost:5001'}/games`, {
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
          console.log('✅ Staked game created in database:', data);
        })
        .catch(err => {
          console.error('❌ Failed to create game record:', err);
        });

      setStakingInProgress(false);
      setGameState(prev => ({
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
      console.error('Staking error:', stakingError);
      setStakingInProgress(false);
      alert(`Transaction failed: ${stakingError.message || 'Unknown error'}`);
    }
  }, [stakingError]);

  const promptUsername = (callback) => {
    if (savedUsername) {
      callback(savedUsername);
      return;
    }

    const modal = document.createElement('dialog');
    modal.innerHTML = `
      <form method="dialog">
        <h2>Enter Your Username</h2>
        <input type="text" id="username" required minlength="2" maxlength="15">
        <div class="buttons">
          <button type="submit">Continue</button>
        </div>
      </form>
    `;

    document.body.appendChild(modal);
    modal.showModal();

    modal.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      onUsernameSet(username);
      callback(username);
      modal.remove();
    };
  };

  const handleStartGame = () => {
    promptUsername((username) => {
      setGameState(prev => ({
        ...prev,
        player1: { name: username, rating: 800 },
        gameMode: 'quick'
      }));
      navigate('/game', { state: { gameMode: 'quick' } });
    });
  };

  const handleCreateRoom = () => {
    promptUsername((username) => {
      setGameState(prev => ({
        ...prev,
        player1: { name: username, rating: 800 },
        gameMode: 'create'
      }));
      navigate('/game', { state: { gameMode: 'create' } });
    });
  };

  const handleJoinRoom = () => {
    promptUsername((username) => {
      const modal = document.createElement('dialog');
      modal.innerHTML = `
        <form method="dialog">
          <h2>Enter Room Code</h2>
          <input type="text" id="roomCode" required minlength="6" maxlength="6" placeholder="ABC123" style="text-transform: uppercase;">
          <div class="buttons">
            <button type="submit">Join Room</button>
            <button type="button" id="cancel-btn">Cancel</button>
          </div>
        </form>
      `;

      document.body.appendChild(modal);
      modal.showModal();

      document.getElementById('cancel-btn').onclick = () => {
        modal.close();
        modal.remove();
      };

      modal.querySelector('form').onsubmit = (e) => {
        e.preventDefault();
        const roomCode = document.getElementById('roomCode').value.toUpperCase();
        setGameState(prev => ({
          ...prev,
          player1: { name: username, rating: 800 },
          gameMode: 'join',
          roomCode
        }));
        navigate('/game', { state: { gameMode: 'join', roomCode } });
        modal.remove();
      };
    });
  };

  const handleSpectateGame = (roomCode) => {
    promptUsername((username) => {
      navigate('/spectate', { state: { roomCode, spectatorName: username } });
    });
  };

  const handleCreateStakedMatch = () => {
    promptUsername((username) => {
      // Check if wallet is connected
      if (!isConnected) {
        alert('Please connect your wallet to create a staked match');
        return;
      }

      // Show stake amount selection modal
      const modal = document.createElement('dialog');
      modal.className = 'stake-modal';
      modal.innerHTML = `
        <form method="dialog">
          <h2>Select Stake Amount</h2>
          <p style="margin-bottom: 20px; color: #888;">Choose how much ETH you want to stake</p>
          <div class="stake-options">
            ${STAKE_AMOUNTS.map(({ value, label }) => `
              <button type="button" class="stake-option" data-amount="${value}">
                ${label}
              </button>
            `).join('')}
          </div>
          <div class="buttons" style="margin-top: 20px;">
            <button type="button" id="cancel-stake-btn">Cancel</button>
          </div>
        </form>
      `;

      document.body.appendChild(modal);
      modal.showModal();

      // Handle cancel
      modal.querySelector('#cancel-stake-btn').onclick = () => {
        modal.close();
        modal.remove();
      };

      // Handle stake amount selection
      modal.querySelectorAll('.stake-option').forEach(button => {
        button.onclick = async () => {
          const stakeAmount = button.getAttribute('data-amount');
          modal.remove();

          // Generate room code
          const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          console.log(`Creating staked match with ${stakeAmount} ETH, room code: ${roomCode}`);

          setStakingInProgress(true);
          setSelectedStakeAmount(stakeAmount);
          setPendingRoomCode(roomCode);

          try {
            await stakeAsPlayer1(roomCode, stakeAmount);
          } catch (error) {
            console.error('Error initiating stake:', error);
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
      {/* Wallet Connect Button */}
      <div className="wallet-connect-container">
        <button onClick={() => open()} className="connect-wallet-btn">
          {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
        </button>
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
            disabled={!isConnected}
          >
            <span className="button-icon">💎</span>
            <span className="button-text">
              {isConnected ? 'Staked Match' : 'Connect Wallet First'}
            </span>
          </button>
        </div>

        {/* Transaction Status Overlay */}
        {stakingInProgress && (
          <div className="transaction-overlay">
            <div className="transaction-modal">
              <h3>
                {isStakingPending && 'Confirm Transaction in Wallet...'}
                {isStakingConfirming && 'Transaction Confirming...'}
              </h3>
              <div className="transaction-spinner"></div>
              <p>
                {isStakingPending && 'Please confirm the transaction in your wallet'}
                {isStakingConfirming && 'Waiting for blockchain confirmation'}
              </p>
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
    </div>
  );
};

export default Welcome; 
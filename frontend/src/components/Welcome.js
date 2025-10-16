import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/Welcome.css';
import { BACKEND_URL } from '../constants';
import soundManager from '../utils/soundManager';

const Welcome = ({ setGameState, savedUsername, onUsernameSet }) => {
  const [rankings, setRankings] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [showTitle, setShowTitle] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const titleRef = useRef();
  const navigate = useNavigate();
  const socketRef = useRef(null);

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

  return (
    <div className="welcome">
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
        </div>

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
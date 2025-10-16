import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/Game.css';
import { BACKEND_URL, INITIAL_RATING } from '../constants';
import soundManager from '../utils/soundManager';

const MultiplayerGame = ({ username }) => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [roomCode, setRoomCode] = useState(null);
  const [gameData, setGameData] = useState({
    score: [0, 0],
    ballPos: { x: 0, y: 0 },
    paddles: {
      player1: { y: 0 },
      player2: { y: 0 }
    },
    players: []
  });
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBy, setPausedBy] = useState(null);
  const [pausesRemaining, setPausesRemaining] = useState(2);
  const [showRematchRequest, setShowRematchRequest] = useState(false);
  const [rematchRequester, setRematchRequester] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const prevGameDataRef = useRef(null);
  const isMounted = useRef(false);

  const gameMode = location.state?.gameMode || 'quick';
  const joinRoomCode = location.state?.roomCode;

  const drawGame = useCallback((ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (isWaiting) {
      ctx.font = '24px "Press Start 2P"';
      ctx.fillStyle = 'rgb(116,113,203)';
      ctx.textAlign = 'center';
      const dots = '.'.repeat(Math.floor(Date.now() / 500) % 4);

      if (roomCode) {
        ctx.fillText(`Room Code: ${roomCode}`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 30);
        ctx.fillText(`Waiting for opponent${dots}`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
      } else {
        ctx.fillText(`Waiting for opponent${dots}`, ctx.canvas.width / 2, ctx.canvas.height / 2);
      }
      return;
    }

    const { width, height } = ctx.canvas;
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = 'rgb(116,113,203)';
    const paddleWidth = width * 0.02;
    const paddleHeight = height * 0.2;

    Object.values(gameData.paddles).forEach((paddle, index) => {
      const x = index === 0 ? paddleWidth : width - paddleWidth * 2;
      const y = (paddle.y + 1) * height / 2 - paddleHeight / 2;
      ctx.fillRect(x, y, paddleWidth, paddleHeight);
    });

    ctx.fillStyle = 'rgb(253,208,64)';
    const ballSize = width * 0.02;
    const ballX = (gameData.ballPos.x + 1) * width / 2 - ballSize / 2;
    const ballY = (gameData.ballPos.y + 1) * height / 2 - ballSize / 2;
    ctx.beginPath();
    ctx.arc(ballX + ballSize/2, ballY + ballSize/2, ballSize/2, 0, Math.PI * 2);
    ctx.fill();
  }, [gameData, isWaiting, roomCode]);

  const handleMouseMove = useCallback((e) => {
    if (!socketRef.current || isWaiting) return;

    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    const relativeY = ((e.clientY - bounds.top) / bounds.height) * 2 - 1;
    const clampedY = Math.max(-1, Math.min(1, relativeY));

    socketRef.current.emit('paddleMove', { position: clampedY });
  }, [isWaiting]);

  const handleTouchMove = useCallback((e) => {
    if (!socketRef.current || isWaiting) return;

    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      const touchY = e.touches[0].clientY;
      const relativeY = ((touchY - bounds.top) / bounds.height) * 2 - 1;
      const clampedY = Math.max(-1, Math.min(1, relativeY));

      socketRef.current.emit('paddleMove', { position: clampedY });
    }
  }, [isWaiting]);

  const handlePauseGame = useCallback(() => {
    if (socketRef.current && !isPaused) {
      socketRef.current.emit('pauseGame');
    }
  }, [isPaused]);

  const handleForfeitGame = useCallback(() => {
    if (window.confirm('Are you sure you want to forfeit? You will lose the game.')) {
      if (socketRef.current) {
        socketRef.current.emit('forfeitGame');
      }
    }
  }, []);

  const handleRematchResponse = useCallback((accepted) => {
    if (socketRef.current) {
      socketRef.current.emit('rematchResponse', { accepted });
      setShowRematchRequest(false);
      setRematchRequester(null);
    }
  }, []);

  const setupSocket = useCallback(() => {
    if (!isMounted.current || !username) return;

    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket'],
      path: '/socket.io/',
      query: { username }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected:', socket.id);

      const playerData = {
        name: username,
        rating: INITIAL_RATING,
        socketId: socket.id
      };

      if (gameMode === 'create') {
        socket.emit('createRoom', playerData);
      } else if (gameMode === 'join' && joinRoomCode) {
        socket.emit('joinRoom', { roomCode: joinRoomCode, player: playerData });
      } else {
        socket.emit('findRandomMatch', playerData);
      }
    });

    socket.on('roomCreated', (data) => {
      console.log('Room created:', data.roomCode);
      setRoomCode(data.roomCode);
      setIsWaiting(true);
    });

    socket.on('waitingForOpponent', (data) => {
      console.log('Waiting for opponent:', data.roomCode);
      setRoomCode(data.roomCode);
      setIsWaiting(true);
    });

    socket.on('roomReady', (data) => {
      console.log('Room ready:', data);
      setIsWaiting(true);
    });

    socket.on('gameStart', (data) => {
      console.log('Game starting:', data);
      setIsWaiting(false);
      setGameData(data);
      prevGameDataRef.current = data;
      soundManager.startBackgroundMusic();
    });

    socket.on('gameUpdate', (data) => {
      if (prevGameDataRef.current) {
        if (data?.ballVelocity?.x !== prevGameDataRef.current?.ballVelocity?.x) {
          soundManager.playWithErrorHandling(
            () => soundManager.playHitSound(),
            'Hit sound failed'
          );
        }

        if (data?.score && prevGameDataRef.current?.score &&
            (data.score[0] !== prevGameDataRef.current.score[0] ||
             data.score[1] !== prevGameDataRef.current.score[1])) {
          soundManager.playWithErrorHandling(
            () => soundManager.playScoreSound(),
            'Score sound failed'
          );
        }
      }

      setGameData(data);
      prevGameDataRef.current = data;
    });

    socket.on('gameOver', (result) => {
      soundManager.playWithErrorHandling(
        async () => {
          await soundManager.playGameOverSound();
          setTimeout(() => soundManager.stopAll(), 1000);
        },
        'Game over sound failed'
      );

      const isWinner = result.winner === socket.id;

      navigate('/game-over', {
        state: {
          ...result,
          isWinner,
          message: isWinner ? 'You Won!' : 'You Lost!',
          rating: result.ratings?.[socket.id],
          finalScore: result.finalScore || result.stats?.score
        }
      });
    });

    socket.on('gamePaused', (data) => {
      setIsPaused(true);
      setPausedBy(data.pausedBy);
      setPausesRemaining(data.pausesRemaining);
    });

    socket.on('gameResumed', () => {
      setIsPaused(false);
      setPausedBy(null);
    });

    socket.on('playerForfeited', (data) => {
      soundManager.stopAll();
      alert(`${data.forfeitedPlayer} forfeited. ${data.winner} wins!`);
      navigate('/');
    });

    socket.on('rematchRequested', (data) => {
      setShowRematchRequest(true);
      setRematchRequester(data.from);
    });

    socket.on('rematchDeclined', () => {
      alert('Rematch declined');
      navigate('/');
    });

    socket.on('opponentLeft', () => {
      alert('Opponent left the game');
      navigate('/');
    });

    socket.on('opponentDisconnected', (data) => {
      soundManager.stopAll();
      if (data && data.winner) {
        alert(`${data.disconnectedPlayer} disconnected. ${data.winner} wins!`);
      } else {
        alert('Opponent disconnected');
      }
      navigate('/');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      alert('Error: ' + error.message);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [username, gameMode, joinRoomCode, navigate]);

  useEffect(() => {
    isMounted.current = true;

    if (!username) {
      navigate('/');
      return;
    }

    const cleanup = setupSocket();

    return () => {
      isMounted.current = false;
      if (cleanup) cleanup();
    };
  }, [setupSocket, username, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const updateCanvasSize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.65;
      } else {
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let animationId;
    const gameLoop = () => {
      drawGame(ctx);
      animationId = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [drawGame]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  const handleLeaveGame = useCallback(() => {
    if (window.confirm('Are you sure you want to leave? You will forfeit the game.')) {
      if (socketRef.current) {
        socketRef.current.emit('forfeitGame');
      }
      soundManager.stopAll();
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="game-container" ref={containerRef} style={{ touchAction: 'none' }}>
      <button onClick={handleLeaveGame} className="back-button" aria-label="Leave game">
        ← Back
      </button>

      {roomCode && (
        <div className="room-info">
          <span className="room-code-display">Room: {roomCode}</span>
        </div>
      )}

      <div className="player-names">
        <span>{gameData.players[0]?.name || 'Player 1'}</span>
        <span>{gameData.players[1]?.name || 'Player 2'}</span>
      </div>

      <div className="score-board">
        <span>{gameData.score[0]}</span>
        <span>{gameData.score[1]}</span>
      </div>

      {!isWaiting && (
        <div className="game-controls">
          <button
            onClick={handlePauseGame}
            disabled={isPaused || pausesRemaining <= 0}
            className="control-btn pause-btn"
          >
            Pause ({pausesRemaining})
          </button>
          <button
            onClick={handleForfeitGame}
            className="control-btn forfeit-btn"
          >
            Forfeit
          </button>
        </div>
      )}

      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-message">
            <h2>Game Paused</h2>
            <p>Paused by: {pausedBy}</p>
            <p>Resuming in 10 seconds...</p>
          </div>
        </div>
      )}

      {showRematchRequest && (
        <div className="rematch-overlay">
          <div className="rematch-modal">
            <h2>Rematch Request</h2>
            <p>{rematchRequester} wants a rematch!</p>
            <div className="rematch-buttons">
              <button
                onClick={() => handleRematchResponse(true)}
                className="accept-btn"
              >
                Accept
              </button>
              <button
                onClick={() => handleRematchResponse(false)}
                className="decline-btn"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} />
    </div>
  );
};

export default MultiplayerGame;

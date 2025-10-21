import { useEffect, useRef, useState, useCallback, type FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePushWalletContext, usePushChainClient } from '@pushchain/ui-kit';
import io, { Socket } from 'socket.io-client';
import '../styles/Game.css';
import { BACKEND_URL, INITIAL_RATING } from '../constants';
import soundManager from '../utils/soundManager';
import { useStakeAsPlayer2 } from '../hooks/usePushContract';
import { parseTransactionError } from '../utils/errorParser';

interface MultiplayerGameProps {
  username: string | null
}

interface Player {
  name: string
  rating: number
  socketId?: string
}

interface GameData {
  score: [number, number]
  ballPos: { x: number; y: number }
  paddles: {
    player1: { y: number }
    player2: { y: number }
  }
  players: Player[]
  ballVelocity?: { x: number; y: number }
}

interface StakingData {
  roomCode: string
  stakeAmount: string
}

interface LocationState {
  gameMode?: string
  roomCode?: string
}

const MultiplayerGame: FC<MultiplayerGameProps> = ({ username }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameData>({
    score: [0, 0],
    ballPos: { x: 0, y: 0 },
    paddles: {
      player1: { y: 0 },
      player2: { y: 0 }
    },
    players: []
  });
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBy, setPausedBy] = useState<string | null>(null);
  const [pausesRemaining, setPausesRemaining] = useState(2);
  const [showRematchRequest, setShowRematchRequest] = useState(false);
  const [rematchRequester, setRematchRequester] = useState<string | null>(null);
  const [showPlayer2StakingModal, setShowPlayer2StakingModal] = useState(false);
  const [stakingData, setStakingData] = useState<StakingData | null>(null);
  const [isPlayer2Staking, setIsPlayer2Staking] = useState(false);
  const [stakingErrorMessage, setStakingErrorMessage] = useState<string | null>(null);
  const [isCursorHidden, setIsCursorHidden] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevGameDataRef = useRef<GameData | null>(null);
  const isMounted = useRef(false);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard control state
  const [keyboardPaddleY, setKeyboardPaddleY] = useState(0);
  const keysPressed = useRef<{ ArrowUp: boolean; ArrowDown: boolean }>({ ArrowUp: false, ArrowDown: false });
  const keyboardIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Push Chain wallet context
  const { connectionStatus } = usePushWalletContext();
  const { pushChainClient } = usePushChainClient();
  const isConnected = connectionStatus === 'connected';
  
  // Get the user's account address from Push Chain client
  const address = pushChainClient?.universal?.account?.toLowerCase() || null;

  // Push Chain staking hook for Player2
  const {
    stakeAsPlayer2,
    hash: player2StakingTxHash,
    isPending: isPlayer2StakingPending,
    isConfirming: isPlayer2StakingConfirming,
    isSuccess: isPlayer2StakingSuccess,
    error: player2StakingError
  } = useStakeAsPlayer2();

  const locationState = location.state as LocationState;
  const gameMode = locationState?.gameMode || 'quick';
  const joinRoomCode = locationState?.roomCode;

  const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (isWaiting) {
      ctx.font = '24px "Press Start 2P"';
      ctx.fillStyle = '#DA76EC';
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

    ctx.fillStyle = '#DA76EC';
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

  // Cursor auto-hide management
  const resetCursorTimeout = useCallback(() => {
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
    }

    setIsCursorHidden(false);

    cursorTimeoutRef.current = setTimeout(() => {
      setIsCursorHidden(true);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    resetCursorTimeout();

    if (!socketRef.current || isWaiting) return;

    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    const relativeY = ((e.clientY - bounds.top) / bounds.height) * 2 - 1;
    const clampedY = Math.max(-1, Math.min(1, relativeY));

    socketRef.current.emit('paddleMove', { position: clampedY });
  }, [isWaiting, resetCursorTimeout]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
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

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isWaiting || !socketRef.current) return;

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      keysPressed.current[e.key] = true;

      if (!keyboardIntervalRef.current) {
        keyboardIntervalRef.current = setInterval(() => {
          setKeyboardPaddleY((prevY) => {
            const MOVE_SPEED = 0.05;
            let newY = prevY;

            if (keysPressed.current.ArrowUp) {
              newY -= MOVE_SPEED;
            }
            if (keysPressed.current.ArrowDown) {
              newY += MOVE_SPEED;
            }

            newY = Math.max(-1, Math.min(1, newY));

            if (socketRef.current) {
              socketRef.current.emit('paddleMove', { position: newY });
            }

            return newY;
          });
        }, 16);
      }
    }
  }, [isWaiting]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      keysPressed.current[e.key] = false;

      if (!keysPressed.current.ArrowUp && !keysPressed.current.ArrowDown) {
        if (keyboardIntervalRef.current) {
          clearInterval(keyboardIntervalRef.current);
          keyboardIntervalRef.current = null;
        }
      }
    }
  }, []);

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

  const handleRematchResponse = useCallback((accepted: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('rematchResponse', { accepted });
      setShowRematchRequest(false);
      setRematchRequester(null);
    }
  }, []);

  const handlePlayer2Stake = useCallback(async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!stakingData) {
      alert('No staking data available');
      return;
    }

    console.log('💎 Player2 initiating stake:', stakingData);
    setStakingErrorMessage(null);
    setIsPlayer2Staking(true);

    try {
      await stakeAsPlayer2(stakingData.roomCode, stakingData.stakeAmount);
    } catch (error) {
      console.error('Error initiating Player2 stake:', error);
      setIsPlayer2Staking(false);
    }
  }, [isConnected, stakingData, stakeAsPlayer2]);

  // Handle successful Player2 staking transaction
  useEffect(() => {
    console.log('🔍 Player2 Staking useEffect:', {
      isPlayer2StakingSuccess,
      player2StakingTxHash,
      stakingData,
      address
    });

    if (isPlayer2StakingSuccess && player2StakingTxHash && stakingData) {
      console.log('✅ Player2 staking successful! Updating game record...');

      fetch(`${BACKEND_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: stakingData.roomCode,
          player2: { name: username, rating: 800 },
          player2Address: address,
          player2TxHash: player2StakingTxHash,
          status: 'ready'
        })
      })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Game record updated with Player2 stake:', data);
        })
        .catch(err => {
          console.error('❌ Failed to update game record:', err);
        });

      if (socketRef.current) {
        socketRef.current.emit('player2StakeCompleted', {
          roomCode: stakingData.roomCode
        });
      }

      setIsPlayer2Staking(false);
      setShowPlayer2StakingModal(false);
      setStakingData(null);
    }
  }, [isPlayer2StakingSuccess, player2StakingTxHash, stakingData, username, address]);

  // Handle Player2 staking errors
  useEffect(() => {
    if (player2StakingError) {
      console.error('Player2 staking error:', player2StakingError);
      setIsPlayer2Staking(false);

      const parsedError = parseTransactionError(player2StakingError);
      setStakingErrorMessage(parsedError.message);
    }
  }, [player2StakingError]);

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

      const playerData: Player = {
        name: username,
        rating: INITIAL_RATING,
        socketId: socket.id
      };

      if (gameMode === 'create' || gameMode === 'create-staked') {
        const specificRoomCode = locationState?.roomCode;
        socket.emit('createRoom', playerData, specificRoomCode);
      } else if (gameMode === 'join' && joinRoomCode) {
        socket.emit('joinRoom', { roomCode: joinRoomCode, player: playerData });
      } else {
        socket.emit('findRandomMatch', playerData);
      }
    });

    socket.on('roomCreated', (data: { roomCode: string }) => {
      console.log('Room created:', data.roomCode);
      setRoomCode(data.roomCode);
      setIsWaiting(true);
    });

    socket.on('waitingForOpponent', (data: { roomCode: string }) => {
      console.log('Waiting for opponent:', data.roomCode);
      setRoomCode(data.roomCode);
      setIsWaiting(true);
    });

    socket.on('roomReady', (data: any) => {
      console.log('Room ready:', data);
      setIsWaiting(true);
    });

    socket.on('stakedMatchJoined', (data: StakingData) => {
      console.log('💎 Staked match joined! Player2 needs to stake:', data);
      setStakingData(data);
      setShowPlayer2StakingModal(true);
    });

    socket.on('waitingForPlayer2Stake', (data: any) => {
      console.log('⏳ Waiting for Player2 to stake:', data);
      setIsWaiting(true);
    });

    socket.on('gameStart', (data: GameData) => {
      console.log('Game starting:', data);
      setIsWaiting(false);
      setGameData(data);
      prevGameDataRef.current = data;
      soundManager.startBackgroundMusic();
    });

    socket.on('gameUpdate', (data: GameData) => {
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

    socket.on('gameOver', (result: any) => {
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

    socket.on('gamePaused', (data: { pausedBy: string; pausesRemaining: number }) => {
      setIsPaused(true);
      setPausedBy(data.pausedBy);
      setPausesRemaining(data.pausesRemaining);
    });

    socket.on('gameResumed', () => {
      setIsPaused(false);
      setPausedBy(null);
    });

    socket.on('playerForfeited', (data: { forfeitedPlayer: string; winner: string }) => {
      soundManager.stopAll();
      alert(`${data.forfeitedPlayer} forfeited. ${data.winner} wins!`);
      navigate('/');
    });

    socket.on('rematchRequested', (data: { from: string }) => {
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

    socket.on('opponentDisconnected', (data: { disconnectedPlayer?: string; winner?: string }) => {
      soundManager.stopAll();
      if (data && data.winner) {
        alert(`${data.disconnectedPlayer} disconnected. ${data.winner} wins!`);
      } else {
        alert('Opponent disconnected');
      }
      navigate('/');
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      alert('Error: ' + error.message);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [username, gameMode, joinRoomCode, navigate, locationState?.roomCode]);

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
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    let animationId: number;
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

    container.addEventListener('mousemove', handleMouseMove as any);
    container.addEventListener('touchmove', handleTouchMove as any, { passive: false });

    return () => {
      container.removeEventListener('mousemove', handleMouseMove as any);
      container.removeEventListener('touchmove', handleTouchMove as any);
    };
  }, [handleMouseMove, handleTouchMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    window.addEventListener('keyup', handleKeyUp as any);

    return () => {
      window.removeEventListener('keydown', handleKeyDown as any);
      window.removeEventListener('keyup', handleKeyUp as any);

      if (keyboardIntervalRef.current) {
        clearInterval(keyboardIntervalRef.current);
        keyboardIntervalRef.current = null;
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isCursorHidden) {
      container.classList.add('cursor-hidden');
    } else {
      container.classList.remove('cursor-hidden');
    }
  }, [isCursorHidden]);

  useEffect(() => {
    return () => {
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, []);

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
        <>
          <div className="controls-hint" style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontFamily: 'monospace',
            textAlign: 'right',
            lineHeight: '1.4'
          }}>
            <div>🎮 Controls:</div>
            <div>↑↓ Arrow Keys</div>
            <div>or Mouse</div>
          </div>
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
        </>
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

      {showPlayer2StakingModal && stakingData && (
        <div className="transaction-overlay">
          <div className="transaction-modal">
            <h2>💎 Staked Match</h2>
            <p style={{ marginBottom: '20px' }}>
              This is a staked match. You need to stake {stakingData.stakeAmount} PC to join.
            </p>

            {stakingErrorMessage && !isPlayer2Staking ? (
              <>
                <div style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  ❌ {stakingErrorMessage}
                </div>
                <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
                  {isConnected
                    ? `Your wallet: ${address?.slice(0, 10)}...${address?.slice(-4)}`
                    : 'Please connect your wallet first'}
                </p>
                <div className="rematch-buttons">
                  <button
                    onClick={handlePlayer2Stake}
                    className="accept-btn"
                    disabled={!isConnected}
                  >
                    Retry Staking
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayer2StakingModal(false);
                      setStakingData(null);
                      setStakingErrorMessage(null);
                      // Emit leaveRoom before navigating so backend knows we're leaving before staking
                      if (socketRef.current && stakingData?.roomCode) {
                        socketRef.current.emit('leaveRoomBeforeStaking', { roomCode: stakingData.roomCode });
                      }
                      navigate('/');
                    }}
                    className="decline-btn"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : !isPlayer2Staking ? (
              <>
                <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
                  {isConnected
                    ? `Your wallet: ${address?.slice(0, 10)}...${address?.slice(-4)}`
                    : 'Please connect your wallet first'}
                </p>
                <div className="rematch-buttons">
                  <button
                    onClick={handlePlayer2Stake}
                    className="accept-btn"
                    disabled={!isConnected}
                  >
                    Stake & Play
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayer2StakingModal(false);
                      setStakingData(null);
                      setStakingErrorMessage(null);
                      // Emit leaveRoom before navigating so backend knows we're leaving before staking
                      if (socketRef.current && stakingData?.roomCode) {
                        socketRef.current.emit('leaveRoomBeforeStaking', { roomCode: stakingData.roomCode });
                      }
                      navigate('/');
                    }}
                    className="decline-btn"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>
                  {isPlayer2StakingPending && 'Confirm Transaction in Wallet...'}
                  {isPlayer2StakingConfirming && 'Transaction Confirming...'}
                </h3>
                <div className="transaction-spinner"></div>
                <p>
                  {isPlayer2StakingPending && 'Please confirm the transaction in your wallet'}
                  {isPlayer2StakingConfirming && 'Waiting for blockchain confirmation'}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} />
    </div>
  );
};

export default MultiplayerGame;

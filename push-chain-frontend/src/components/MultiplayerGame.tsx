import { useEffect, useRef, useState, useCallback, useMemo, type FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePushWalletContext, usePushChainClient } from '@pushchain/ui-kit';
import io, { Socket } from 'socket.io-client';
import '../styles/Game.css';
import { BACKEND_URL, INITIAL_RATING, POWER_UP_METADATA } from '../constants';
import soundManager from '../utils/soundManager';
import { useStakeAsPlayer2 } from '../hooks/usePushContract';
import { parseTransactionError } from '../utils/errorParser';
import { useDialog } from '../hooks/useDialog';
import Dialog from './Dialog';
import AddressDisplay from './AddressDisplay';
import { type Player as AuthPlayer } from '../services/authService';
import { getPowerUpSummary, type PowerUpSummary } from '../services/powerUpService';

interface MultiplayerGameProps {
  username: string | null
  walletAddress: string | null
  authenticatedPlayer: AuthPlayer | null
}

interface Player {
  name: string
  rating: number
  socketId?: string
  walletAddress?: string
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
  extraBalls?: Array<{ x: number; y: number }>
}

interface StakingData {
  roomCode: string
  stakeAmount: string
}

interface LocationState {
  gameMode?: string
  roomCode?: string
}

const MultiplayerGame: FC<MultiplayerGameProps> = ({ username, walletAddress, authenticatedPlayer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const isNavigatingToGameOver = useRef(false); // Track if navigating to game-over
  const [isWaiting, setIsWaiting] = useState(true);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const initialGameState: GameData = {
    score: [0, 0],
    ballPos: { x: 0, y: 0 },
    paddles: {
      player1: { y: 0 },
      player2: { y: 0 }
    },
    players: [],
    extraBalls: []
  };
  const [gameData, setGameData] = useState<GameData>(initialGameState);
  const gameDataRef = useRef<GameData>(initialGameState);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBy, setPausedBy] = useState<string | null>(null);
  const [pausesRemaining, setPausesRemaining] = useState(1);
  const [opponentPausesRemaining, setOpponentPausesRemaining] = useState(1);
  const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);
  const [showRematchRequest, setShowRematchRequest] = useState(false);
  const [rematchRequester, setRematchRequester] = useState<string | null>(null);
  const [showPlayer2StakingModal, setShowPlayer2StakingModal] = useState(false);
  const [stakingData, setStakingData] = useState<StakingData | null>(null);
  const [isPlayer2Staking, setIsPlayer2Staking] = useState(false);
  const [stakingErrorMessage, setStakingErrorMessage] = useState<string | null>(null);
  const [isCursorHidden, setIsCursorHidden] = useState(false);
  const [isStakedGame, setIsStakedGame] = useState(false);
  const [powerUpSummary, setPowerUpSummary] = useState<PowerUpSummary | null>(null);
  const [isFetchingPowerUps, setIsFetchingPowerUps] = useState(false);
  const [activeSpeedBoost, setActiveSpeedBoost] = useState<{ expiresAt: number; playerIndex: number } | null>(null);
  const [activeShield, setActiveShield] = useState<{ playerIndex: number } | null>(null);
  const [activeMultiball, setActiveMultiball] = useState<{ expiresAt: number; playerIndex: number } | null>(null);
  const [powerUpMessage, setPowerUpMessage] = useState<string | null>(null);
  const [shieldMessage, setShieldMessage] = useState<string | null>(null);
  const [multiballMessage, setMultiballMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevGameDataRef = useRef<GameData | null>(null);
  const isMounted = useRef(false);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ballTrailRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);

  // Dialog hook
  const { dialogState, showAlert, showConfirm, handleConfirm, handleCancel } = useDialog();

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
  const delegatedByToken = useMemo(() => {
    const delegations = powerUpSummary?.delegations?.asRenter ?? [];
    const now = Date.now();
    return delegations.reduce<Record<number, number>>((acc, record) => {
      const tokenId = Number(record.tokenId ?? 0);
      const remaining = Number(record.remaining ?? 0);
      const expiresAt = record.expiresAt ? new Date(record.expiresAt).getTime() : null;

      if (
        record.status === 'active' &&
        remaining > 0 &&
        (!expiresAt || expiresAt > now)
      ) {
        acc[tokenId] = (acc[tokenId] || 0) + remaining;
      }
      return acc;
    }, {});
  }, [powerUpSummary]);

  const getChargeAvailability = useCallback((tokenId: number) => {
    const total = powerUpSummary?.balances?.[tokenId] ?? 0;
    const locked = powerUpSummary?.locked?.[tokenId] ?? 0;
    const owned = Math.max(total - locked, 0);
    const delegated = delegatedByToken[tokenId] || 0;
    return {
      owned,
      delegated,
      total: owned + delegated,
    };
  }, [powerUpSummary, delegatedByToken]);

  const speedAvailability = useMemo(() => getChargeAvailability(1), [getChargeAvailability]);
  const shieldAvailability = useMemo(() => getChargeAvailability(2), [getChargeAvailability]);
  const multiballAvailability = useMemo(() => getChargeAvailability(3), [getChargeAvailability]);

  useEffect(() => {
    gameDataRef.current = gameData;
  }, [gameData]);

  const playerIndex = useMemo(() => {
    return gameData.players.findIndex(p => p.name === username);
  }, [gameData.players, username]);
  const isPlayer1 = playerIndex === 0;
  const isPlayer2 = playerIndex === 1;
  const playerIndexRef = useRef<number>(-1);
  useEffect(() => {
    playerIndexRef.current = playerIndex;
  }, [playerIndex]);

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
    const paddleWidth = 12;
    const paddleHeight = height * 0.2;
    const paddleRadius = paddleWidth / 2;

    Object.values(gameData.paddles).forEach((paddle, index) => {
      const x = index === 0 ? paddleWidth : width - paddleWidth * 2;
      const y = (paddle.y + 1) * height / 2 - paddleHeight / 2;
      
      ctx.beginPath();
      ctx.roundRect(x, y, paddleWidth, paddleHeight, paddleRadius);
      ctx.fill();
    });

    const ballSize = width * 0.02;
    const ballsToDraw = [{ x: gameData.ballPos.x, y: gameData.ballPos.y }];
    if (gameData.extraBalls?.length) {
      ballsToDraw.push(...gameData.extraBalls);
    }

    const mainBallVelocity = Math.sqrt(
      (gameData.ballVelocity?.x || 0) ** 2 + (gameData.ballVelocity?.y || 0) ** 2
    );

    if (mainBallVelocity > 2.5) {
      const ballX = (gameData.ballPos.x + 1) * width / 2 - ballSize / 2;
      const ballY = (gameData.ballPos.y + 1) * height / 2 - ballSize / 2;
      const ballCenterX = ballX + ballSize / 2;
      const ballCenterY = ballY + ballSize / 2;
      ballTrailRef.current.push({ x: ballCenterX, y: ballCenterY, alpha: 0.6 });
      if (ballTrailRef.current.length > 8) {
        ballTrailRef.current.shift();
      }
    }

    ballTrailRef.current.forEach((trail, index) => {
      const alpha = trail.alpha * (index / ballTrailRef.current.length);
      ctx.fillStyle = `rgba(253, 208, 64, ${alpha})`;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, ballSize / 2, 0, Math.PI * 2);
      ctx.fill();
      trail.alpha *= 0.85;
    });

    ballTrailRef.current = ballTrailRef.current.filter(t => t.alpha > 0.1);

    ballsToDraw.forEach((ball, index) => {
      const ballX = (ball.x + 1) * width / 2 - ballSize / 2;
      const ballY = (ball.y + 1) * height / 2 - ballSize / 2;
      const ballCenterX = ballX + ballSize / 2;
      const ballCenterY = ballY + ballSize / 2;

      ctx.fillStyle = index === 0 ? 'rgb(253,208,64)' : 'rgba(253,208,64,0.7)';
      ctx.shadowColor = 'rgba(253, 208, 64, 0.8)';
      ctx.shadowBlur = index === 0 && mainBallVelocity > 3 ? 15 : 8;
      ctx.beginPath();
      ctx.arc(ballCenterX, ballCenterY, ballSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
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
    // Check if this is a staked game with no opponent (abandonment scenario)
    const hasOpponent = gameData.players.length > 1 && gameData.players[1]?.name;
    
    if (isStakedGame && !hasOpponent && isWaiting) {
      // This is abandonment, not forfeit
      showConfirm(
        'Leave the room? You can reclaim your stake from "Unclaimed Stakes".',
        () => {
          if (socketRef.current && roomCode) {
            
            // Use emit with callback to ensure backend received the event
            socketRef.current.emit('leaveAbandonedRoom', { roomCode }, (ack: any) => {
            });
            
            // Wait for backend to process before navigating (increased timeout)
            setTimeout(() => {
              soundManager.stopAll();
              navigate('/');
            }, 1000);
          } else {
            soundManager.stopAll();
            navigate('/');
          }
        },
        undefined,
        'Leave Room?'
      );
    } else {
      // Normal forfeit - opponent exists
      showConfirm(
        'Are you sure you want to forfeit? You will lose the game.',
        () => {
          if (socketRef.current) {
            socketRef.current.emit('forfeitGame');
          }
        },
        undefined,
        'Forfeit Game?'
      );
    }
  }, [isStakedGame, gameData.players, isWaiting, roomCode, navigate, showConfirm]);

  const handleRematchResponse = useCallback((accepted: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('rematchResponse', { accepted });
      setShowRematchRequest(false);
      setRematchRequester(null);
    }
  }, []);

  const handlePlayer2Stake = useCallback(async () => {
    if (!isConnected) {
      showAlert('Please connect your wallet first', 'Wallet Not Connected');
      return;
    }

    if (!stakingData) {
      showAlert('No staking data available', 'Error');
      return;
    }

    setStakingErrorMessage(null);
    setIsPlayer2Staking(true);

    try {
      await stakeAsPlayer2(stakingData.roomCode, stakingData.stakeAmount);
    } catch (error) {
      setIsPlayer2Staking(false);
    }
  }, [isConnected, stakingData, stakeAsPlayer2, showAlert]);

  const showInfoToast = useCallback((_title?: string, _message?: string) => {
    // Intentionally left blank to keep gameplay uninterrupted.
  }, []);

  const showSuccessToast = useCallback((_title?: string, _message?: string) => {
    // Intentionally left blank to keep gameplay uninterrupted.
  }, []);

  const handleActivateSpeedBoost = useCallback(() => {
    if (!socketRef.current || !roomCode) {
      setPowerUpMessage('Unable to activate power-up right now.');
      return;
    }

    const hasActiveBoost = activeSpeedBoost && activeSpeedBoost.expiresAt > Date.now();
    if (hasActiveBoost || speedAvailability.total <= 0 || isFetchingPowerUps) {
      return;
    }

    setPowerUpMessage(null);
    socketRef.current.emit('activatePowerUp', { roomCode, type: 'speed' }, (response: any) => {
      if (!response?.success) {
        const message = response?.error === 'POWERUP_NOT_SUPPORTED'
          ? 'This power-up is not supported yet.'
          : response?.error === 'POWERUP_SERVICE_NOT_READY'
            ? 'Power-up service is not ready. Please try again later.'
            : response?.error === 'FAILED_TO_APPLY_EFFECT'
              ? 'Could not apply the power-up effect.'
              : response?.error === 'INVALID_WALLET'
                ? 'Wallet not linked to this match.'
                : response?.error || 'Failed to activate power-up.';
        setPowerUpMessage(message);
      }
    });
  }, [roomCode, activeSpeedBoost, speedAvailability.total, isFetchingPowerUps]);

  const handleActivateShield = useCallback(() => {
    if (!socketRef.current || !roomCode) {
      setShieldMessage('Unable to activate power-up right now.');
      return;
    }

    const myShieldActive = activeShield && activeShield.playerIndex === playerIndex;
    if (myShieldActive || shieldAvailability.total <= 0 || isFetchingPowerUps) {
      return;
    }

    setShieldMessage(null);
    socketRef.current.emit('activatePowerUp', { roomCode, type: 'shield' }, (response: any) => {
      if (!response?.success) {
        const message = response?.error === 'SHIELD_ALREADY_ACTIVE'
          ? 'Shield already active.'
          : response?.error === 'POWERUP_SERVICE_NOT_READY'
            ? 'Power-up service is not ready. Please try again later.'
            : response?.error === 'INVALID_WALLET'
              ? 'Wallet not linked to this match.'
              : response?.error || 'Failed to activate shield.';
        setShieldMessage(message);
      }
    });
  }, [roomCode, activeShield, shieldAvailability.total, isFetchingPowerUps, playerIndex]);

  const handleActivateMultiball = useCallback(() => {
    if (!socketRef.current || !roomCode) {
      setMultiballMessage('Unable to activate power-up right now.');
      return;
    }

    const multiballActive = !!activeMultiball && activeMultiball.expiresAt > Date.now();
    if (multiballActive || multiballAvailability.total <= 0 || isFetchingPowerUps) {
      return;
    }

    setMultiballMessage(null);
    socketRef.current.emit('activatePowerUp', { roomCode, type: 'multiball' }, (response: any) => {
      if (!response?.success) {
        const message = response?.error === 'POWERUP_SERVICE_NOT_READY'
          ? 'Power-up service is not ready. Please try again later.'
          : response?.error === 'INVALID_WALLET'
            ? 'Wallet not linked to this match.'
            : response?.error === 'FAILED_TO_APPLY_EFFECT'
              ? 'Could not activate multiball.'
              : response?.error || 'Failed to activate multiball.';
        setMultiballMessage(message);
      }
    });
  }, [roomCode, activeMultiball, multiballAvailability.total, isFetchingPowerUps]);

  useEffect(() => {
    let mounted = true;

    const fetchSummary = async () => {
      if (!walletAddress) {
        setPowerUpSummary(null);
        return;
      }
      try {
        setIsFetchingPowerUps(true);
        const summary = await getPowerUpSummary(walletAddress);
        if (mounted) {
          setPowerUpSummary(summary);
        }
      } catch (error) {
        console.error('Failed to fetch power-up summary:', error);
      } finally {
        if (mounted) {
          setIsFetchingPowerUps(false);
        }
      }
    };

    fetchSummary();

    return () => {
      mounted = false;
    };
  }, [walletAddress]);

  // Handle successful Player2 staking transaction
  useEffect(() => {

    if (isPlayer2StakingSuccess && player2StakingTxHash && stakingData) {

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
        })
        .catch(err => {
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
      setIsPlayer2Staking(false);

      const parsedError = parseTransactionError(player2StakingError);
      setStakingErrorMessage(parsedError.message);
      showAlert(parsedError.message, 'Staking Error');
    }
  }, [player2StakingError, showAlert]);

  const setupSocket = useCallback(() => {
    if (!isMounted.current || !username) return;

    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket'],
      path: '/socket.io/',
      query: { 
        username,
        walletAddress: walletAddress || undefined
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {

      const playerData: Player = {
        name: username,
        rating: authenticatedPlayer?.rating || INITIAL_RATING,
        socketId: socket.id,
        walletAddress: walletAddress || undefined
      };

      if (gameMode === 'create' || gameMode === 'create-staked') {
        const specificRoomCode = locationState?.roomCode;
        // Track if this is a staked game for Player 1 (host)
        if (gameMode === 'create-staked') {
          setIsStakedGame(true);
        }
        socket.emit('createRoom', playerData, specificRoomCode);
      } else if (gameMode === 'join' && joinRoomCode) {
        socket.emit('joinRoom', { roomCode: joinRoomCode, player: playerData });
      } else {
        socket.emit('findRandomMatch', playerData);
      }
    });

    socket.on('roomCreated', (data: { roomCode: string }) => {
      setRoomCode(data.roomCode);
      setIsWaiting(true);
    });

    socket.on('waitingForOpponent', (data: { roomCode: string }) => {
      setRoomCode(data.roomCode);
      setIsWaiting(true);
    });

    socket.on('roomReady', (data: any) => {
      if (data?.room?.code) {
        setRoomCode(data.room.code);
      }
      setIsWaiting(true);
    });

    socket.on('stakedMatchJoined', (data: StakingData) => {
      setStakingData(data);
      setShowPlayer2StakingModal(true);
    });

    socket.on('waitingForPlayer2Stake', (data: any) => {
      if (data?.roomCode) {
        setRoomCode(data.roomCode);
      }
      setIsWaiting(true);
    });

    socket.on('powerUpSummary', (payload: { summary?: PowerUpSummary; source?: string; ownerWallet?: string } | PowerUpSummary) => {
      const summary = 'summary' in payload ? payload.summary : payload;
      if (summary) {
        setPowerUpSummary(summary);
      }

      if (typeof payload === 'object' && 'source' in payload) {
        if (payload.source === 'delegated') {
          const ownerLabel = payload.ownerWallet
            ? `${payload.ownerWallet.slice(0, 6)}...${payload.ownerWallet.slice(-4)}`
            : 'lender';
          setPowerUpMessage(`Borrowed boost consumed (from ${ownerLabel})`);
        } else if (payload.source === 'owned') {
          setPowerUpMessage(null);
        }

        if (payload.source !== 'owner-update') {
          setShieldMessage(null);
          setMultiballMessage(null);
        }
      } else {
        setPowerUpMessage(null);
        setShieldMessage(null);
        setMultiballMessage(null);
      }
    });

    socket.on('powerUpActivated', (payload: { type: string; playerIndex: number; playerName: string; durationMs?: number }) => {
      if (!payload) return;
      if (payload.type === 'speed') {
        const expiresAt = Date.now() + (payload.durationMs || 0);
        setActiveSpeedBoost({ expiresAt, playerIndex: payload.playerIndex });
        setPowerUpMessage(null);
        return;
      }
      if (payload.type === 'shield') {
        setActiveShield({ playerIndex: payload.playerIndex });
        setShieldMessage(null);
        return;
      }
      if (payload.type === 'multiball') {
        const expiresAt = payload.durationMs ? Date.now() + payload.durationMs : Date.now() + 12000;
        setActiveMultiball({ expiresAt, playerIndex: payload.playerIndex });
        const ownerName = gameDataRef.current?.players?.[payload.playerIndex]?.name || 'Player';
        const isMine = payload.playerIndex === playerIndexRef.current;
        setMultiballMessage(isMine ? 'Multiball unleashed!' : `${ownerName} unleashed multiball!`);
        return;
      }
    });

    socket.on('powerUpExpired', (payload: { type: string; playerIndex: number }) => {
      if (!payload || payload.type !== 'speed') return;
      setActiveSpeedBoost(null);
      setPowerUpMessage(null);
    });

    socket.on('powerUpEvent', (event: { type: string; playerIndex: number }) => {
      if (!event) return;
      if (event.type === 'shield-block') {
        setActiveShield(prev => (prev && prev.playerIndex === event.playerIndex ? null : prev));
        const currentGame = gameDataRef.current;
        const isMine = event.playerIndex === playerIndexRef.current;
        const name = currentGame?.players?.[event.playerIndex]?.name || 'Opponent';
        setShieldMessage(isMine ? 'Guardian Shield absorbed the shot!' : `${name}'s shield absorbed the shot!`);
        return;
      }
      if (event.type === 'multiball-spawn') {
        const currentGame = gameDataRef.current;
        const name = currentGame?.players?.[event.playerIndex ?? -1]?.name || 'Player';
        const isMine = event.playerIndex === playerIndexRef.current;
        setMultiballMessage(isMine ? 'Multiball active!' : `${name} triggered Multiball!`);
        return;
      }
      if (event.type === 'multiball-end') {
        setActiveMultiball(null);
        const currentGame = gameDataRef.current;
        const name = typeof event.playerIndex === 'number'
          ? currentGame?.players?.[event.playerIndex]?.name || 'Player'
          : 'A player';
        if (typeof event.playerIndex === 'number') {
          const isMine = event.playerIndex === playerIndexRef.current;
          setMultiballMessage(isMine ? 'Your multiball ended' : `${name}'s multiball ended`);
        } else {
          setMultiballMessage('Multiball ended');
        }
      }
    });

    socket.on('gameStart', (data: GameData & { roomCode?: string }) => {
      setIsWaiting(false);
      setActiveSpeedBoost(null);
      setActiveShield(null);
      setPowerUpMessage(null);
      setShieldMessage(null);
      if (data?.roomCode) {
        setRoomCode(prev => prev || data.roomCode || null);
      }
    const normalizedExtras = (data.extraBalls ?? []).map((ball: any) =>
      typeof ball?.x === 'number' && typeof ball?.y === 'number'
        ? { x: ball.x, y: ball.y }
        : {
            x: typeof ball?.pos?.x === 'number' ? ball.pos.x : 0,
            y: typeof ball?.pos?.y === 'number' ? ball.pos.y : 0,
          }
    );
    const next = { ...data, extraBalls: normalizedExtras };
      setGameData(next);
      gameDataRef.current = next;
      prevGameDataRef.current = next;
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

      const normalizedExtras = (data.extraBalls ?? []).map((ball: any) =>
        typeof ball?.x === 'number' && typeof ball?.y === 'number'
          ? { x: ball.x, y: ball.y }
          : {
              x: typeof ball?.pos?.x === 'number' ? ball.pos.x : 0,
              y: typeof ball?.pos?.y === 'number' ? ball.pos.y : 0,
            }
      );
      const next = { ...data, extraBalls: normalizedExtras };
      gameDataRef.current = next;
      setGameData(next);
      prevGameDataRef.current = next;
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

      setActiveSpeedBoost(null);
      setActiveShield(null);
      setPowerUpMessage(null);
      setShieldMessage(null);

      // Don't disconnect socket on game over - keep it alive for rematch
      // The GameOver component will create its own socket for game-over state
      
      // Set flag to prevent socket disconnection on unmount
      isNavigatingToGameOver.current = true;

      navigate('/game-over', {
        state: {
          ...result,
          isWinner,
          playerName: username, // Pass username for GameOver socket connection
          message: isWinner ? 'You Won!' : 'You Lost!',
          rating: result.ratings?.[socket.id],
          finalScore: result.finalScore || result.stats?.score,
          roomCode: result.roomCode // Pass roomCode for cleanup later
        }
      });
    });

    socket.on('gamePaused', (data: { pausedBy: string; pausesRemaining: number }) => {
      setIsPaused(true);
      setPausedBy(data.pausedBy);

      if (data.pausedBy === username) {
        setPausesRemaining(data.pausesRemaining);
        showSuccessToast('Pause used', `No more pauses remaining.`);
      } else {
        setOpponentPausesRemaining(data.pausesRemaining);
        showInfoToast(`${data.pausedBy} paused`, `${data.pausedBy} has no more pauses.`);
      }

      setPauseCountdown(10);
    });

    socket.on('gameResumed', () => {
      setIsPaused(false);
      setPausedBy(null);
      setPauseCountdown(null);
    });

    socket.on('playerForfeited', (data: { forfeitedPlayer: string; winner: string }) => {
      if (data.forfeitedPlayer !== username) {
        showAlert(
          `${data.forfeitedPlayer} forfeited. ${data.winner} wins!`,
          'Game Over'
        );
        soundManager.stopAll();
        setTimeout(() => navigate('/'), 2000);
      }
    });

    socket.on('playerForfeitedSelf', () => {
      showInfoToast('You forfeited', 'Returning to home.');
      soundManager.stopAll();
      setTimeout(() => navigate('/'), 500);
    });

    socket.on('rematchRequested', (data: { from: string }) => {
      setShowRematchRequest(true);
      setRematchRequester(data.from);
    });

    socket.on('rematchDeclined', () => {
      showAlert('Rematch declined', 'Rematch');
      setTimeout(() => navigate('/'), 2000);
    });

    socket.on('opponentLeft', () => {
      showAlert('Opponent left the game', 'Opponent Left');
      setTimeout(() => navigate('/'), 2000);
    });

    socket.on('opponentDisconnected', (data: { disconnectedPlayer?: string; winner?: string }) => {
      soundManager.stopAll();
      if (data && data.winner) {
        showAlert(
          `${data.disconnectedPlayer} disconnected. ${data.winner} wins!`,
          'Opponent Disconnected'
        );
      } else {
        showAlert('Opponent disconnected', 'Opponent Disconnected');
      }
      setTimeout(() => navigate('/'), 2000);
    });

    socket.on('abandonmentProcessed', (data: { message: string }) => {
      // Room has been marked as abandoned, refund will be available
    });

    socket.on('error', (error: { message: string }) => {
      showAlert(error.message, 'Error');
    });

    return () => {
      // Don't disconnect if navigating to game-over screen (keep socket alive for rematch)
      if (isNavigatingToGameOver.current) {
        socket.removeAllListeners(); // Still remove listeners to prevent memory leaks
        return;
      }
      
      // Normal cleanup for other navigation (back to home, etc.)
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [username, gameMode, joinRoomCode, navigate, locationState?.roomCode, walletAddress, authenticatedPlayer?.rating, showAlert, showInfoToast, showSuccessToast]);

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
  }, [setupSocket, username, navigate, showAlert]);

  // Pause countdown timer
  useEffect(() => {
    if (pauseCountdown === null) return;

    if (pauseCountdown <= 0) {
      setPauseCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setPauseCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [pauseCountdown]);

  useEffect(() => {
    if (!activeSpeedBoost) return;
    const remaining = activeSpeedBoost.expiresAt - Date.now();
    if (remaining <= 0) {
      setActiveSpeedBoost(null);
      return;
    }
    const timeout = setTimeout(() => {
      setActiveSpeedBoost(null);
    }, remaining);
    return () => clearTimeout(timeout);
  }, [activeSpeedBoost]);

  useEffect(() => {
    if (!activeMultiball) return;
    const remaining = activeMultiball.expiresAt - Date.now();
    if (remaining <= 0) {
      setActiveMultiball(null);
      return;
    }
    const timeout = setTimeout(() => {
      setActiveMultiball(null);
    }, remaining);
    return () => clearTimeout(timeout);
  }, [activeMultiball]);

  useEffect(() => {
    if (!shieldMessage) return;
    const timeout = setTimeout(() => {
      setShieldMessage(null);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [shieldMessage]);

  useEffect(() => {
    if (!multiballMessage) return;
    const timeout = setTimeout(() => {
      setMultiballMessage(null);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [multiballMessage]);

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
    // Check if this is a staked game with no opponent (abandonment scenario)
    const hasOpponent = gameData.players.length > 1 && gameData.players[1]?.name;
    
    
    if (isStakedGame && !hasOpponent && isWaiting) {
      // This is abandonment, not forfeit
      showConfirm(
        'Leave the room? You can reclaim your stake from "Unclaimed Stakes".',
        () => {
          if (socketRef.current && roomCode) {
            
            // Use emit with callback to ensure backend received the event
            socketRef.current.emit('leaveAbandonedRoom', { roomCode }, (ack: any) => {
            });
            
            // Wait for backend to process before navigating (increased timeout)
            setTimeout(() => {
              soundManager.stopAll();
              navigate('/');
            }, 1000);
          } else {
            soundManager.stopAll();
            navigate('/');
          }
        },
        undefined,
        'Leave Room?'
      );
    } else {
      // Normal forfeit - opponent exists or not staked
      showConfirm(
        'Are you sure you want to leave? You will forfeit the game.',
        () => {
          if (socketRef.current) {
            socketRef.current.emit('forfeitGame');
          }
          soundManager.stopAll();
          navigate('/');
        },
        undefined,
        'Leave Game?'
      );
    }
  }, [isStakedGame, gameData.players, isWaiting, roomCode, navigate, showConfirm]);

  const speedBoostMeta = POWER_UP_METADATA[1];
  const shieldMeta = POWER_UP_METADATA[2];
  const multiballMeta = POWER_UP_METADATA[3];
  const boostActive = activeSpeedBoost && activeSpeedBoost.expiresAt > Date.now();
  const isMySpeedBoostActive = boostActive && activeSpeedBoost?.playerIndex === playerIndex;
  const opponentSpeedBoostActive = boostActive && activeSpeedBoost?.playerIndex !== playerIndex;
  const speedBoostCountdown = boostActive ? Math.max(0, Math.ceil((activeSpeedBoost!.expiresAt - Date.now()) / 1000)) : 0;
  const activeSpeedOwnerName = boostActive ? gameData.players[activeSpeedBoost!.playerIndex]?.name : null;

  return (
    <div className="game-container" ref={containerRef} style={{ touchAction: 'none' }}>
      <AddressDisplay />
      <button onClick={handleLeaveGame} className="back-button" aria-label="Leave game">
        ← Back
      </button>
      
      {/* Paddle indicators */}
      {!isWaiting && (isPlayer1 || isPlayer2) && (
        <>
          <div className={`paddle-indicator left ${isPlayer1 ? 'active' : ''}`}>
            {isPlayer1 && '← You'}
          </div>
          <div className={`paddle-indicator right ${isPlayer2 ? 'active' : ''}`}>
            {isPlayer2 && 'You →'}
          </div>
        </>
      )}

      <div className="player-names">
        <span>{gameData.players[0]?.name || 'Player 1'}</span>
        <span>{gameData.players[1]?.name || 'Player 2'}</span>
      </div>

      <div className="score-board">
        <span>{gameData.score[0]}</span>
        <span>{gameData.score[1]}</span>
      </div>

      {roomCode && (
        <div className="room-info">
          <span className="room-code-display">Room: {roomCode}</span>
        </div>
      )}

      <div className="powerup-bar">
        <div className="powerup-buttons">
          <button
            className="powerup-btn"
            onClick={handleActivateSpeedBoost}
            disabled={speedAvailability.total <= 0 || boostActive || isFetchingPowerUps}
          >
            {`⚡ ${speedBoostMeta.name} (${speedAvailability.total})`}
          </button>
          <button
            className="powerup-btn"
            onClick={handleActivateShield}
            disabled={shieldAvailability.total <= 0 || (activeShield && activeShield.playerIndex === playerIndex) || isFetchingPowerUps}
          >
            {`🛡 ${shieldMeta.name} (${shieldAvailability.total})`}
          </button>
          <button
            className="powerup-btn"
            onClick={handleActivateMultiball}
            disabled={multiballAvailability.total <= 0 || (activeMultiball && activeMultiball.expiresAt > Date.now()) || isFetchingPowerUps}
          >
            {`💥 ${multiballMeta.name} (${multiballAvailability.total})`}
          </button>
        </div>
        <div className="powerup-status-line">
          {isFetchingPowerUps && (
            <span className="powerup-status info">Updating inventory…</span>
          )}
          {isMySpeedBoostActive && (
            <span className="powerup-status active">
              {speedBoostMeta.name} active · {speedBoostCountdown}s
            </span>
          )}
          {!isMySpeedBoostActive && opponentSpeedBoostActive && (
            <span className="powerup-status opponent">
              {activeSpeedOwnerName || 'Opponent'} activated {speedBoostMeta.name}!
            </span>
          )}
          {activeShield && activeShield.playerIndex === playerIndex && (
            <span className="powerup-status active">Guardian Shield armed</span>
          )}
          {activeShield && activeShield.playerIndex !== playerIndex && (
            <span className="powerup-status opponent">
              {(gameData.players[activeShield.playerIndex]?.name || 'Opponent')} armed Guardian Shield
            </span>
          )}
          {activeMultiball && activeMultiball.playerIndex === playerIndex && (
            <span className="powerup-status active">Multiball active</span>
          )}
          {activeMultiball && activeMultiball.playerIndex !== playerIndex && (
            <span className="powerup-status opponent">
              {(gameData.players[activeMultiball.playerIndex]?.name || 'Opponent')} active Multiball
            </span>
          )}
          {speedAvailability.delegated > 0 && (
            <span className="powerup-status info">Borrowed ⚡: {speedAvailability.delegated}</span>
          )}
          {shieldAvailability.delegated > 0 && (
            <span className="powerup-status info">Borrowed 🛡: {shieldAvailability.delegated}</span>
          )}
          {multiballAvailability.delegated > 0 && (
            <span className="powerup-status info">Borrowed 💥: {multiballAvailability.delegated}</span>
          )}
          {!boostActive && powerUpMessage && (
            <span className="powerup-status opponent">{powerUpMessage}</span>
          )}
          {shieldMessage && (
            <span className="powerup-status info">{shieldMessage}</span>
          )}
          {multiballMessage && (
            <span className="powerup-status info">{multiballMessage}</span>
          )}
        </div>
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
          <div className="pause-modal">
            <h2>Game Paused</h2>
            <p>
              {pausedBy === username ? 'You' : pausedBy} paused the game.
            </p>
            <div className="pause-status">
              <span>💠 You: {pausesRemaining} pause{pausesRemaining !== 1 ? 's' : ''} left</span>
              <span>💠 Opponent: {opponentPausesRemaining} pause{opponentPausesRemaining !== 1 ? 's' : ''} left</span>
            </div>
            <p>
              Resuming in {pauseCountdown ?? 0} second{(pauseCountdown ?? 0) !== 1 ? 's' : ''}...
            </p>
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

      <Dialog
        dialogState={dialogState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default MultiplayerGame;

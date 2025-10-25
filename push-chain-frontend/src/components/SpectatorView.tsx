import { useEffect, useRef, useState, useCallback, FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import '../styles/Game.css';
import { BACKEND_URL } from '../constants';
import { useDialog } from '../hooks/useDialog';
import Dialog from './Dialog';

interface Player {
  name: string
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

interface LocationState {
  roomCode?: string
  spectatorName?: string
}

const SpectatorView: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Dialog hook
  const { dialogState, showAlert, handleConfirm, handleCancel } = useDialog();
  
  const [gameData, setGameData] = useState<GameData>({
    score: [0, 0],
    ballPos: { x: 0, y: 0 },
    paddles: {
      player1: { y: 0 },
      player2: { y: 0 }
    },
    players: [],
    extraBalls: []
  });
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMounted = useRef(false);
  const ballTrailRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);

  const { roomCode, spectatorName } = (location.state as LocationState) || {};

  const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!isConnected) {
      ctx.font = '24px "Press Start 2P"';
      ctx.fillStyle = 'rgb(116,113,203)';
      ctx.textAlign = 'center';
      ctx.fillText('Connecting to game...', ctx.canvas.width / 2, ctx.canvas.height / 2);
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
    const balls = [{ x: gameData.ballPos.x, y: gameData.ballPos.y }];
    if (gameData.extraBalls?.length) {
      balls.push(...gameData.extraBalls);
    }

    const ballSpeed = Math.sqrt(
      (gameData.ballVelocity?.x || 0) ** 2 + (gameData.ballVelocity?.y || 0) ** 2
    );

    if (ballSpeed > 2.5) {
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

    balls.forEach((ball, idx) => {
      const ballX = (ball.x + 1) * width / 2 - ballSize / 2;
      const ballY = (ball.y + 1) * height / 2 - ballSize / 2;
      const ballCenterX = ballX + ballSize / 2;
      const ballCenterY = ballY + ballSize / 2;

      ctx.fillStyle = idx === 0 ? 'rgb(253,208,64)' : 'rgba(253,208,64,0.7)';
      ctx.shadowColor = 'rgba(253, 208, 64, 0.8)';
      ctx.shadowBlur = idx === 0 && ballSpeed > 3 ? 15 : 8;
      ctx.beginPath();
      ctx.arc(ballCenterX, ballCenterY, ballSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [gameData, isConnected]);

  const handleLeaveSpectate = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leaveSpectate');
      socketRef.current.disconnect();
    }
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    isMounted.current = true;

    if (!roomCode || !spectatorName) {
      navigate('/');
      return;
    }

    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket'],
      path: '/socket.io/'
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('spectateGame', { roomCode, spectatorName });
    });

    socket.on('spectateStart', (data: GameData) => {
      setIsConnected(true);
      const extras = (data.extraBalls ?? []).map((ball: any) =>
        typeof ball?.x === 'number' && typeof ball?.y === 'number'
          ? { x: ball.x, y: ball.y }
          : {
              x: typeof ball?.pos?.x === 'number' ? ball.pos.x : 0,
              y: typeof ball?.pos?.y === 'number' ? ball.pos.y : 0,
            }
      );
      setGameData({ ...data, extraBalls: extras });
    });

    socket.on('gameUpdate', (data: GameData) => {
      const extras = (data.extraBalls ?? []).map((ball: any) =>
        typeof ball?.x === 'number' && typeof ball?.y === 'number'
          ? { x: ball.x, y: ball.y }
          : {
              x: typeof ball?.pos?.x === 'number' ? ball.pos.x : 0,
              y: typeof ball?.pos?.y === 'number' ? ball.pos.y : 0,
            }
      );
      setGameData({ ...data, extraBalls: extras });
    });

    socket.on('spectatorUpdate', (data: { count: number }) => {
      setSpectatorCount(data.count);
    });

    socket.on('gameOver', (result: any) => {
      showAlert('Game has ended!', 'Game Over');
      setTimeout(() => navigate('/'), 2000);
    });

    socket.on('error', (error: { message: string }) => {
      showAlert(error.message, 'Error');
      setTimeout(() => navigate('/'), 2000);
    });

    return () => {
      isMounted.current = false;
      if (socketRef.current) {
        socketRef.current.emit('leaveSpectate');
        socketRef.current.disconnect();
      }
    };
  }, [roomCode, spectatorName, navigate, showAlert]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    let animationId: number;
    const gameLoop = () => {
      drawGame(ctx);
      animationId = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, [drawGame]);

  return (
    <div className="game-container spectator-mode">
      <div className="spectator-header">
        <div className="spectator-badge">
          <span>👁 SPECTATING</span>
          <span className="spectator-count-badge">{spectatorCount} watching</span>
        </div>
        <button onClick={handleLeaveSpectate} className="leave-spectate-btn">
          Leave
        </button>
      </div>

      <div className="player-names">
        <span>{gameData.players[0]?.name || 'Player 1'}</span>
        <span>{gameData.players[1]?.name || 'Player 2'}</span>
      </div>

      <div className="score-board">
        <span>{gameData.score[0]}</span>
        <span>{gameData.score[1]}</span>
      </div>

      <canvas ref={canvasRef} />

      <Dialog
        dialogState={dialogState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default SpectatorView;

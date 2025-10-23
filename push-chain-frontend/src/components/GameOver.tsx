import { useEffect, useRef, useState, FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { STORAGE_KEY, BACKEND_URL } from '../constants';
import '../styles/GameOver.css';
import { useDialog } from '../hooks/useDialog';
import Dialog from './Dialog';

interface GameOverResult {
  message: string
  finalScore: [number, number]
  rating: number
  isWinner?: boolean
  isStaked?: boolean
  stakeAmount?: string
  roomCode?: string
  stats: {
    duration?: number
    hits?: number
  }
}

interface LocationState {
  result?: GameOverResult
}

const GameOver: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = (location.state as any) as GameOverResult | undefined;
  const socketRef = useRef<Socket | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  
  // Dialog hook
  const { dialogState, showAlert, handleConfirm, handleCancel } = useDialog();

  useEffect(() => {
    if (!result) {
      navigate('/');
      return;
    }

    const username = localStorage.getItem(STORAGE_KEY);
    if (!username) {
      navigate('/');
      return;
    }

    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket'],
      path: '/socket.io/',
      query: { username }
    });

    socketRef.current = socket;

    // Wait for connection before joining game-over room
    socket.on('connect', () => {
      console.log(`✅ Socket connected: ${socket.id}`);
      console.log(`🎮 Joining game-over room as ${username}`);
      socket.emit('joinGameOverRoom', { username });
    });

    socket.on('rematchRequested', (data: any) => {
      console.log('📨 ✅ RECEIVED rematch request from:', data?.from || 'unknown');
      console.log('📨 Full data:', data);
      setRematchRequested(true);
    });

    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      if (error.message && error.message.includes('rematch')) {
        showAlert(error.message, 'Rematch Error');
      }
    });

    socket.on('gameStart', (data: any) => {
      navigate('/game', {
        state: {
          gameMode: 'rematch',
          rematch: true
        }
      });
    });

    socket.on('rematchDeclined', () => {
      showAlert('Opponent declined rematch', 'Rematch Declined');
      setWaitingForResponse(false);
      setRematchRequested(false);
    });

    return () => {
      socket.emit('leaveGameOver');
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [result, navigate, showAlert]);

  if (!result) {
    return null;
  }

  const handleRematch = () => {
    console.log('🔄 Sending rematch request...');
    if (socketRef.current) {
      console.log(`📤 Emitting requestRematch via socket ${socketRef.current.id}`);
      socketRef.current.emit('requestRematch');
      setWaitingForResponse(true);
    } else {
      console.error('❌ No socket ref available for rematch request');
    }
  };

  const handleAcceptRematch = () => {
    if (socketRef.current) {
      socketRef.current.emit('rematchResponse', { accepted: true });
    }
  };

  const handleDeclineRematch = () => {
    if (socketRef.current) {
      socketRef.current.emit('rematchResponse', { accepted: false });
      setRematchRequested(false);
    }
  };

  const handleGoHome = () => {
    if (socketRef.current) {
      socketRef.current.emit('leaveGameOver');
      socketRef.current.emit('leaveRoom');
      socketRef.current.disconnect();
    }
    navigate('/');
  };

  const handleClaimPrize = () => {
    navigate('/my-wins');
  };

  const handleNewStakedMatch = () => {
    navigate('/');
    // Could add a state parameter to pre-select staked match mode
  };

  const isStaked = result.isStaked || false;
  const isWinner = result.isWinner || false;

  return (
    <div className="game-over">
      <h1>{result.message}</h1>
      <div className="stats">
        <p>Final Score: {result.finalScore[0]} - {result.finalScore[1]}</p>
        <p>New Rating: {result.rating}</p>
        <p>Game Duration: {Math.round((result.stats.duration || 0) / 1000)}s</p>
        <p>Total Hits: {result.stats.hits || 0}</p>
        {isStaked && result.stakeAmount && (
          <p className="prize-info">Prize: {result.stakeAmount} PC 💰</p>
        )}
      </div>

      {isStaked && (
        <div className="staked-info-banner">
          <span>🎲 Staked Match Complete</span>
          <p>Rematch unavailable for staked games. {isWinner ? 'Claim your prize' : 'Start a new match'} to play again!</p>
        </div>
      )}

      {rematchRequested && !isStaked && (
        <div className="rematch-request">
          <p>Opponent wants a rematch!</p>
          <div className="button-group">
            <button onClick={handleAcceptRematch} className="accept-btn">
              Accept Rematch
            </button>
            <button onClick={handleDeclineRematch} className="decline-btn">
              Decline
            </button>
          </div>
        </div>
      )}

      {!rematchRequested && (
        <div className="button-group">
          {isStaked ? (
            // Staked game buttons
            <>
              {isWinner && (
                <button onClick={handleClaimPrize} className="claim-btn">
                  💰 Claim Prize
                </button>
              )}
              <button onClick={handleGoHome} className="home-btn">
                Back to Home
              </button>
            </>
          ) : (
            // Unstaked game buttons
            <>
              <button
                onClick={handleRematch}
                disabled={waitingForResponse}
                className="rematch-btn"
              >
                {waitingForResponse ? 'Waiting for opponent...' : 'Request Rematch'}
              </button>
              <button onClick={handleGoHome} className="home-btn">
                Back to Home
              </button>
            </>
          )}
        </div>
      )}

      <Dialog
        dialogState={dialogState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default GameOver;

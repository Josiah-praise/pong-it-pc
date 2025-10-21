import { useEffect, useRef, useState, FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { STORAGE_KEY, BACKEND_URL } from '../constants';
import '../styles/GameOver.css';

interface GameOverResult {
  message: string
  finalScore: [number, number]
  rating: number
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

    socket.on('rematchRequested', (data: any) => {
      setRematchRequested(true);
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
      alert('Opponent declined rematch');
      setWaitingForResponse(false);
      setRematchRequested(false);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [result, navigate]);

  if (!result) {
    return null;
  }

  const handleRematch = () => {
    if (socketRef.current) {
      socketRef.current.emit('requestRematch');
      setWaitingForResponse(true);
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
      socketRef.current.emit('leaveRoom');
      socketRef.current.disconnect();
    }
    navigate('/');
  };

  return (
    <div className="game-over">
      <h1>{result.message}</h1>
      <div className="stats">
        <p>Final Score: {result.finalScore[0]} - {result.finalScore[1]}</p>
        <p>New Rating: {result.rating}</p>
        <p>Game Duration: {Math.round((result.stats.duration || 0) / 1000)}s</p>
        <p>Total Hits: {result.stats.hits || 0}</p>
      </div>

      {rematchRequested && (
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
        </div>
      )}
    </div>
  );
};

export default GameOver;

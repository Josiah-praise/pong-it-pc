import { useState, useEffect, useCallback, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../constants';
import AddressDisplay from './AddressDisplay';
import '../styles/GameHistory.css';

interface GameHistoryProps {
  savedUsername: string | null
}

interface Game {
  _id: string
  roomCode: string
  result: 'win' | 'loss' | 'draw'
  opponent?: string
  finalScore: string
  endedAt?: string
  isStaked: boolean
  stakeAmount?: string
  claimed?: boolean
}

interface Stats {
  totalGames: number
  wins: number
  losses: number
  winRate: number
  stakedGames: number
  totalEarnings: string
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const GameHistory: FC<GameHistoryProps> = ({ savedUsername }) => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [stakedFilter, setStakedFilter] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ 
    total: 0, 
    limit: 50, 
    offset: 0, 
    hasMore: false 
  });

  // Fetch game history
  const fetchGameHistory = useCallback(async () => {
    if (!savedUsername) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        filter: activeFilter,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });

      if (stakedFilter !== null) {
        params.append('staked', stakedFilter);
      }

      const response = await fetch(
        `${BACKEND_URL}/games/player/${savedUsername}/history?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch game history: ${response.status}`);
      }

      const data = await response.json();
      setGames(data.games);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching game history:', err);
      setError('Failed to load game history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [savedUsername, activeFilter, stakedFilter, pagination.limit, pagination.offset]);

  useEffect(() => {
    if (savedUsername) {
      fetchGameHistory();
    } else {
      setLoading(false);
    }
  }, [savedUsername, fetchGameHistory]);

  const handleFilterChange = (filter: 'all' | 'wins' | 'losses') => {
    setActiveFilter(filter);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleStakedFilterChange = (value: string | null) => {
    setStakedFilter(value);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatEarnings = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    
    // For very small numbers, use toPrecision(4) for 4 significant figures
    if (num < 1) {
      return parseFloat(num.toPrecision(4)).toString();
    }
    
    // For larger numbers, round to 4 decimal places
    return num.toFixed(4);
  };

  if (!savedUsername) {
    return (
      <div className="game-history-container">
        <div className="game-history-header">
          <button onClick={() => navigate('/')} className="back-button">← Back</button>
          <h1>Game History</h1>
        </div>
        <div className="no-username-prompt">
          <p>Please set your username to view game history</p>
          <button onClick={() => navigate('/')} className="go-home-button">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-history-container">
      <AddressDisplay />
      <div className="game-history-header">
        <button onClick={() => navigate('/')} className="back-button">← Back</button>
        <h1>Game History</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-section">
          <div className="stat-card">
            <span className="stat-label">Total Games</span>
            <span className="stat-value">{stats.totalGames}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Record</span>
            <span className="stat-value">{stats.wins}W - {stats.losses}L</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{stats.winRate}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Staked</span>
            <span className="stat-value">{stats.stakedGames}</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-label">Earnings</span>
            <span className="stat-value">{formatEarnings(stats.totalEarnings)} PC</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <span className="filter-group-label">Result:</span>
          <button
            className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${activeFilter === 'wins' ? 'active' : ''}`}
            onClick={() => handleFilterChange('wins')}
          >
            Wins
          </button>
          <button
            className={`filter-button ${activeFilter === 'losses' ? 'active' : ''}`}
            onClick={() => handleFilterChange('losses')}
          >
            Losses
          </button>
        </div>

        <div className="filter-group">
          <span className="filter-group-label">Type:</span>
          <button
            className={`filter-button ${stakedFilter === null ? 'active' : ''}`}
            onClick={() => handleStakedFilterChange(null)}
          >
            All
          </button>
          <button
            className={`filter-button ${stakedFilter === 'true' ? 'active' : ''}`}
            onClick={() => handleStakedFilterChange('true')}
          >
            Staked
          </button>
          <button
            className={`filter-button ${stakedFilter === 'false' ? 'active' : ''}`}
            onClick={() => handleStakedFilterChange('false')}
          >
            Casual
          </button>
        </div>
      </div>

      {/* Game List */}
      <div className="games-content">
        {loading && pagination.offset === 0 ? (
          <div className="loading">Loading game history...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : games.length === 0 ? (
          <div className="no-games">
            <p>No games found!</p>
            <p>Start playing to build your history</p>
            <button onClick={() => navigate('/')} className="play-button">
              Play Now
            </button>
          </div>
        ) : (
          <>
            <div className="games-list">
              {games.map((game) => (
                <div key={game._id} className={`game-card ${game.result}`}>
                  <div className="game-header">
                    <div className="game-header-left">
                      <span className="room-code">Room: {game.roomCode}</span>
                      {game.isStaked && (
                        <span className="stake-badge">💎 {game.stakeAmount} PC</span>
                      )}
                    </div>
                    <span className={`result-badge ${game.result}`}>
                      {game.result === 'win' ? '✅ Win' : game.result === 'loss' ? '❌ Loss' : '⚖️ Draw'}
                    </span>
                  </div>

                  <div className="game-details">
                    <div className="detail-row">
                      <span className="detail-label">Opponent:</span>
                      <span className="detail-value">{game.opponent || 'Unknown'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Final Score:</span>
                      <span className="detail-value score">{game.finalScore}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Played At:</span>
                      <span className="detail-value date">{formatDate(game.endedAt)}</span>
                    </div>

                    {game.isStaked && (
                      <div className="detail-row">
                        <span className="detail-label">Prize Status:</span>
                        <span className={`detail-value ${game.claimed ? 'claimed' : 'unclaimed'}`}>
                          {game.claimed ? 'Claimed ✓' : 'Available 💰'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pagination.hasMore && (
              <div className="load-more-section">
                <button
                  onClick={loadMore}
                  className="load-more-button"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
                <p className="pagination-info">
                  Showing {Math.min(pagination.offset + games.length, pagination.total)} of {pagination.total} games
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GameHistory;

import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Welcome from './components/Welcome'
import MultiplayerGame from './components/MultiplayerGame'
import SpectatorView from './components/SpectatorView'
import GameOver from './components/GameOver'
import MyWins from './components/MyWins'
import GameHistory from './components/GameHistory'
import UnclaimedStakes from './components/UnclaimedStakes'
import './styles/App.css'
import { STORAGE_KEY } from './constants'

interface Player {
  name: string
  rating: number
}

interface GameState {
  player1: Player | null
  player2: Player | null
  gameMode: string | null
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    player1: null,
    player2: null,
    gameMode: null,
  })

  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY) || null
  })

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername)
    localStorage.setItem(STORAGE_KEY, newUsername)
    setGameState(prev => ({
      ...prev,
      player1: {
        name: newUsername,
        rating: 800
      }
    }))
  }

  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={
            <Welcome
              setGameState={setGameState}
              savedUsername={username}
              onUsernameSet={handleUsernameSet}
            />
          }
        />
        <Route
          path="/game"
          element={
            <MultiplayerGame
              username={username}
            />
          }
        />
        <Route
          path="/spectate"
          element={<SpectatorView />}
        />
        <Route
          path="/game-over"
          element={
            <GameOver
              savedUsername={username}
              onPlayAgain={() => {
                setGameState(prev => ({
                  ...prev,
                  player1: {
                    name: username || 'Guest',
                    rating: 800
                  }
                }))
              }}
            />
          }
        />
        <Route
          path="/my-wins"
          element={<MyWins />}
        />
        <Route
          path="/game-history"
          element={<GameHistory savedUsername={username} />}
        />
        <Route
          path="/unclaimed-stakes"
          element={<UnclaimedStakes />}
        />
      </Routes>
    </div>
  )
}

export default App
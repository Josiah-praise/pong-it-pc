import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { usePushWalletContext, usePushChainClient } from '@pushchain/ui-kit'
import Welcome from './components/Welcome'
import MultiplayerGame from './components/MultiplayerGame'
import SpectatorView from './components/SpectatorView'
import GameOver from './components/GameOver'
import MyWins from './components/MyWins'
import GameHistory from './components/GameHistory'
import UnclaimedStakes from './components/UnclaimedStakes'
import './styles/App.css'
import { STORAGE_KEY } from './constants'
import { authenticatePlayer, type Player as AuthPlayer } from './services/authService'

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
  const { connectionStatus, universalAccount } = usePushWalletContext()
  const { pushChainClient } = usePushChainClient()
  const isConnected = connectionStatus === 'connected'

  const [gameState, setGameState] = useState<GameState>({
    player1: null,
    player2: null,
    gameMode: null,
  })

  const [username, setUsername] = useState<string | null>(null)
  const [authenticatedPlayer, setAuthenticatedPlayer] = useState<AuthPlayer | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Get wallet address (UEA for cross-chain, EOA for native)
  const walletAddress = pushChainClient?.universal?.account?.toLowerCase() || null

  // Authenticate player when wallet connects
  useEffect(() => {
    const authenticate = async () => {
      if (!isConnected || !walletAddress) {
        // Clear player data when wallet disconnects
        setAuthenticatedPlayer(null)
        setUsername(null)
        return
      }

      setIsAuthenticating(true)
      
      try {
        console.log('🔐 Attempting authentication for wallet:', walletAddress)

        // Try to authenticate - wallet is the ONLY source of truth
        const result = await authenticatePlayer(walletAddress)
        
        setAuthenticatedPlayer(result.player)
        setUsername(result.player.name)

        console.log(result.isNewPlayer ? '✅ New player created' : '✅ Existing player authenticated:', result.player.name)
        
      } catch (error: any) {
        if (error.message === 'USERNAME_REQUIRED') {
          console.log('⚠️ New wallet detected - username required')
          // Username will be prompted in Welcome component
          setAuthenticatedPlayer(null)
          setUsername(null)
        } else {
          console.error('❌ Authentication failed:', error)
          setAuthenticatedPlayer(null)
          setUsername(null)
        }
      } finally {
        setIsAuthenticating(false)
      }
    }

    authenticate()
  }, [isConnected, walletAddress])

  const handleUsernameSet = async (newUsername: string, walletAddr?: string) => {
    const addressToUse = walletAddr || walletAddress
    
    if (!addressToUse) {
      console.error('❌ No wallet address available')
      throw new Error('No wallet connected')
    }

    try {
      // Create new player with this username and wallet
      const result = await authenticatePlayer(addressToUse, newUsername)
      
      setAuthenticatedPlayer(result.player)
      setUsername(result.player.name)
      
      setGameState(prev => ({
        ...prev,
        player1: {
          name: result.player.name,
          rating: result.player.rating
        }
      }))

      console.log('✅ Username set and player authenticated:', result.player.name)
      return result.player
    } catch (error: any) {
      console.error('❌ Failed to set username:', error)
      
      // Re-throw to let calling component handle
      if (error.message === 'USERNAME_TAKEN') {
        throw new Error('USERNAME_TAKEN')
      }
      throw error
    }
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
              authenticatedPlayer={authenticatedPlayer}
              isAuthenticating={isAuthenticating}
              walletAddress={walletAddress}
            />
          }
        />
        <Route
          path="/game"
          element={
            <MultiplayerGame
              username={username}
              walletAddress={walletAddress}
              authenticatedPlayer={authenticatedPlayer}
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
              walletAddress={walletAddress}
              authenticatedPlayer={authenticatedPlayer}
              onPlayAgain={() => {
                setGameState(prev => ({
                  ...prev,
                  player1: {
                    name: username || 'Guest',
                    rating: authenticatedPlayer?.rating || 800
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
          element={<GameHistory savedUsername={username} walletAddress={walletAddress} />}
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
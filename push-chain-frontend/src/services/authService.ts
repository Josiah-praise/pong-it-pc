/**
 * Authentication Service - Wallet-based Player Authentication
 * 
 * This service handles player authentication using wallet addresses.
 * - For cross-chain wallets: Uses UEA (Universal Executor Account)
 * - For native Push Chain wallets: Uses EOA (Externally Owned Account)
 */

import { BACKEND_URL } from '../constants';

export interface Player {
  _id: string;
  walletAddress: string;
  name: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  player: Player;
  isNewPlayer: boolean;
}

export interface AuthError {
  error: string;
  needsUsername?: boolean;
  usernameTaken?: boolean;
}

/**
 * Authenticate or register a player using their wallet address
 * 
 * @param walletAddress - UEA for cross-chain, EOA for native Push Chain
 * @param name - Display name (required for new players)
 * @returns Player data and registration status
 */
export async function authenticatePlayer(
  walletAddress: string,
  name?: string
): Promise<AuthResponse> {
  const normalizedAddress = walletAddress.toLowerCase().trim();

  try {
    const response = await fetch(`${BACKEND_URL}/players/by-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: normalizedAddress,
        name: name?.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 404 with needsUsername = true means new player needs to set username
      if (response.status === 404 && data.needsUsername) {
        throw new Error('USERNAME_REQUIRED');
      }
      
      // 409 with usernameTaken = true means username is already taken
      if (response.status === 409 && data.usernameTaken) {
        throw new Error('USERNAME_TAKEN');
      }
      
      throw new Error(data.error || 'Authentication failed');
    }


    return data as AuthResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if a player exists for a wallet address
 * 
 * @param walletAddress - UEA or EOA
 * @returns Player data or null if not found
 */
export async function getPlayerByWallet(
  walletAddress: string
): Promise<Player | null> {
  const normalizedAddress = walletAddress.toLowerCase().trim();

  try {
    const response = await fetch(
      `${BACKEND_URL}/players/by-wallet/${normalizedAddress}`
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch player');
    }

    const player = await response.json();
    return player as Player;
  } catch (error) {
    return null;
  }
}

/**
 * Update player's display name
 * 
 * @param walletAddress - UEA or EOA
 * @param newName - New display name
 */
export async function updatePlayerName(
  walletAddress: string,
  newName: string
): Promise<Player> {
  const normalizedAddress = walletAddress.toLowerCase().trim();

  try {
    const response = await fetch(`${BACKEND_URL}/players/by-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: normalizedAddress,
        name: newName.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update name');
    }

    return data.player as Player;
  } catch (error) {
    throw error;
  }
}


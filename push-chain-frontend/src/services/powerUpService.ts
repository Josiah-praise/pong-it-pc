import { BACKEND_URL } from '../constants'

export interface CrateState {
  deadline: string | null
  revealedAt?: string | null
}

export interface DelegationRecord {
  ownerWallet: string
  renterWallet: string
  tokenId: number
  amount: number
  remaining: number
  expiresAt: string
  status: 'active' | 'expired' | 'cancelled'
  txHash?: string
  _id?: string
}

export interface PowerUpSummary {
  walletAddress: string
  balances: Record<number, number>
  locked: Record<number, number>
  crate: CrateState | null
  delegations: {
    asOwner: DelegationRecord[]
    asRenter: DelegationRecord[]
  }
  ready: boolean
}

export interface CrateRevealPayload {
  nonce: string
  serverSecret: string
  deadline: string
  commitment: string
}

export interface RecordDelegationPayload {
  ownerWallet: string
  renterWallet: string
  tokenId: number
  amount: number
  txHash?: string
}

export interface CancelDelegationPayload {
  ownerWallet: string
  renterWallet: string
  tokenId: number
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message = (data as { error?: string }).error || 'Request failed'
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export async function getPowerUpSummary(walletAddress: string): Promise<PowerUpSummary> {
  const response = await fetch(`${BACKEND_URL}/powerups/summary/${walletAddress}`, {
    credentials: 'include',
  })
  return handleResponse<PowerUpSummary>(response)
}

export async function requestCrateReveal(walletAddress: string): Promise<CrateRevealPayload> {
  const response = await fetch(`${BACKEND_URL}/powerups/crate/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ walletAddress }),
  })
  return handleResponse<CrateRevealPayload>(response)
}

export async function markCrateConsumed(walletAddress: string, txHash?: string) {
  const response = await fetch(`${BACKEND_URL}/powerups/crate/consumed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ walletAddress, txHash }),
  })
  return handleResponse<PowerUpSummary | null>(response)
}

export async function recordDelegation(payload: RecordDelegationPayload) {
  const response = await fetch(`${BACKEND_URL}/powerups/delegations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return handleResponse<DelegationRecord>(response)
}

export async function cancelDelegation(payload: CancelDelegationPayload) {
  const response = await fetch(`${BACKEND_URL}/powerups/delegations/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return handleResponse<DelegationRecord | null>(response)
}

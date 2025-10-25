import { useCallback, useEffect, useMemo, useState, type FC, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  POWER_UP_METADATA,
  POWER_UP_IDS,
  PONG_POWERUPS_ADDRESS,
} from '../../constants'
import {
  cancelDelegation,
  getPowerUpSummary,
  markCrateConsumed,
  recordDelegation,
  requestCrateReveal,
  type DelegationRecord,
  type PowerUpSummary,
} from '../../services/powerUpService'
import {
  useCancelDelegation,
  useDelegateBoost,
  useOpenDailyCrate,
} from '../../hooks/usePowerUps'
import '../../styles/PowerUps.css'

interface PowerUpDashboardProps {
  walletAddress: string | null
}

interface DelegationFormState {
  renter: string
  tokenId: number
  amount: number
  durationHours: number
}

const DEFAULT_FORM: DelegationFormState = {
  renter: '',
  tokenId: POWER_UP_IDS[0],
  amount: 1,
  durationHours: 24,
}

const PowerUpDashboard: FC<PowerUpDashboardProps> = ({ walletAddress }) => {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<PowerUpSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<DelegationFormState>(DEFAULT_FORM)
  const [isSubmittingDelegation, setIsSubmittingDelegation] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    execute: openDailyCrate,
    hash: openCrateHash,
    isPending: isOpeningCrate,
    isConfirming: isConfirmingCrate,
    isSuccess: openCrateSuccess,
    error: openCrateError,
  } = useOpenDailyCrate()

  const {
    execute: delegateBoost,
    hash: delegateHash,
    isPending: isDelegating,
    isConfirming: isDelegationConfirming,
    isSuccess: delegationSuccess,
    error: delegationError,
  } = useDelegateBoost()

  const {
    execute: cancelDelegationTx,
    hash: cancelDelegationHash,
    isPending: isCancelling,
    isConfirming: isCancellingConfirming,
    isSuccess: cancelSuccess,
    error: cancelError,
  } = useCancelDelegation()

  const fetchSummary = useCallback(
    async (address: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getPowerUpSummary(address)
        setSummary(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load power-up summary')
        setSummary(null)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const refreshSummary = useCallback(async () => {
    if (!walletAddress) return
    setIsRefreshing(true)
    try {
      const data = await getPowerUpSummary(walletAddress)
      setSummary(data)
    } catch (err: any) {
      setError(err.message || 'Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }, [walletAddress])

  useEffect(() => {
    if (walletAddress) {
      fetchSummary(walletAddress)
    } else {
      setSummary(null)
    }
  }, [walletAddress, fetchSummary])

  useEffect(() => {
    if (openCrateError) {
      setError(openCrateError.message)
    }
  }, [openCrateError])

  useEffect(() => {
    if (delegationError) {
      setError(delegationError.message)
    }
  }, [delegationError])

  useEffect(() => {
    if (cancelError) {
      setError(cancelError.message)
    }
  }, [cancelError])

  const unlockedBalances = useMemo(() => {
    if (!summary) return {}
    const result: Record<number, number> = {}
    for (const id of POWER_UP_IDS) {
      const balance = summary.balances?.[id] ?? 0
      const locked = summary.locked?.[id] ?? 0
      result[id] = Math.max(balance - locked, 0)
    }
    return result
  }, [summary])

  const handleOpenCrate = useCallback(async () => {
    if (!walletAddress) {
      setError('Connect your wallet to open crates')
      return
    }

    try {
      const reveal = await requestCrateReveal(walletAddress)
      const txHash = await openDailyCrate(reveal.nonce, reveal.serverSecret)
      await markCrateConsumed(walletAddress, txHash)
      await refreshSummary()
    } catch (err: any) {
      setError(err.message || 'Unable to open crate')
    }
  }, [walletAddress, openDailyCrate, refreshSummary])

  const handleDelegationSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!walletAddress) {
        setError('Connect your wallet to share boosts')
        return
      }

      const { renter, amount, tokenId, durationHours } = formState
      if (!renter) {
        setError('Renter address is required')
        return
      }

      const available = unlockedBalances[tokenId] ?? 0
      if (amount > available) {
        setError('Not enough unlocked boosts to delegate that amount')
        return
      }

      try {
        setIsSubmittingDelegation(true)
        const expiresAtSeconds = Math.floor(Date.now() / 1000 + durationHours * 3600)
        const txHash = await delegateBoost(renter, tokenId, amount, expiresAtSeconds)
        await recordDelegation({
          ownerWallet: walletAddress,
          renterWallet: renter,
          tokenId,
          amount,
          txHash: txHash || delegateHash || undefined,
        })
        setFormState(DEFAULT_FORM)
        await refreshSummary()
      } catch (err: any) {
        setError(err.message || 'Failed to create rental voucher')
      } finally {
        setIsSubmittingDelegation(false)
      }
    },
    [walletAddress, formState, delegateBoost, delegateHash, refreshSummary, unlockedBalances]
  )

  const handleCancelDelegation = useCallback(
    async (delegation: DelegationRecord) => {
      if (!walletAddress) {
        setError('Connect your wallet to manage rentals')
        return
      }

      try {
        await cancelDelegationTx(delegation.renterWallet, delegation.tokenId)
        await cancelDelegation({
          ownerWallet: delegation.ownerWallet,
          renterWallet: delegation.renterWallet,
          tokenId: delegation.tokenId,
        })
        await refreshSummary()
      } catch (err: any) {
        setError(err.message || 'Failed to cancel rental')
      }
    },
    [walletAddress, cancelDelegationTx, refreshSummary]
  )

  const renderInventory = () => {
    if (!summary) return null

    return (
      <div className="powerup-card">
        <header>
          <h3>Inventory</h3>
          <button type="button" onClick={refreshSummary} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>
        <div className="powerup-grid">
          {POWER_UP_IDS.map(id => {
            const meta = POWER_UP_METADATA[id as keyof typeof POWER_UP_METADATA]
            const balance = summary.balances?.[id] ?? 0
            const locked = summary.locked?.[id] ?? 0
            const available = unlockedBalances[id] ?? 0

            return (
              <div key={id} className="powerup-tile">
                <span className="powerup-icon" aria-hidden>{meta.icon}</span>
                <div className="powerup-copy">
                  <h4>{meta.name}</h4>
                  <p>{meta.description}</p>
                </div>
                <dl>
                  <div>
                    <dt>Total</dt>
                    <dd>{balance}</dd>
                  </div>
                  <div>
                    <dt>Locked</dt>
                    <dd>{locked}</dd>
                  </div>
                  <div>
                    <dt>Available</dt>
                    <dd>{available}</dd>
                  </div>
                </dl>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderCrate = () => {
    if (!summary) return null
    const hasCrate = !!summary.crate?.deadline

    return (
      <div className="powerup-card">
        <header>
          <h3>Daily Loot Crate</h3>
        </header>
        {hasCrate ? (
          <div className="crate-section">
            <p>Crate ready! Crack it open to reveal a random boost.</p>
            <button
              type="button"
              onClick={handleOpenCrate}
              disabled={isOpeningCrate || isConfirmingCrate}
            >
              {isOpeningCrate || isConfirmingCrate ? 'Opening crate...' : 'Open crate'}
            </button>
            {openCrateSuccess && openCrateHash && (
              <small>Tx hash: <code>{openCrateHash}</code></small>
            )}
          </div>
        ) : (
          <p>No crate waiting right now. Win a match to earn the next drop.</p>
        )}
      </div>
    )
  }

  const renderDelegations = () => {
    if (!summary) return null

    const ownerDelegations = summary.delegations?.asOwner ?? []
    const borrowerDelegations = summary.delegations?.asRenter ?? []

    return (
      <div className="powerup-card">
        <header>
          <h3>Rental Passes</h3>
        </header>

        <form className="delegation-form" onSubmit={handleDelegationSubmit}>
          <div className="form-row">
            <label>
              Renter address
              <input
                type="text"
                value={formState.renter}
                onChange={event => setFormState(prev => ({ ...prev, renter: event.target.value }))}
                placeholder="0x..."
                required
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Power-up
              <select
                value={formState.tokenId}
                onChange={event =>
                  setFormState(prev => ({ ...prev, tokenId: Number(event.target.value) }))
                }
              >
                {POWER_UP_IDS.map(id => {
                  const meta = POWER_UP_METADATA[id as keyof typeof POWER_UP_METADATA]
                  return (
                    <option key={id} value={id}>
                      {meta.name}
                    </option>
                  )
                })}
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                min={1}
                value={formState.amount}
                onChange={event =>
                  setFormState(prev => ({ ...prev, amount: Number(event.target.value) }))
                }
              />
            </label>
            <label>
              Duration (hours)
              <input
                type="number"
                min={1}
                value={formState.durationHours}
                onChange={event =>
                  setFormState(prev => ({ ...prev, durationHours: Number(event.target.value) }))
                }
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmittingDelegation || isDelegating || isDelegationConfirming}
          >
            {isSubmittingDelegation || isDelegating || isDelegationConfirming
              ? 'Sharing boost...'
              : 'Share boost'}
          </button>
          {delegationSuccess && delegateHash && (
            <small>Tx hash: <code>{delegateHash}</code></small>
          )}
        </form>

        <div className="delegation-lists">
          <section>
            <h4>Passes you lent</h4>
            {ownerDelegations.length === 0 ? (
              <p className="empty">No active rentals yet.</p>
            ) : (
              <ul>
                {ownerDelegations.map(record => {
                  const meta = POWER_UP_METADATA[record.tokenId as keyof typeof POWER_UP_METADATA]
                  return (
                    <li key={`${record.ownerWallet}-${record.renterWallet}-${record.tokenId}`}>
                      <div>
                        <strong>{meta.name}</strong>
                        <span>
                          {record.remaining}/{record.amount} uses · ends{' '}
                          {new Date(record.expiresAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="delegation-actions">
                        <small>Renter: {record.renterWallet.slice(0, 6)}…{record.renterWallet.slice(-4)}</small>
                        <button
                          type="button"
                          onClick={() => handleCancelDelegation(record)}
                          disabled={isCancelling || isCancellingConfirming}
                        >
                          {isCancelling || isCancellingConfirming ? 'Cancelling…' : 'Reclaim'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
          <section>
            <h4>Passes you borrowed</h4>
            {borrowerDelegations.length === 0 ? (
              <p className="empty">No borrowed boosts right now.</p>
            ) : (
              <ul>
                {borrowerDelegations.map(record => {
                  const meta = POWER_UP_METADATA[record.tokenId as keyof typeof POWER_UP_METADATA]
                  return (
                    <li key={`${record.ownerWallet}-${record.renterWallet}-${record.tokenId}`}>
                      <div>
                        <strong>{meta.name}</strong>
                        <span>
                          {record.remaining}/{record.amount} uses · ends{' '}
                          {new Date(record.expiresAt).toLocaleString()}
                        </span>
                      </div>
                      <small>Lender: {record.ownerWallet.slice(0, 6)}…{record.ownerWallet.slice(-4)}</small>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
        {(cancelSuccess && cancelDelegationHash) && (
          <small>Cancel tx: <code>{cancelDelegationHash}</code></small>
        )}
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="powerup-page">
        <header className="powerup-header">
          <button type="button" onClick={() => navigate('/')}>← Back</button>
          <h2>PONG-IT Power-Ups</h2>
        </header>
        <p className="empty">Connect your wallet to manage your boosts.</p>
      </div>
    )
  }

  if (isLoading || !summary) {
    return (
      <div className="powerup-page">
        <header className="powerup-header">
          <button type="button" onClick={() => navigate('/')}>← Back</button>
          <h2>PONG-IT Power-Ups</h2>
        </header>
        <p className="empty">{isLoading ? 'Loading power-ups...' : 'No data available yet.'}</p>
      </div>
    )
  }

  return (
    <div className="powerup-page">
      <header className="powerup-header">
        <button type="button" onClick={() => navigate('/')}>← Back</button>
        <div>
          <h2>PONG-IT Power-Ups</h2>
          <p>
            Contract: <code>{PONG_POWERUPS_ADDRESS}</code>
          </p>
        </div>
      </header>

      {error && <div className="powerup-error">{error}</div>}
      {!summary.ready && (
        <div className="powerup-warning">
          Power-up services are not initialized yet. You can still browse your inventory, but rewards will sync once the backend signer is configured.
        </div>
      )}

      {renderInventory()}
      {renderCrate()}
      {renderDelegations()}
    </div>
  )
}

export default PowerUpDashboard

import React, { useMemo, useState } from 'react'
import { AlertTriangle, Coins, Info, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useDashboardData } from '../../hooks/useDashboardData'
import { generateTransactions, getDemoUser } from '../../data/demoData'
import { formatDateTime, formatHours, formatHoursValue, formatTokens } from '../../utils/format'
import Gauge from '../../components/shared/Gauge'

const LOW_BALANCE_THRESHOLD = 40
const MAX_BALANCE = 400

export default function ClientTokenBalance() {
  const { session } = useAuth()
  const toast = useToast()
  const { data } = useDashboardData()
  const meterId = session?.meterId
  const [recharging, setRecharging] = useState(false)

  const demoUser = getDemoUser(meterId)
  const liveUser = data?.users?.find((u) => u.id === meterId)
  const balance = liveUser?.balance ?? demoUser.balance
  const hoursRemaining = liveUser?.hours_remaining ?? demoUser.hoursRemaining

  const deductions = useMemo(
    () => generateTransactions(meterId, 12).filter((t) => t.type.includes('Deduction')),
    [meterId]
  )

  function handleRecharge() {
    setRecharging(true)
    setTimeout(() => {
      setRecharging(false)
      toast.success('Recharge request submitted. Tokens will reflect shortly.')
    }, 900)
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Token Balance</h1>
          <p className="page__subtitle">Your energy credits and estimated runway.</p>
        </div>
      </div>

      {balance < LOW_BALANCE_THRESHOLD && (
        <div className="alert-banner alert-banner--warning">
          <AlertTriangle size={16} />
          <span>Balance is low — top up now to keep your supply uninterrupted.</span>
        </div>
      )}

      <div className="grid-two">
        <div className="panel panel--balance-hero">
          <div className="balance-hero__figure">{formatTokens(balance, 1)}</div>
          <div className="balance-hero__unit">tokens remaining</div>
          <Gauge value={balance} max={MAX_BALANCE} label={formatTokens(balance, 0)} sublabel="tokens" critical={balance < LOW_BALANCE_THRESHOLD} size={240} />
          <div className="balance-hero__eta">Estimated Time Remaining: {formatHoursValue(hoursRemaining)} Hours</div>
          <button className="btn btn--gold btn--full" onClick={handleRecharge} disabled={recharging}>
            <Zap size={16} /> {recharging ? 'Processing…' : 'Recharge Balance'}
          </button>
        </div>

        <div className="panel">
          <div className="panel__title-row">
            <div className="panel__title"><Info size={15} /> How this is calculated</div>
          </div>
          <p className="explainer">
            Estimated time remaining is produced by the grid's regression model, which learns your
            meter's typical consumption pattern and personal usage weight, then divides your current
            token balance by your projected hourly draw.
          </p>
          <div className="sync-card__row">
            <span>Current balance</span>
            <span>{formatTokens(balance)} tokens</span>
          </div>
          <div className="sync-card__row">
            <span>Meter usage weight</span>
            <span>{demoUser.usageWeight}×</span>
          </div>
          <div className="sync-card__row">
            <span>Projected runway</span>
            <span>{formatHours(hoursRemaining)}</span>
          </div>

          <div className="panel__title" style={{ marginTop: 20 }}>
            <Coins size={15} /> Token Deduction History
          </div>
          <ul className="mini-list">
            {deductions.map((t) => (
              <li key={t.id} className="mini-list__row">
                <div>
                  <div className="mini-list__primary">{t.type}</div>
                  <div className="mini-list__secondary">{formatDateTime(t.date)}</div>
                </div>
                <div className="mini-list__amount">{formatTokens(t.tokenChange)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ArrowLeft, Zap, Activity, HeartPulse, AlertTriangle, MapPin } from 'lucide-react'
import { getDemoUser, generateConsumptionSeries, generateTransactions } from '../../data/demoData'
import { formatAmps, formatDateTime, formatHours, formatKwh, formatTokens } from '../../utils/format'
import { COLORS, LEAKAGE_THRESHOLD_AMPS } from '../../config/constants'
import StatCard from '../../components/shared/StatCard'

export default function ProviderUserDetail() {
  const { meterId } = useParams()
  const navigate = useNavigate()
  const user = getDemoUser(meterId)
  const series = useMemo(() => generateConsumptionSeries(meterId, 'weekly'), [meterId])
  const transactions = useMemo(() => generateTransactions(meterId, 8), [meterId])
  const isTheft = user.differential > LEAKAGE_THRESHOLD_AMPS

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate('/provider/users')}>
        <ArrowLeft size={15} /> Back to Active Users
      </button>

      <div className="page__header">
        <div>
          <h1>{user.name}</h1>
          <p className="page__subtitle">
            <MapPin size={13} style={{ verticalAlign: -2 }} /> {user.location} · Meter {user.meterId}
          </p>
        </div>
        <span className={`pill pill--${user.status === 'Active' ? 'teal' : 'gold'}`}>{user.status}</span>
      </div>

      {isTheft && (
        <div className="alert-banner alert-banner--critical">
          <AlertTriangle size={16} />
          <span>Theft Detected on this meter — differential {formatAmps(user.differential)} exceeds the {formatAmps(LEAKAGE_THRESHOLD_AMPS)} threshold.</span>
        </div>
      )}

      <div className="stat-grid">
        <StatCard icon={Zap} label="Token Balance" value={formatTokens(user.balance)} tone="gold" />
        <StatCard icon={Activity} label="Regression Prediction" value={formatHours(user.hoursRemaining)} />
        <StatCard icon={HeartPulse} label="Meter Health" value={user.meterHealth} tone={user.meterHealth === 'Healthy' ? 'teal' : 'gold'} />
        <StatCard icon={AlertTriangle} label="Current Differential" value={formatAmps(user.differential)} tone={isTheft ? 'red' : 'teal'} />
      </div>

      <div className="grid-two">
        <div className="panel">
          <div className="panel__title">Consumption History (7 Days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={series} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="userFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="label" stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} width={34} />
              <Tooltip
                contentStyle={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12 }}
                formatter={(v) => [formatKwh(v), 'Usage']}
              />
              <Area type="monotone" dataKey="kwh" stroke={COLORS.teal} strokeWidth={2} fill="url(#userFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel__title">Line Diagnostics</div>
          <div className="sync-card__row"><span>Line current</span><span>{formatAmps(user.lineCurrent)}</span></div>
          <div className="sync-card__row"><span>Neutral current</span><span>{formatAmps(user.neutralCurrent)}</span></div>
          <div className="sync-card__row"><span>Differential</span><span className={isTheft ? 'critical-text' : ''}>{formatAmps(user.differential)}</span></div>
          <div className="sync-card__row"><span>Leakage threshold</span><span>{formatAmps(LEAKAGE_THRESHOLD_AMPS)}</span></div>
          <div className="sync-card__row"><span>Usage weight</span><span>{user.usageWeight}×</span></div>

          <div className="panel__title" style={{ marginTop: 18 }}>Recent Transactions</div>
          <ul className="mini-list">
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id} className="mini-list__row">
                <div>
                  <div className="mini-list__primary">{t.type}</div>
                  <div className="mini-list__secondary">{formatDateTime(t.date)}</div>
                </div>
                <div className={`mini-list__amount ${t.tokenChange >= 0 ? 'mini-list__amount--positive' : ''}`}>
                  {t.tokenChange >= 0 ? '+' : ''}
                  {formatTokens(t.tokenChange)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

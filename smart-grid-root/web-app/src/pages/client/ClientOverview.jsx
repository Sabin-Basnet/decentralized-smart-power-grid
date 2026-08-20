import React, { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  Coins, TrendingUp, Zap, ActivitySquare, HeartPulse, Clock3, AlertTriangle, ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDashboardData } from '../../hooks/useDashboardData'
import { generateConsumptionSeries, generateTransactions, getDemoUser } from '../../data/demoData'
import { formatHoursValue, formatKwh, formatRelativeTime, formatTokens } from '../../utils/format'
import { COLORS } from '../../config/constants'
import Gauge from '../../components/shared/Gauge'
import StatCard from '../../components/shared/StatCard'
import OfflineBanner from '../../components/shared/OfflineBanner'
import { SkeletonCardGrid, SkeletonPanel } from '../../components/shared/Skeletons'

const LOW_BALANCE_THRESHOLD = 40

export default function ClientOverview() {
  const { session } = useAuth()
  const { data, status, source } = useDashboardData()
  const meterId = session?.meterId

  const liveUser = useMemo(() => {
    if (!data) return null
    return data.users.find((u) => u.id === meterId) || data.users[0]
  }, [data, meterId])

  const demoUser = getDemoUser(meterId)
  const balance = liveUser?.balance ?? demoUser.balance
  const hoursRemaining = liveUser?.hours_remaining ?? demoUser.hoursRemaining
  const currentUsage = demoUser.currentUsageKw
  const maxBalance = 400

  const series = useMemo(() => generateConsumptionSeries(meterId, 'daily'), [meterId])
  const avgUsage = useMemo(() => series.reduce((s, p) => s + p.kwh, 0) / series.length, [series])
  const peak = useMemo(() => series.reduce((max, p) => (p.kwh > max.kwh ? p : max), series[0]), [series])
  const transactions = useMemo(() => generateTransactions(meterId, 5), [meterId])

  const isLoading = status === 'loading' && !data

  return (
    <div className="page">
      <OfflineBanner source={source} />
      <div className="page__header">
        <div>
          <h1>Overview</h1>
          <p className="page__subtitle">Live snapshot of your meter, balance, and consumption.</p>
        </div>
      </div>

      {balance < LOW_BALANCE_THRESHOLD && (
        <div className="alert-banner alert-banner--warning">
          <AlertTriangle size={16} />
          <span>Your token balance is running low. Recharge soon to avoid a service interruption.</span>
          <Link to="/client/balance" className="alert-banner__cta">
            Recharge <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid-two">
        <div className="panel panel--balance">
          <div className="panel__title">Token Balance</div>
          {isLoading ? (
            <SkeletonPanel height={160} />
          ) : (
            <div className="balance-panel">
              <Gauge
                value={balance}
                max={maxBalance}
                label={formatTokens(balance, 0)}
                sublabel="tokens"
                critical={balance < LOW_BALANCE_THRESHOLD}
              />
              <div className="balance-panel__meta">
                <div className="balance-panel__eta">
                  <Clock3 size={15} />
                  <span>Estimated Time Remaining: {formatHoursValue(hoursRemaining)} Hours</span>
                </div>
                <Link to="/client/balance" className="btn btn--gold btn--small">
                  Recharge Now
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel__title-row">
            <div className="panel__title">Daily Consumption</div>
            <Link to="/client/consumption" className="panel__link">View details</Link>
          </div>
          {isLoading ? (
            <SkeletonPanel height={200} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} interval={3} />
                <YAxis stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} width={34} />
                <Tooltip
                  contentStyle={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: COLORS.textSecondary }}
                  formatter={(v) => [formatKwh(v), 'Usage']}
                />
                <Area type="monotone" dataKey="kwh" stroke={COLORS.teal} strokeWidth={2} fill="url(#usageFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {isLoading ? (
        <SkeletonCardGrid count={4} />
      ) : (
        <div className="stat-grid">
          <StatCard icon={Zap} label="Current Power Usage" value={formatKwh(currentUsage)} tone="gold" />
          <StatCard icon={TrendingUp} label="Average Usage" value={formatKwh(avgUsage)} />
          <StatCard icon={ActivitySquare} label="Peak Usage Period" value={peak.label} hint={formatKwh(peak.kwh)} />
          <StatCard
            icon={HeartPulse}
            label="Meter Health"
            value={demoUser.meterHealth}
            tone={demoUser.meterHealth === 'Healthy' ? 'teal' : 'gold'}
          />
        </div>
      )}

      <div className="grid-two">
        <div className="panel">
          <div className="panel__title-row">
            <div className="panel__title">Recent Transactions</div>
            <Link to="/client/transactions" className="panel__link">View all</Link>
          </div>
          <ul className="mini-list">
            {transactions.map((t) => (
              <li key={t.id} className="mini-list__row">
                <div>
                  <div className="mini-list__primary">{t.type}</div>
                  <div className="mini-list__secondary">{formatRelativeTime(t.date)}</div>
                </div>
                <div className={`mini-list__amount ${t.tokenChange >= 0 ? 'mini-list__amount--positive' : ''}`}>
                  {t.tokenChange >= 0 ? '+' : ''}
                  {formatTokens(t.tokenChange)}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="panel__title">Telemetry Sync</div>
          <div className="sync-card">
            <div className="sync-card__dot" />
            <div>
              <div className="sync-card__label">Last synchronized</div>
              <div className="sync-card__value">{formatRelativeTime(new Date(Date.now() - demoUser.lastSeenMinutesAgo * 60000).toISOString())}</div>
            </div>
          </div>
          <div className="sync-card__row">
            <span>Meter ID</span>
            <span>{demoUser.meterId}</span>
          </div>
          <div className="sync-card__row">
            <span>Connection status</span>
            <span>{demoUser.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

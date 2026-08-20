import React, { useMemo } from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  Users, Zap, Coins, TrendingUp, RadioTower, ShieldAlert, HeartPulse, Bell,
} from 'lucide-react'
import { useDashboardData } from '../../hooks/useDashboardData'
import { DEMO_USERS, generateConsumptionSeries, generateTelemetryEvents, generateAlerts } from '../../data/demoData'
import { formatKwh, formatRelativeTime, formatTokens } from '../../utils/format'
import { COLORS } from '../../config/constants'
import StatCard from '../../components/shared/StatCard'
import OfflineBanner from '../../components/shared/OfflineBanner'
import { SkeletonCardGrid, SkeletonPanel } from '../../components/shared/Skeletons'

export default function ProviderOverview() {
  const { data, status, source } = useDashboardData()
  const isLoading = status === 'loading' && !data

  const users = data?.users || []
  const onlineCount = DEMO_USERS.filter((u) => u.status === 'Active').length
  const offlineCount = DEMO_USERS.length - onlineCount
  const totalBalance = users.reduce((s, u) => s + u.balance, 0)
  const avgConsumption = users.length ? users.reduce((s, u) => s + u.usage_weight, 0) / users.length : 0
  const alerts = useMemo(() => generateAlerts('DHARAN-004'), [])
  const events = useMemo(() => generateTelemetryEvents(6), [])

  const loadSeries = useMemo(() => {
    const series = generateConsumptionSeries('DHARAN-001', 'daily')
    return series.map((p, i) => ({
      label: p.label,
      loadKw: Math.round(DEMO_USERS.reduce((s, u) => s + (u.usageWeight * (0.6 + 0.4 * Math.sin(i / 3))), 0) * 10) / 10,
    }))
  }, [])

  const trendSeries = useMemo(() => generateConsumptionSeries('DHARAN-002', 'weekly'), [])

  return (
    <div className="page">
      <OfflineBanner source={source} />
      <div className="page__header">
        <div>
          <h1>Operations Overview</h1>
          <p className="page__subtitle">Real-time status across the Dharan smart grid network.</p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCardGrid count={6} />
      ) : (
        <div className="stat-grid stat-grid--six">
          <StatCard icon={Users} label="Active Dharan Users" value={users.length} tone="gold" />
          <StatCard icon={Zap} label="Total System Load" value={`${data?.total_system_load_kw ?? 0} kW`} />
          <StatCard icon={Coins} label="Total Token Circulation" value={formatTokens(totalBalance, 0)} />
          <StatCard icon={TrendingUp} label="Average Consumption" value={formatKwh(avgConsumption)} />
          <StatCard icon={RadioTower} label="Online / Offline Meters" value={`${onlineCount} / ${offlineCount}`} tone={offlineCount > 0 ? 'gold' : 'teal'} />
          <StatCard
            icon={ShieldAlert}
            label="Critical Anomalies"
            value={alerts.activeAlerts.length}
            tone={alerts.activeAlerts.length > 0 ? 'red' : 'teal'}
          />
        </div>
      )}

      <div className="grid-two">
        <div className="panel">
          <div className="panel__title">Current Load</div>
          {isLoading ? (
            <SkeletonPanel />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={loadSeries} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} interval={3} />
                <YAxis stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} width={34} />
                <Tooltip
                  contentStyle={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12 }}
                  formatter={(v) => [`${v} kW`, 'Load']}
                />
                <Area type="monotone" dataKey="loadKw" stroke={COLORS.teal} strokeWidth={2} fill="url(#loadFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <div className="panel__title">Usage Trend (7 Days)</div>
          {isLoading ? (
            <SkeletonPanel />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendSeries} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} width={34} />
                <Tooltip
                  contentStyle={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12 }}
                  formatter={(v) => [formatKwh(v), 'Usage']}
                />
                <Line type="monotone" dataKey="kwh" stroke={COLORS.gold} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid-two">
        <div className="panel">
          <div className="panel__title"><Bell size={15} /> Recent Alerts</div>
          {alerts.activeAlerts.length === 0 ? (
            <div className="normal-state"><HeartPulse size={16} /> No active alerts across the network.</div>
          ) : (
            <ul className="mini-list">
              {alerts.activeAlerts.map((a) => (
                <li key={a.id} className="mini-list__row">
                  <div>
                    <div className="mini-list__primary" style={{ color: COLORS.red }}>Theft Detected — {a.meterId}</div>
                    <div className="mini-list__secondary">{a.user} · {formatRelativeTime(a.timestamp)}</div>
                  </div>
                  <span className="pill pill--red">CRITICAL</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel__title">Recent Telemetry Events</div>
          <ul className="mini-list">
            {events.map((e) => (
              <li key={e.id} className="mini-list__row">
                <div>
                  <div className="mini-list__primary">{e.message}</div>
                  <div className="mini-list__secondary">{formatRelativeTime(e.timestamp)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

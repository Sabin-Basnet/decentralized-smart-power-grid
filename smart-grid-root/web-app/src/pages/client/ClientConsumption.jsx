import React, { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Zap, TrendingUp, ActivitySquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { generateConsumptionSeries } from '../../data/demoData'
import { formatKwh } from '../../utils/format'
import { COLORS } from '../../config/constants'
import StatCard from '../../components/shared/StatCard'
import { EmptyState } from '../../components/shared/Skeletons'

const RANGES = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

export default function ClientConsumption() {
  const { session } = useAuth()
  const [range, setRange] = useState('daily')
  const [loading, setLoading] = useState(false)

  const series = useMemo(() => generateConsumptionSeries(session?.meterId, range), [session, range])
  const total = series.reduce((s, p) => s + p.kwh, 0)
  const avg = total / series.length
  const peak = series.reduce((max, p) => (p.kwh > max.kwh ? p : max), series[0])

  function handleRangeChange(key) {
    setLoading(true)
    setRange(key)
    setTimeout(() => setLoading(false), 350)
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Consumption</h1>
          <p className="page__subtitle">Track your power usage across daily, weekly, and monthly ranges.</p>
        </div>
        <div className="segmented">
          {RANGES.map((r) => (
            <button
              key={r.key}
              className={`segmented__option ${range === r.key ? 'segmented__option--active' : ''}`}
              onClick={() => handleRangeChange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon={Zap} label={`Total (${range})`} value={formatKwh(total)} tone="gold" />
        <StatCard icon={TrendingUp} label="Average" value={formatKwh(avg)} />
        <StatCard icon={ActivitySquare} label="Peak" value={`${formatKwh(peak.kwh)} · ${peak.label}`} />
      </div>

      <div className="panel">
        <div className="panel__title">Usage Trend</div>
        {loading ? (
          <div className="panel__loading-overlay">Loading…</div>
        ) : series.length === 0 ? (
          <EmptyState icon={ActivitySquare} title="No consumption data" message="Readings will appear once telemetry is received." />
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={series} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="consFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.gold} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={COLORS.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="label" stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} width={38} />
              <Tooltip
                contentStyle={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: COLORS.textSecondary }}
                formatter={(v) => [formatKwh(v), 'Usage']}
              />
              <Area type="monotone" dataKey="kwh" stroke={COLORS.gold} strokeWidth={2} fill="url(#consFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

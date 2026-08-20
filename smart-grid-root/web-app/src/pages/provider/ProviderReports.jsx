import React, { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Download, Zap, TrendingUp, ActivitySquare, ShieldAlert, Coins } from 'lucide-react'
import { generateConsumptionSeries, generateReport } from '../../data/demoData'
import { formatKwh, formatTokens } from '../../utils/format'
import { COLORS } from '../../config/constants'
import { useToast } from '../../context/ToastContext'
import StatCard from '../../components/shared/StatCard'

const RANGES = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
]

export default function ProviderReports() {
  const toast = useToast()
  const [range, setRange] = useState('weekly')
  const report = useMemo(() => generateReport(range), [range])
  const series = useMemo(() => generateConsumptionSeries('DHARAN-002', range), [range])

  function handleExport() {
    toast.success(`Report for "${RANGES.find((r) => r.key === range).label}" exported.`)
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Reports</h1>
          <p className="page__subtitle">Grid performance summary for the selected date range.</p>
        </div>
        <div className="toolbar__actions">
          <div className="segmented">
            {RANGES.map((r) => (
              <button key={r.key} className={`segmented__option ${range === r.key ? 'segmented__option--active' : ''}`} onClick={() => setRange(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
          <button className="btn btn--gold" onClick={handleExport}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className="stat-grid stat-grid--five">
        <StatCard icon={Zap} label="Total Energy Consumed" value={formatKwh(report.totalEnergy)} tone="gold" />
        <StatCard icon={TrendingUp} label="Peak Load" value={`${report.peakLoad} kW`} />
        <StatCard icon={ActivitySquare} label="Average Load" value={`${report.avgLoad} kW`} />
        <StatCard icon={ShieldAlert} label="Anomaly Count" value={report.anomalyCount} tone={report.anomalyCount > 0 ? 'red' : 'teal'} />
        <StatCard icon={Coins} label="Token Usage" value={formatTokens(report.tokenUsage, 0)} />
      </div>

      <div className="panel">
        <div className="panel__title">Consumption Breakdown</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={series} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="label" stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} interval={range === 'monthly' ? 3 : 0} />
            <YAxis stroke={COLORS.textFaint} fontSize={11} tickLine={false} axisLine={false} width={34} />
            <Tooltip
              contentStyle={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12 }}
              formatter={(v) => [formatKwh(v), 'Usage']}
            />
            <Bar dataKey="kwh" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

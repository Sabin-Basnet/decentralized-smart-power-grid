import React from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import { COLORS } from '../../config/constants'

/**
 * Semi-circular gauge. `value` and `max` define the fill percentage;
 * `label`/`sublabel` render centered beneath the arc.
 */
export default function Gauge({ value, max, label, sublabel, size = 220, color = COLORS.gold, critical = false }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0))
  const data = [
    { name: 'filled', value: pct },
    { name: 'rest', value: 1 - pct },
  ]
  const arcColor = critical ? COLORS.red : color

  return (
    <div className="gauge" style={{ width: size, height: size * 0.62 }}>
      <PieChart width={size} height={size * 0.62}>
        <Pie
          data={data}
          startAngle={180}
          endAngle={0}
          cx="50%"
          cy="98%"
          innerRadius={size * 0.34}
          outerRadius={size * 0.46}
          dataKey="value"
          stroke="none"
          isAnimationActive
          animationDuration={700}
        >
          <Cell fill={arcColor} />
          <Cell fill="rgba(255,255,255,0.06)" />
        </Pie>
      </PieChart>
      <div className="gauge__center">
        <div className="gauge__value" style={{ color: arcColor }}>{label}</div>
        {sublabel && <div className="gauge__sublabel">{sublabel}</div>}
      </div>
    </div>
  )
}

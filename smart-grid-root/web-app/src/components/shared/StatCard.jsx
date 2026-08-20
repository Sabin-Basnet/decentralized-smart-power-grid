import React from 'react'

export default function StatCard({ icon: Icon, label, value, hint, tone = 'default' }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">{Icon && <Icon size={18} />}</div>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {hint && <div className="stat-card__hint">{hint}</div>}
      </div>
    </div>
  )
}

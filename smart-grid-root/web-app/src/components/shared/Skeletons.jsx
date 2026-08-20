import React from 'react'

export function SkeletonBlock({ height = 20, width = '100%', radius = 8 }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />
}

export function SkeletonCardGrid({ count = 4 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-card" key={i}>
          <SkeletonBlock height={34} width={34} radius={10} />
          <div className="stat-card__body" style={{ width: '100%' }}>
            <SkeletonBlock height={11} width="60%" />
            <div style={{ height: 8 }} />
            <SkeletonBlock height={22} width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonPanel({ height = 260 }) {
  return (
    <div className="panel">
      <SkeletonBlock height={16} width="30%" />
      <div style={{ height: 16 }} />
      <SkeletonBlock height={height} />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={28} />}
      <div className="empty-state__title">{title}</div>
      {message && <div className="empty-state__message">{message}</div>}
    </div>
  )
}

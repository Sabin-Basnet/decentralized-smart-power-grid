export function formatKwh(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Number(value).toFixed(digits)} kWh`
}

export function formatAmps(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Number(value).toFixed(digits)} A`
}

export function formatTokens(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return Number(value).toFixed(digits)
}

export function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Number(value).toFixed(1)} Hours`
}

// Just the numeric portion, for building "Estimated Time Remaining: X Hours" labels.
export function formatHoursValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return Number(value).toFixed(1)
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelativeTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
}

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `Rs. ${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Users } from 'lucide-react'
import { DEMO_USERS } from '../../data/demoData'
import { formatKwh, formatRelativeTime, formatTokens, formatHours } from '../../utils/format'
import { EmptyState } from '../../components/shared/Skeletons'

const STATUS_FILTERS = ['All', 'Active', 'Offline']

export default function ProviderActiveUsers() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(() => {
    return DEMO_USERS.filter((u) => {
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter
      const q = query.trim().toLowerCase()
      const matchesQuery = q === '' || u.name.toLowerCase().includes(q) || u.meterId.toLowerCase().includes(q) || u.location.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [query, statusFilter])

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Active Users</h1>
          <p className="page__subtitle">All registered smart meters on the Dharan network.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Search size={15} />
          <input placeholder="Search by name, meter ID, or location…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="chip-filters">
          {STATUS_FILTERS.map((s) => (
            <button key={s} className={`chip ${statusFilter === s ? 'chip--active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users match your search" message="Adjust your filters and try again." />
      ) : (
        <div className="table-wrap">
          <table className="data-table data-table--interactive">
            <thead>
              <tr>
                <th>User</th>
                <th>Meter ID</th>
                <th>Location</th>
                <th>Balance</th>
                <th>Hours Remaining</th>
                <th>Current Usage</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.meterId} onClick={() => navigate(`/provider/users/${u.meterId}`)} tabIndex={0}>
                  <td>{u.name}</td>
                  <td className="mono">{u.meterId}</td>
                  <td>{u.location}</td>
                  <td>{formatTokens(u.balance)}</td>
                  <td>{formatHours(u.hoursRemaining)}</td>
                  <td>{formatKwh(u.currentUsageKw)}</td>
                  <td>
                    <span className={`pill pill--${u.status === 'Active' ? 'teal' : 'gold'}`}>{u.status}</span>
                  </td>
                  <td>{formatRelativeTime(new Date(Date.now() - u.lastSeenMinutesAgo * 60000).toISOString())}</td>
                  <td>
                    <button className="icon-btn" title="Open user details" aria-label={`Open details for ${u.name}`}>
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import React, { useMemo, useState } from 'react'
import { Search, Receipt } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { generateTransactions } from '../../data/demoData'
import { formatDateTime, formatTokens } from '../../utils/format'
import { EmptyState } from '../../components/shared/Skeletons'

const TYPE_FILTERS = ['All', 'Recharge', 'Consumption Deduction', 'Bonus Credit']

export default function ClientTransactions() {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  const transactions = useMemo(() => generateTransactions(session?.meterId, 24), [session])

  const filtered = transactions.filter((t) => {
    const matchesType = typeFilter === 'All' || t.type === typeFilter
    const matchesQuery = query.trim() === '' || t.type.toLowerCase().includes(query.toLowerCase()) || t.id.toLowerCase().includes(query.toLowerCase())
    return matchesType && matchesQuery
  })

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Transactions</h1>
          <p className="page__subtitle">Recharges and consumption deductions for your account.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Search size={15} />
          <input placeholder="Search by ID or type…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="chip-filters">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              className={`chip ${typeFilter === t ? 'chip--active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No matching transactions" message="Try a different search term or filter." />
      ) : (
        <>
          <div className="table-wrap table-wrap--desktop">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Token Change</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDateTime(t.date)}</td>
                    <td>{t.type}</td>
                    <td>{t.amount !== null ? `Rs. ${t.amount}` : '—'}</td>
                    <td className={t.tokenChange >= 0 ? 'positive' : ''}>
                      {t.tokenChange >= 0 ? '+' : ''}
                      {formatTokens(t.tokenChange)}
                    </td>
                    <td>
                      <span className={`pill pill--${t.status === 'Completed' ? 'teal' : 'gold'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="txn-cards">
            {filtered.map((t) => (
              <div className="txn-card" key={t.id}>
                <div className="txn-card__row">
                  <span className="txn-card__type">{t.type}</span>
                  <span className={`pill pill--${t.status === 'Completed' ? 'teal' : 'gold'}`}>{t.status}</span>
                </div>
                <div className="txn-card__row">
                  <span className="txn-card__date">{formatDateTime(t.date)}</span>
                  <span className={t.tokenChange >= 0 ? 'positive' : ''}>
                    {t.tokenChange >= 0 ? '+' : ''}
                    {formatTokens(t.tokenChange)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

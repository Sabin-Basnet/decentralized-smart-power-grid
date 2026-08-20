import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ShieldCheck, CheckCircle2, History } from 'lucide-react'
import { generateAlerts } from '../../data/demoData'
import { formatAmps, formatDateTime, formatRelativeTime } from '../../utils/format'
import { LEAKAGE_THRESHOLD_AMPS } from '../../config/constants'

export default function ProviderAnomalies() {
  const initial = useMemo(() => generateAlerts('DHARAN-004'), [])
  const [activeAlerts, setActiveAlerts] = useState(initial.activeAlerts)
  const [history, setHistory] = useState(initial.history)

  const hasTheft = activeAlerts.length > 0
  const primary = activeAlerts[0]

  function acknowledge(alertId) {
    const alert = activeAlerts.find((a) => a.id === alertId)
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId))
    if (alert) {
      setHistory((prev) => [
        { id: `HIST-${alertId}`, meterId: alert.meterId, user: alert.user, label: 'Theft Detected', timestamp: alert.timestamp, resolved: true },
        ...prev,
      ])
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Anomalies</h1>
          <p className="page__subtitle">
            Leakage classification: <code>abs(line_current − neutral_current) &gt; {LEAKAGE_THRESHOLD_AMPS} A</code>
          </p>
        </div>
      </div>

      <div className={`theft-panel ${hasTheft ? 'theft-panel--critical' : 'theft-panel--normal'}`}>
        {hasTheft ? (
          <>
            <div className="theft-panel__pulse" aria-hidden="true" />
            <div className="theft-panel__icon"><AlertTriangle size={30} /></div>
            <div className="theft-panel__label">Theft Detected</div>
            <div className="theft-panel__meta">
              Meter <strong>{primary.meterId}</strong> · {primary.user}
            </div>
            <div className="theft-panel__grid">
              <div><span>Line Current</span><strong>{formatAmps(primary.lineCurrent)}</strong></div>
              <div><span>Neutral Current</span><strong>{formatAmps(primary.neutralCurrent)}</strong></div>
              <div><span>Differential</span><strong>{formatAmps(primary.differential)}</strong></div>
              <div><span>Leakage Threshold</span><strong>{formatAmps(primary.threshold)}</strong></div>
              <div><span>Severity</span><strong>{primary.severity}</strong></div>
              <div><span>Detected</span><strong>{formatDateTime(primary.timestamp)}</strong></div>
            </div>
            <div className="theft-panel__actions">
              <button className="btn btn--critical" onClick={() => acknowledge(primary.id)}>
                <CheckCircle2 size={15} /> Acknowledge &amp; Resolve
              </button>
              <Link to={`/provider/users/${primary.meterId}`} className="btn btn--outline">
                Inspect Meter
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="theft-panel__icon theft-panel__icon--normal"><ShieldCheck size={30} /></div>
            <div className="theft-panel__label theft-panel__label--normal">Normal</div>
            <div className="theft-panel__meta">No leakage differential exceeds the threshold across the network.</div>
          </>
        )}
      </div>

      {activeAlerts.length > 1 && (
        <div className="panel">
          <div className="panel__title">Additional Active Alerts</div>
          <ul className="mini-list">
            {activeAlerts.slice(1).map((a) => (
              <li key={a.id} className="mini-list__row">
                <div>
                  <div className="mini-list__primary critical-text">Theft Detected — {a.meterId}</div>
                  <div className="mini-list__secondary">{a.user} · {formatRelativeTime(a.timestamp)}</div>
                </div>
                <button className="btn btn--outline btn--small" onClick={() => acknowledge(a.id)}>Acknowledge</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        <div className="panel__title"><History size={15} /> Alert History</div>
        <ul className="mini-list">
          {history.map((h) => (
            <li key={h.id} className="mini-list__row">
              <div>
                <div className="mini-list__primary">{h.label} — {h.meterId}</div>
                <div className="mini-list__secondary">{h.user} · {formatDateTime(h.timestamp)}</div>
              </div>
              <span className="pill pill--teal">Resolved</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

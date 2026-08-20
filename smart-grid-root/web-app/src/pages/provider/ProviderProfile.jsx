import React from 'react'
import { LogOut, Mail, ShieldCheck, RadioTower, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDashboardData } from '../../hooks/useDashboardData'

export default function ProviderProfile() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const { source } = useDashboardData()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Provider Profile</h1>
          <p className="page__subtitle">Administrator account and network status.</p>
        </div>
      </div>

      <div className="grid-two">
        <div className="panel profile-card">
          <div className="profile-card__avatar profile-card__avatar--provider"><ShieldCheck size={22} /></div>
          <div className="profile-card__name">{session?.name}</div>
          <div className="profile-card__status">
            <span className={`status-dot status-dot--${source === 'live' ? 'teal' : 'gold'}`} />
            {source === 'live' ? 'Network Online' : 'Demo Mode'}
          </div>

          <div className="profile-detail">
            <Mail size={15} />
            <div>
              <div className="profile-detail__label">Email</div>
              <div className="profile-detail__value">{session?.email}</div>
            </div>
          </div>
          <div className="profile-detail">
            <ShieldCheck size={15} />
            <div>
              <div className="profile-detail__label">Title</div>
              <div className="profile-detail__value">{session?.title}</div>
            </div>
          </div>
          <div className="profile-detail">
            <RadioTower size={15} />
            <div>
              <div className="profile-detail__label">Access Level</div>
              <div className="profile-detail__value">Full Grid Administration</div>
            </div>
          </div>

          <button className="btn btn--outline btn--full" onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>

        <div className="panel">
          <div className="panel__title"><Bell size={15} /> Alert Preferences</div>
          <p className="explainer">
            Critical theft alerts are always shown regardless of preference settings. Configure how
            secondary notices reach your team through the operations console.
          </p>
          <div className="sync-card__row"><span>Backend endpoint</span><span className="mono">127.0.0.1:8000</span></div>
          <div className="sync-card__row"><span>Data source</span><span>{source === 'live' ? 'Live telemetry' : 'Demo fallback'}</span></div>
          <div className="sync-card__row"><span>Monitored meters</span><span>6</span></div>
        </div>
      </div>
    </div>
  )
}

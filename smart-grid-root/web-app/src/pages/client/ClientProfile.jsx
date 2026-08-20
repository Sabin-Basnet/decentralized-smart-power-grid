import React, { useState } from 'react'
import { LogOut, MapPin, Gauge as GaugeIcon, Mail, UserRound, BellRing, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function ClientProfile() {
  const { session, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(true)
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState(true)
  const [darkPanels, setDarkPanels] = useState(true)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function toggle(setter, label) {
    setter((v) => {
      toast.info(`${label} ${!v ? 'enabled' : 'disabled'}.`)
      return !v
    })
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Profile</h1>
          <p className="page__subtitle">Account details and preferences.</p>
        </div>
      </div>

      <div className="grid-two">
        <div className="panel profile-card">
          <div className="profile-card__avatar">{session?.name?.[0]}</div>
          <div className="profile-card__name">{session?.name}</div>
          <div className="profile-card__status">
            <span className="status-dot status-dot--teal" /> Account Active
          </div>

          <div className="profile-detail">
            <Mail size={15} />
            <div>
              <div className="profile-detail__label">Email</div>
              <div className="profile-detail__value">{session?.email}</div>
            </div>
          </div>
          <div className="profile-detail">
            <GaugeIcon size={15} />
            <div>
              <div className="profile-detail__label">Smart Meter ID</div>
              <div className="profile-detail__value">{session?.meterId}</div>
            </div>
          </div>
          <div className="profile-detail">
            <MapPin size={15} />
            <div>
              <div className="profile-detail__label">Location</div>
              <div className="profile-detail__value">{session?.location}</div>
            </div>
          </div>
          <div className="profile-detail">
            <UserRound size={15} />
            <div>
              <div className="profile-detail__label">Account Type</div>
              <div className="profile-detail__value">Residential Consumer</div>
            </div>
          </div>

          <button className="btn btn--outline btn--full" onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>

        <div className="panel">
          <div className="panel__title">Preferences</div>
          <div className="pref-row">
            <div className="pref-row__label">
              <BellRing size={16} />
              <div>
                <div className="pref-row__title">Push notifications</div>
                <div className="pref-row__hint">Get notified about recharges and alerts.</div>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={notifications} onChange={() => toggle(setNotifications, 'Push notifications')} />
              <span className="switch__track" />
            </label>
          </div>
          <div className="pref-row">
            <div className="pref-row__label">
              <GaugeIcon size={16} />
              <div>
                <div className="pref-row__title">Low-balance alerts</div>
                <div className="pref-row__hint">Warn me when tokens fall below the threshold.</div>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={lowBalanceAlerts} onChange={() => toggle(setLowBalanceAlerts, 'Low-balance alerts')} />
              <span className="switch__track" />
            </label>
          </div>
          <div className="pref-row">
            <div className="pref-row__label">
              <Moon size={16} />
              <div>
                <div className="pref-row__title">Dense panel layout</div>
                <div className="pref-row__hint">Show more data per screen on wide displays.</div>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={darkPanels} onChange={() => toggle(setDarkPanels, 'Dense panel layout')} />
              <span className="switch__track" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

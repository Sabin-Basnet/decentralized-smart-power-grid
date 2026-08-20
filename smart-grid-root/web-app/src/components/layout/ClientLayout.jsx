import React, { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Activity, Coins, Receipt, UserRound, LogOut, Menu, X, Zap, MapPin, Gauge as GaugeIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const NAV_ITEMS = [
  { to: '/client/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/client/consumption', label: 'Consumption', icon: Activity },
  { to: '/client/balance', label: 'Token Balance', icon: Coins },
  { to: '/client/transactions', label: 'Transactions', icon: Receipt },
  { to: '/client/profile', label: 'Profile', icon: UserRound },
]

export default function ClientLayout() {
  const { session, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    toast.info('You have been signed out.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark"><Zap size={18} /></div>
          <div>
            <div className="sidebar__brand-name">Dharan Grid</div>
            <div className="sidebar__brand-tag">Client Portal</div>
          </div>
          <button className="sidebar__close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__meta">
          <div className="sidebar__meta-row"><GaugeIcon size={13} /> Meter {session?.meterId}</div>
          <div className="sidebar__meta-row"><MapPin size={13} /> {session?.location}</div>
        </div>

        <div className="sidebar__profile">
          <div className="sidebar__avatar">{session?.name?.[0] || 'U'}</div>
          <div className="sidebar__profile-info">
            <div className="sidebar__profile-name">{session?.name}</div>
            <div className="sidebar__profile-role">Consumer Account</div>
          </div>
        </div>
        <button className="sidebar__logout" onClick={handleLogout}>
          <LogOut size={16} /> Log out
        </button>
      </aside>

      {mobileOpen && <div className="sidebar__scrim" onClick={() => setMobileOpen(false)} />}

      <div className="app-main">
        <header className="topbar">
          <button className="topbar__menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="topbar__page-indicator">
            <CurrentPageLabel items={NAV_ITEMS} />
          </div>

          <div className="topbar__spacer" />
          <div className="topbar__meter-chip">
            <GaugeIcon size={13} /> {session?.meterId}
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function CurrentPageLabel({ items }) {
  const location = useLocation()
  const match = items.find((i) => location.pathname.startsWith(i.to))
  return <span>{match ? match.label : 'Overview'}</span>
}

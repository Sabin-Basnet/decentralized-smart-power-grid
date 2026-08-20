import React, { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Users, RadioTower, ShieldAlert, FileBarChart, UserCog, LogOut, Menu, X, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useDashboardData } from '../../hooks/useDashboardData'

const NAV_ITEMS = [
  { to: '/provider/overview', label: 'Operations Overview', icon: LayoutGrid },
  { to: '/provider/users', label: 'Active Users', icon: Users },
  { to: '/provider/anomalies', label: 'Anomalies', icon: ShieldAlert },
  { to: '/provider/reports', label: 'Reports', icon: FileBarChart },
  { to: '/provider/profile', label: 'Provider Profile', icon: UserCog },
]

export default function ProviderLayout() {
  const { session, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { source } = useDashboardData()

  function handleLogout() {
    logout()
    toast.info('You have been signed out.')
    navigate('/login', { replace: true })
  }

  const match = NAV_ITEMS.find((i) => location.pathname.startsWith(i.to))

  return (
    <div className="app-shell app-shell--provider">
      <aside className={`sidebar sidebar--provider ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark sidebar__brand-mark--provider"><RadioTower size={18} /></div>
          <div>
            <div className="sidebar__brand-name">Dharan Grid</div>
            <div className="sidebar__brand-tag">Provider Control Center</div>
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

        <div className="sidebar__network-status">
          <span className={`status-dot status-dot--${source === 'live' ? 'teal' : 'gold'}`} />
          {source === 'live' ? 'Network Online' : 'Demo Mode'}
        </div>

        <div className="sidebar__profile">
          <div className="sidebar__avatar sidebar__avatar--provider"><ShieldCheck size={17} /></div>
          <div className="sidebar__profile-info">
            <div className="sidebar__profile-name">{session?.name}</div>
            <div className="sidebar__profile-role">{session?.title}</div>
          </div>
        </div>
        <button className="sidebar__logout" onClick={handleLogout}>
          <LogOut size={16} /> Log out
        </button>
      </aside>

      {mobileOpen && <div className="sidebar__scrim" onClick={() => setMobileOpen(false)} />}

      <div className="app-main">
        <header className="topbar topbar--provider">
          <button className="topbar__menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="topbar__page-indicator">{match ? match.label : 'Operations Overview'}</div>
          <div className="topbar__spacer" />
          <div className={`topbar__network-chip topbar__network-chip--${source === 'live' ? 'teal' : 'gold'}`}>
            <span className="status-dot" /> {source === 'live' ? 'Live Telemetry' : 'Demo Data'}
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

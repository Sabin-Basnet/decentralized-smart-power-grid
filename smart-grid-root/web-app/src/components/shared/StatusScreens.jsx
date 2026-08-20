import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, Compass, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../config/constants'

function StatusShell({ icon: Icon, title, message, children }) {
  return (
    <div className="status-screen">
      <div className="status-screen__backdrop" aria-hidden="true" />
      <div className="status-screen__card">
        <div className="status-screen__icon">
          <Icon size={26} />
        </div>
        <h1>{title}</h1>
        <p>{message}</p>
        {children}
      </div>
    </div>
  )
}

export function Unauthorized() {
  const { role, isAuthenticated } = useAuth()
  const home = role === ROLES.PROVIDER ? '/provider' : '/client'
  return (
    <StatusShell
      icon={ShieldAlert}
      title="Access restricted"
      message="Your account role doesn't have permission to view that section of the grid platform."
    >
      <Link className="btn btn--primary" to={isAuthenticated ? home : '/login'}>
        <Zap size={15} /> {isAuthenticated ? 'Back to dashboard' : 'Go to sign in'}
      </Link>
    </StatusShell>
  )
}

export function NotFound() {
  const { isAuthenticated, role } = useAuth()
  const home = isAuthenticated ? (role === ROLES.PROVIDER ? '/provider' : '/client') : '/login'
  return (
    <StatusShell icon={Compass} title="Page not found" message="This route doesn't exist on the Dharan grid platform.">
      <Link className="btn btn--primary" to={home}>
        Take me back
      </Link>
    </StatusShell>
  )
}

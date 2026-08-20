import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ROLES } from './config/constants'
import { useAuth } from './context/AuthContext'

import LoginPage from './components/auth/LoginPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { Unauthorized, NotFound } from './components/shared/StatusScreens'

import ClientLayout from './components/layout/ClientLayout'
import ClientOverview from './pages/client/ClientOverview'
import ClientConsumption from './pages/client/ClientConsumption'
import ClientTokenBalance from './pages/client/ClientTokenBalance'
import ClientTransactions from './pages/client/ClientTransactions'
import ClientProfile from './pages/client/ClientProfile'

import ProviderLayout from './components/layout/ProviderLayout'
import ProviderOverview from './pages/provider/ProviderOverview'
import ProviderActiveUsers from './pages/provider/ProviderActiveUsers'
import ProviderUserDetail from './pages/provider/ProviderUserDetail'
import ProviderAnomalies from './pages/provider/ProviderAnomalies'
import ProviderReports from './pages/provider/ProviderReports'
import ProviderProfile from './pages/provider/ProviderProfile'

export default function App() {
  const { isAuthenticated, role, initializing } = useAuth()

  if (initializing) {
    return (
      <div className="app-boot">
        <div className="app-boot__mark">DHARAN GRID</div>
        <div className="app-boot__bar"><span /></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={role === ROLES.PROVIDER ? '/provider' : '/client'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRole={ROLES.CLIENT}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<ClientOverview />} />
        <Route path="consumption" element={<ClientConsumption />} />
        <Route path="balance" element={<ClientTokenBalance />} />
        <Route path="transactions" element={<ClientTransactions />} />
        <Route path="profile" element={<ClientProfile />} />
      </Route>

      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRole={ROLES.PROVIDER}>
            <ProviderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<ProviderOverview />} />
        <Route path="users" element={<ProviderActiveUsers />} />
        <Route path="users/:meterId" element={<ProviderUserDetail />} />
        <Route path="anomalies" element={<ProviderAnomalies />} />
        <Route path="reports" element={<ProviderReports />} />
        <Route path="profile" element={<ProviderProfile />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? (role === ROLES.PROVIDER ? '/provider' : '/client') : '/login'} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

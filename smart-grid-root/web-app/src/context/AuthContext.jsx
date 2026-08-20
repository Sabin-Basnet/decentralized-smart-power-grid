import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const restored = authService.restoreSession()
    setSession(restored)
    setInitializing(false)
  }, [])

  const login = useCallback(async (email, password, remember) => {
    const nextSession = await authService.login({ email, password })
    authService.persistSession(nextSession, remember)
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(() => {
    authService.clearSession()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      role: session?.role || null,
      initializing,
      login,
      logout,
    }),
    [session, initializing, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

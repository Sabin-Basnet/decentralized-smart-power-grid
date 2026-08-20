import { DEMO_ACCOUNTS, SESSION_KEY } from '../config/constants'

function makeToken() {
  return `dharan_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

/**
 * Validates credentials against the configured demo accounts and returns
 * a session object, or throws with a user-facing message on failure.
 */
export async function login({ email, password }) {
  // Simulated network latency so the loading state has something to show.
  await new Promise((resolve) => setTimeout(resolve, 550))

  const normalizedEmail = email.trim().toLowerCase()
  const account = Object.values(DEMO_ACCOUNTS).find(
    (acc) => acc.email.toLowerCase() === normalizedEmail
  )

  if (!account) {
    throw new Error('No account found with that email address.')
  }
  if (account.password !== password) {
    throw new Error('Incorrect password. Please try again.')
  }

  const { password: _pw, ...safeAccount } = account
  return {
    token: makeToken(),
    issuedAt: new Date().toISOString(),
    ...safeAccount,
  }
}

export function persistSession(session, remember) {
  const storage = remember ? window.localStorage : window.sessionStorage
  const other = remember ? window.sessionStorage : window.localStorage
  storage.setItem(SESSION_KEY, JSON.stringify(session))
  other.removeItem(SESSION_KEY)
}

export function restoreSession() {
  const fromLocal = window.localStorage.getItem(SESSION_KEY)
  const fromSession = window.sessionStorage.getItem(SESSION_KEY)
  const raw = fromLocal || fromSession
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
}

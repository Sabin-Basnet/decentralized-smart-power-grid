import { API_BASE_URL } from '../config/constants'
import { demoDashboardPayload } from '../data/demoData'

const REQUEST_TIMEOUT_MS = 4000

async function request(path, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    })
    clearTimeout(timer)
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`)
    }
    const data = await res.json()
    return { data, online: true, error: null }
  } catch (err) {
    clearTimeout(timer)
    return { data: null, online: false, error: err.message || 'Network error' }
  }
}

/**
 * Fetches live grid dashboard data. Falls back to realistic Dharan demo
 * data (clearly flagged via `source: 'demo'`) if the backend is offline.
 */
export async function fetchDashboard() {
  const result = await request('/api/v1/dashboard', { method: 'GET' })
  if (result.online) {
    return { ...result.data, source: 'live' }
  }
  return { ...demoDashboardPayload(), source: 'demo' }
}

export async function postTelemetry(payload) {
  return request('/api/v1/telemetry', { method: 'POST', body: JSON.stringify(payload) })
}

export async function pingServer() {
  return request('/', { method: 'GET' })
}

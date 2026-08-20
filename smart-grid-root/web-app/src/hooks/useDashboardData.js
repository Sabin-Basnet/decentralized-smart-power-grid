import { useCallback, useEffect, useState } from 'react'
import { fetchDashboard } from '../services/api'

const POLL_INTERVAL_MS = 30000

/**
 * Loads live grid dashboard data and keeps it fresh. `source` is either
 * 'live' or 'demo' so screens can clearly label fallback data.
 */
export function useDashboardData() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | success | error
  const [source, setSource] = useState('demo')

  const load = useCallback(async () => {
    try {
      const payload = await fetchDashboard()
      setData(payload)
      setSource(payload.source)
      setStatus('success')
    } catch (err) {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  return { data, status, source, refresh: load }
}

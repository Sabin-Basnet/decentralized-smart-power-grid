import { LEAKAGE_THRESHOLD_AMPS, METER_IDS } from '../config/constants'

// Small deterministic pseudo-random generator so demo numbers stay stable
// across re-renders instead of jumping around on every refresh.
function seededRandom(seed) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

const NAMES = [
  'Ram Thapa', 'Bikash Limbu', 'Anjali Gurung', 'Prakash Tamang',
  'Deepa Rijal', 'Rohan Basnet',
]

const LOCATIONS = [
  'Putali Line, Dharan-8', 'Bhanu Chowk, Dharan-3', 'Chatara Road, Dharan-10',
  'Dangi Chowk, Dharan-6', 'Nayabazar, Dharan-1', 'Hattimuda, Dharan-14',
]

function buildUsers() {
  const rand = seededRandom(42)
  return METER_IDS.map((meterId, i) => {
    const weight = 0.7 + rand() * 0.8
    const balance = Math.round((120 + rand() * 260) * 10) / 10
    const currentUsageKw = Math.round((0.4 + rand() * 2.4) * 100) / 100
    const isOffline = i === METER_IDS.length - 1 && rand() > 0.5
    const lastSeenMinutesAgo = isOffline ? 240 + Math.round(rand() * 600) : Math.round(rand() * 12)
    return {
      id: meterId,
      meterId,
      name: NAMES[i % NAMES.length],
      location: LOCATIONS[i % LOCATIONS.length],
      balance,
      hoursRemaining: Math.round((balance / (currentUsageKw * weight * 4)) * 10) / 10,
      currentUsageKw,
      usageWeight: Math.round(weight * 100) / 100,
      status: isOffline ? 'Offline' : 'Active',
      meterHealth: isOffline ? 'Signal Lost' : rand() > 0.85 ? 'Needs Inspection' : 'Healthy',
      lastSeenMinutesAgo,
      lineCurrent: Math.round((4 + rand() * 3) * 100) / 100,
      neutralCurrent: 0,
    }
  }).map((u, i) => {
    // DHARAN-004 is staged as the demo theft case so the anomalies screen
    // always has something concrete to show.
    const rand2 = seededRandom(100 + i)
    const differential = i === 3 ? LEAKAGE_THRESHOLD_AMPS + 0.09 + rand2() * 0.05 : rand2() * (LEAKAGE_THRESHOLD_AMPS * 0.6)
    const neutralCurrent = Math.max(0.1, Math.round((u.lineCurrent - differential) * 100) / 100)
    return { ...u, neutralCurrent, differential: Math.round(Math.abs(u.lineCurrent - neutralCurrent) * 10000) / 10000 }
  })
}

export const DEMO_USERS = buildUsers()

export function getDemoUser(meterId) {
  return DEMO_USERS.find((u) => u.meterId === meterId) || DEMO_USERS[0]
}

function rangeConfig(range) {
  switch (range) {
    case 'weekly':
      return { points: 7, stepHours: 24, labelFmt: (d) => d.toLocaleDateString('en-US', { weekday: 'short' }) }
    case 'monthly':
      return { points: 30, stepHours: 24, labelFmt: (d) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) }
    case 'daily':
    default:
      return { points: 24, stepHours: 1, labelFmt: (d) => d.toLocaleTimeString('en-US', { hour: 'numeric' }) }
  }
}

export function generateConsumptionSeries(meterId, range = 'daily') {
  const user = getDemoUser(meterId)
  const { points, stepHours, labelFmt } = rangeConfig(range)
  const rand = seededRandom(meterId.length * 31 + points)
  const now = new Date()
  const series = []
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * stepHours * 3600 * 1000)
    const hourOfDay = t.getHours()
    // Evening peak curve (18:00-21:00), low overnight.
    const dayCurve = 0.55 + 0.45 * Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2 - Math.PI / 2) * -1 + 0.35 * Math.exp(-((hourOfDay - 19) ** 2) / 8)
    const base = user.usageWeight * 1.1
    const noise = (rand() - 0.5) * 0.3
    const kwh = Math.max(0.05, Math.round((base * dayCurve + noise) * 100) / 100)
    series.push({ label: labelFmt(t), timestamp: t.toISOString(), kwh })
  }
  return series
}

export function generateTransactions(meterId, count = 18) {
  const user = getDemoUser(meterId)
  const rand = seededRandom(meterId.length * 17 + 7)
  const types = ['Recharge', 'Consumption Deduction', 'Consumption Deduction', 'Bonus Credit', 'Consumption Deduction']
  const now = new Date()
  const list = []
  let runningBalance = user.balance
  for (let i = 0; i < count; i++) {
    const t = new Date(now.getTime() - i * (3 + rand() * 20) * 3600 * 1000)
    const type = types[Math.floor(rand() * types.length)]
    const isCredit = type === 'Recharge' || type === 'Bonus Credit'
    const amount = isCredit ? Math.round((50 + rand() * 150)) : -Math.round((2 + rand() * 12) * 10) / 10
    runningBalance -= isCredit ? 0 : Math.abs(amount) * 0
    list.push({
      id: `${meterId}-TXN-${count - i}`,
      date: t.toISOString(),
      type,
      amount: isCredit ? amount : null,
      tokenChange: amount,
      status: rand() > 0.06 ? 'Completed' : 'Pending',
    })
  }
  return list
}

export function generateAlerts(meterId) {
  const user = getDemoUser(meterId)
  const rand = seededRandom(meterId.length * 53 + 3)
  const isTheft = user.differential > LEAKAGE_THRESHOLD_AMPS
  const now = new Date()
  const alerts = DEMO_USERS.filter((u) => u.differential > LEAKAGE_THRESHOLD_AMPS).map((u, i) => ({
    id: `ALERT-${u.meterId}-${i}`,
    meterId: u.meterId,
    user: u.name,
    lineCurrent: u.lineCurrent,
    neutralCurrent: u.neutralCurrent,
    differential: u.differential,
    threshold: LEAKAGE_THRESHOLD_AMPS,
    timestamp: new Date(now.getTime() - i * 3600 * 1000).toISOString(),
    severity: 'CRITICAL',
    acknowledged: false,
  }))
  const history = Array.from({ length: 6 }).map((_, i) => ({
    id: `HIST-${i}`,
    meterId: DEMO_USERS[i % DEMO_USERS.length].meterId,
    user: DEMO_USERS[i % DEMO_USERS.length].name,
    label: rand() > 0.5 ? 'Theft Detected' : 'Normal',
    timestamp: new Date(now.getTime() - (i + 4) * 6 * 3600 * 1000).toISOString(),
    resolved: true,
  }))
  return { isTheft, currentAlert: isTheft ? alerts[0] : null, activeAlerts: alerts, history }
}

export function generateTelemetryEvents(count = 8) {
  const rand = seededRandom(909)
  const now = new Date()
  return Array.from({ length: count }).map((_, i) => {
    const user = DEMO_USERS[Math.floor(rand() * DEMO_USERS.length)]
    return {
      id: `EVT-${i}`,
      meterId: user.meterId,
      message: `Telemetry sync from ${user.meterId}`,
      timestamp: new Date(now.getTime() - i * 14 * 60 * 1000).toISOString(),
    }
  })
}

export function generateReport(range) {
  const rand = seededRandom(range.length * 71)
  const days = range === 'weekly' ? 7 : range === 'monthly' ? 30 : 1
  const totalEnergy = Math.round(days * 9.4 * (1 + rand() * 0.2) * 10) / 10
  const peakLoad = Math.round((2.1 + rand() * 1.4) * 100) / 100
  const avgLoad = Math.round((peakLoad * 0.55) * 100) / 100
  const anomalyCount = DEMO_USERS.filter((u) => u.differential > LEAKAGE_THRESHOLD_AMPS).length
  const tokenUsage = Math.round(totalEnergy * 3.2)
  return { totalEnergy, peakLoad, avgLoad, anomalyCount, tokenUsage }
}

export function demoDashboardPayload() {
  return {
    users: DEMO_USERS.map((u) => ({
      id: u.meterId,
      name: u.name,
      location: u.location,
      balance: u.balance,
      hours_remaining: u.hoursRemaining,
      usage_weight: u.usageWeight,
      status: u.status,
    })),
    total_system_load_kw: Math.round(DEMO_USERS.reduce((s, u) => s + u.usageWeight, 0) * 100) / 100,
    anomaly: { label: 'Theft Detected', is_anomalous: true },
  }
}

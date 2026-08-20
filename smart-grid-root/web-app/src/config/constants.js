// Centralized configuration: API endpoints, roles, demo accounts, color tokens.

export const API_BASE_URL = 'http://127.0.0.1:8000'

export const ROLES = {
  CLIENT: 'client',
  PROVIDER: 'provider',
}

export const DEMO_ACCOUNTS = {
  [ROLES.CLIENT]: {
    email: 'client@grid.local',
    password: 'client123',
    role: ROLES.CLIENT,
    name: 'Ram Thapa',
    meterId: 'DHARAN-001',
    location: 'Putali Line, Dharan-8',
  },
  [ROLES.PROVIDER]: {
    email: 'provider@grid.local',
    password: 'provider123',
    role: ROLES.PROVIDER,
    name: 'Dharan Grid Control',
    title: 'Grid Operations Administrator',
  },
}

export const LEAKAGE_THRESHOLD_AMPS = 0.15

export const SESSION_KEY = 'dharan_grid_session'

// Energy-operations visual language: dark charcoal/green base, gold for
// energy & tokens, teal for healthy network state, red reserved for critical.
export const COLORS = {
  bg: '#0a1310',
  bgElevated: '#0f1b16',
  panel: '#132420',
  panelAlt: '#182d27',
  border: '#22362f',
  borderSoft: '#1a2b25',
  gold: '#e7b23d',
  goldSoft: '#f4d38a',
  teal: '#2fd1ac',
  tealSoft: '#8ceed4',
  red: '#ef5350',
  redSoft: '#ffb3ae',
  textPrimary: '#eef6f1',
  textSecondary: '#a9beb3',
  textFaint: '#5f7a6d',
}

export const METER_IDS = [
  'DHARAN-001',
  'DHARAN-002',
  'DHARAN-003',
  'DHARAN-004',
  'DHARAN-005',
  'DHARAN-006',
]

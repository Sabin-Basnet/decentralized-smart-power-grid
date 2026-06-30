import { User, ConsumptionDataPoint, Transaction, AnomalyAlert, GridStats } from '@/types';

export const MOCK_USERS: User[] = [
  {
    id: 'usr_001',
    name: 'Rabin Kattel',
    email: 'rabin@smartgrid.np',
    role: 'client',
    meterId: 'MTR-2024-0067',
    walletAddress: '0x3f9A...7c4E',
    balance: 248.75,
    powerStatus: 'active',
    registeredAt: '2024-01-15',
  },
  {
    id: 'usr_002',
    name: 'Pratima Chaudhary',
    email: 'pratima@smartgrid.np',
    role: 'client',
    meterId: 'MTR-2024-0064',
    walletAddress: '0x8bD1...2aF3',
    balance: 12.40,
    powerStatus: 'active',
    registeredAt: '2024-01-20',
  },
  {
    id: 'usr_003',
    name: 'Sabin Basnet',
    email: 'sabin@smartgrid.np',
    role: 'client',
    meterId: 'MTR-2024-0077',
    walletAddress: '0x5cA9...9dB7',
    balance: 0.00,
    powerStatus: 'inactive',
    registeredAt: '2024-02-01',
  },
  {
    id: 'usr_004',
    name: 'Sarbesh Timsina',
    email: 'sarbesh@smartgrid.np',
    role: 'client',
    meterId: 'MTR-2024-0082',
    walletAddress: '0x1eC6...3fA2',
    balance: 89.20,
    powerStatus: 'active',
    registeredAt: '2024-02-10',
  },
  {
    id: 'adm_001',
    name: 'Grid Admin',
    email: 'admin@smartgrid.np',
    role: 'provider',
    meterId: 'ADMIN',
    walletAddress: '0xADM1...N001',
    balance: 0,
    powerStatus: 'active',
    registeredAt: '2024-01-01',
  },
];

export const MOCK_CLIENT = MOCK_USERS[0];
export const MOCK_PROVIDER = MOCK_USERS[4];

export const generateConsumptionData = (): ConsumptionDataPoint[] => {
  const data: ConsumptionDataPoint[] = [];
  const now = Date.now();
  let balance = 248.75;
  let cumEnergy = 0;

  for (let i = 23; i >= 0; i--) {
    const hourTod = new Date(now - i * 3600000).getHours();
    const baseLoad = hourTod >= 8 && hourTod <= 22 ? 1.8 : 0.6;
    const noise = (Math.random() - 0.5) * 0.4;
    const loadCurr = Math.max(0.1, baseLoad + noise);
    const delta = i === 23 ? 0 : loadCurr - data[data.length - 1].loadCurr;
    cumEnergy += loadCurr * 1000;
    balance -= loadCurr * 0.12;

    data.push({
      time: `${String(hourTod).padStart(2, '0')}:00`,
      loadCurr: parseFloat(loadCurr.toFixed(3)),
      energyCum: parseFloat(cumEnergy.toFixed(1)),
      deltaLoad: parseFloat(delta.toFixed(3)),
      hourTod,
      balToken: parseFloat(Math.max(0, balance).toFixed(2)),
    });
  }
  return data;
};

export const MOCK_CONSUMPTION: ConsumptionDataPoint[] = generateConsumptionData();

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    type: 'recharge',
    amount: 500.00,
    timestamp: '2025-06-28T09:15:00Z',
    txHash: '0x4a2f...8c1d',
    status: 'confirmed',
    description: 'Token recharge via eSewa',
  },
  {
    id: 'tx_002',
    type: 'deduction',
    amount: -18.42,
    timestamp: '2025-06-28T18:00:00Z',
    txHash: '0x7b3e...2f9a',
    status: 'confirmed',
    description: 'Daily energy deduction',
  },
  {
    id: 'tx_003',
    type: 'deduction',
    amount: -21.15,
    timestamp: '2025-06-29T18:00:00Z',
    txHash: '0x1c8d...6e4b',
    status: 'confirmed',
    description: 'Daily energy deduction',
  },
  {
    id: 'tx_004',
    type: 'deduction',
    amount: -19.88,
    timestamp: '2025-06-30T12:30:00Z',
    txHash: '0x9f5c...3a7e',
    status: 'confirmed',
    description: 'Partial day deduction',
  },
  {
    id: 'tx_005',
    type: 'recharge',
    amount: 200.00,
    timestamp: '2025-06-25T11:00:00Z',
    txHash: '0x2d4a...8b5f',
    status: 'confirmed',
    description: 'Token recharge via Khalti',
  },
  {
    id: 'tx_006',
    type: 'penalty',
    amount: -5.00,
    timestamp: '2025-06-22T07:45:00Z',
    txHash: '0x6e1b...4c9d',
    status: 'confirmed',
    description: 'Anomaly detection penalty',
  },
];

export const MOCK_ANOMALIES: AnomalyAlert[] = [
  {
    id: 'anm_001',
    userId: 'usr_003',
    userName: 'Sabin Basnet',
    meterId: 'MTR-2024-0077',
    severity: 'critical',
    type: 'meter_bypass',
    description: 'Sudden voltage drop without circuit break detected. Possible meter-bypassing activity.',
    deltaLoad: -2.41,
    detectedAt: '2025-06-30T04:22:00Z',
    resolved: false,
  },
  {
    id: 'anm_002',
    userId: 'usr_002',
    userName: 'Pratima Chaudhary',
    meterId: 'MTR-2024-0064',
    severity: 'high',
    type: 'overconsumption',
    description: 'Load exceeds 3x normal residential baseline for >45 minutes.',
    deltaLoad: 1.87,
    detectedAt: '2025-06-29T21:45:00Z',
    resolved: false,
  },
  {
    id: 'anm_003',
    userId: 'usr_004',
    userName: 'Sarbesh Timsina',
    meterId: 'MTR-2024-0082',
    severity: 'medium',
    type: 'voltage_drop',
    description: 'Intermittent voltage fluctuation outside acceptable range.',
    deltaLoad: -0.63,
    detectedAt: '2025-06-29T14:10:00Z',
    resolved: true,
  },
  {
    id: 'anm_004',
    userId: 'usr_001',
    userName: 'Rabin Kattel',
    meterId: 'MTR-2024-0067',
    severity: 'low',
    type: 'null_reading',
    description: 'Telemetry stream interrupted for 8 minutes. Auto-recovered.',
    deltaLoad: 0,
    detectedAt: '2025-06-28T03:55:00Z',
    resolved: true,
  },
];

export const MOCK_GRID_STATS: GridStats = {
  totalConsumers: 4,
  activeConsumers: 3,
  inactiveConsumers: 1,
  totalEnergyDispatched: 12480.5,
  totalRevenue: 89640.00,
  openAlerts: 2,
  averageBalance: 87.59,
};

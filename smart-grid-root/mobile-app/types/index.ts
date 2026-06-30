export type UserRole = 'client' | 'provider';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  meterId: string;
  walletAddress: string;
  balance: number;
  powerStatus: 'active' | 'inactive';
  registeredAt: string;
}

export interface ConsumptionDataPoint {
  time: string;
  loadCurr: number;
  energyCum: number;
  deltaLoad: number;
  hourTod: number;
  balToken: number;
}

export interface Transaction {
  id: string;
  type: 'recharge' | 'deduction' | 'penalty';
  amount: number;
  timestamp: string;
  txHash: string;
  status: 'confirmed' | 'pending' | 'failed';
  description: string;
}

export interface AnomalyAlert {
  id: string;
  userId: string;
  userName: string;
  meterId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'voltage_drop' | 'meter_bypass' | 'overconsumption' | 'null_reading';
  description: string;
  deltaLoad: number;
  detectedAt: string;
  resolved: boolean;
}

export interface GridStats {
  totalConsumers: number;
  activeConsumers: number;
  inactiveConsumers: number;
  totalEnergyDispatched: number;
  totalRevenue: number;
  openAlerts: number;
  averageBalance: number;
}

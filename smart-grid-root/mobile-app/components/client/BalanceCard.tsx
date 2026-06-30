import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet, TrendingDown } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface BalanceCardProps {
  balance: number;
  meterId: string;
  walletAddress: string;
  powerStatus: 'active' | 'inactive';
}

export function BalanceCard({ balance, meterId, walletAddress, powerStatus }: BalanceCardProps) {
  const isLow = balance < 50;
  const isCritical = balance < 20;

  const gradColors: [string, string] = isCritical
    ? ['#4A1010', '#3D0F0F']
    : isLow
    ? ['#3D2A00', '#2A1D00']
    : ['#0F2A4A', '#0A1D33'];

  const balanceColor = isCritical
    ? Colors.error
    : isLow
    ? Colors.warning
    : Colors.accent;

  return (
    <LinearGradient colors={gradColors} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconBg}>
          <Wallet size={20} color={Colors.accent} strokeWidth={1.8} />
        </View>
        <View style={[styles.statusPill, { backgroundColor: powerStatus === 'active' ? Colors.successBg : Colors.errorBg }]}>
          <View style={[styles.dot, { backgroundColor: powerStatus === 'active' ? Colors.success : Colors.error }]} />
          <Text style={[styles.statusText, { color: powerStatus === 'active' ? Colors.success : Colors.error }]}>
            {powerStatus === 'active' ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Token Balance</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.currency}>NPR</Text>
        <Text style={[styles.balance, { color: balanceColor }]}>
          {balance.toFixed(2)}
        </Text>
      </View>

      {isLow ? (
        <View style={styles.warningRow}>
          <TrendingDown size={13} color={isCritical ? Colors.error : Colors.warning} strokeWidth={2} />
          <Text style={[styles.warningText, { color: isCritical ? Colors.error : Colors.warning }]}>
            {isCritical ? 'Critical: Recharge immediately' : 'Low balance: Recharge soon'}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Meter ID</Text>
          <Text style={styles.infoValue}>{meterId}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Wallet</Text>
          <Text style={styles.infoValue}>{walletAddress}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 8,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balance: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBlock: {
    gap: 3,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface BudgetCountdownProps {
  balance: number;
  avgLoadKw: number;
  ratePerKwh?: number;
}

function calcHoursRemaining(balance: number, avgLoad: number, rate: number): number {
  if (avgLoad <= 0 || rate <= 0) return 0;
  const energyKwh = balance / rate;
  return energyKwh / avgLoad;
}

function formatDuration(hours: number): string {
  if (hours <= 0) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function BudgetCountdown({ balance, avgLoadKw, ratePerKwh = 12 }: BudgetCountdownProps) {
  const hoursLeft = calcHoursRemaining(balance, avgLoadKw, ratePerKwh);
  const isCritical = hoursLeft < 12;
  const isLow = hoursLeft < 48;

  const barColor = isCritical ? Colors.error : isLow ? Colors.warning : Colors.accent;
  const bgColors: [string, string] = isCritical ? ['#2A0D0D', '#1A0808'] : ['#0F2A1E', '#081A12'];

  const forecastDate = new Date(Date.now() + hoursLeft * 3600000);
  const forecastStr = forecastDate.toLocaleDateString('en-NP', { month: 'short', day: 'numeric' }) +
    ' at ' + forecastDate.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' });

  return (
    <LinearGradient colors={bgColors} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBg}>
            <Brain size={16} color={Colors.accent} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>ML Budget Forecast</Text>
        </View>
        <Text style={styles.badge}>Linear Regression</Text>
      </View>

      <View style={styles.countdownRow}>
        <Clock size={22} color={barColor} strokeWidth={1.8} />
        <Text style={[styles.duration, { color: barColor }]}>{formatDuration(hoursLeft)}</Text>
        <Text style={styles.remaining}>remaining</Text>
      </View>

      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(100, (hoursLeft / 168) * 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <Text style={styles.forecastLine}>
        Power expected to deplete on{' '}
        <Text style={{ color: barColor, fontWeight: '700' }}>{forecastStr}</Text>
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Load</Text>
          <Text style={styles.statValue}>{avgLoadKw.toFixed(2)} kW</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rate</Text>
          <Text style={styles.statValue}>NPR {ratePerKwh}/kWh</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Daily Cost</Text>
          <Text style={styles.statValue}>NPR {(avgLoadKw * 24 * ratePerKwh).toFixed(0)}</Text>
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
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,170,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.accent,
    backgroundColor: 'rgba(0,212,170,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    letterSpacing: 0.3,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  duration: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  remaining: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
    alignSelf: 'flex-end',
    marginBottom: 5,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.surface3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  forecastLine: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface3,
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
});

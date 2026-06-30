import { View, Text, StyleSheet } from 'react-native';
import { Zap, Activity, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ConsumptionDataPoint } from '@/types';

interface UsageMetricsProps {
  latest: ConsumptionDataPoint;
}

export function UsageMetrics({ latest }: UsageMetricsProps) {
  const metrics = [
    {
      icon: <Zap size={18} color={Colors.warning} strokeWidth={1.8} />,
      label: 'Current Load',
      value: `${latest.loadCurr.toFixed(2)} kW`,
      bg: Colors.warningBg,
      color: Colors.warning,
    },
    {
      icon: <Activity size={18} color={Colors.accent} strokeWidth={1.8} />,
      label: 'Energy Today',
      value: `${(latest.energyCum / 1000).toFixed(2)} kWh`,
      bg: 'rgba(0,212,170,0.08)',
      color: Colors.accent,
    },
    {
      icon: <Clock size={18} color={Colors.primaryLight} strokeWidth={1.8} />,
      label: 'Time of Day',
      value: `Hour ${latest.hourTod}`,
      bg: 'rgba(56,139,253,0.1)',
      color: Colors.primaryLight,
    },
  ];

  return (
    <View style={styles.row}>
      {metrics.map((m) => (
        <View key={m.label} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: m.bg }]}>{m.icon}</View>
          <Text style={[styles.value, { color: m.color }]}>{m.value}</Text>
          <Text style={styles.label}>{m.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});

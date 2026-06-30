import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/shared/Header';
import { ConsumptionChart } from '@/components/client/ConsumptionChart';
import { Colors } from '@/constants/colors';
import { MOCK_USERS, MOCK_GRID_STATS, MOCK_CONSUMPTION } from '@/constants/mockData';
import { GradientButton } from '@/components/shared/GradientButton';
import { TrendingUp, Users, Cpu, Zap } from 'lucide-react-native';

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.barBg}>
        <View style={[barStyles.bar, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.val, { color }]}>NPR {value.toFixed(0)}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  barBg: {
    height: 8,
    backgroundColor: Colors.surface3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  val: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
});

export default function ReportsScreen() {
  const router = useRouter();
  const clients = MOCK_USERS.filter((u) => u.role === 'client');
  const maxBal = Math.max(...clients.map((u) => u.balance));

  const metrics = [
    {
      icon: <Zap size={18} color={Colors.accent} strokeWidth={1.8} />,
      label: 'Energy Dispatched',
      value: `${(MOCK_GRID_STATS.totalEnergyDispatched / 1000).toFixed(2)} MWh`,
      color: Colors.accent,
      bg: 'rgba(0,212,170,0.1)',
    },
    {
      icon: <TrendingUp size={18} color={Colors.success} strokeWidth={1.8} />,
      label: 'Total Revenue',
      value: `NPR ${(MOCK_GRID_STATS.totalRevenue / 1000).toFixed(1)}K`,
      color: Colors.success,
      bg: Colors.successBg,
    },
    {
      icon: <Users size={18} color={Colors.primaryLight} strokeWidth={1.8} />,
      label: 'Avg Balance',
      value: `NPR ${MOCK_GRID_STATS.averageBalance.toFixed(2)}`,
      color: Colors.primaryLight,
      bg: 'rgba(56,139,253,0.1)',
    },
    {
      icon: <Cpu size={18} color={Colors.warning} strokeWidth={1.8} />,
      label: 'Smart Contracts',
      value: `${clients.length} Active`,
      color: Colors.warning,
      bg: Colors.warningBg,
    },
  ];

  return (
    <View style={styles.root}>
      <Header title="Reports" subtitle="Grid performance analytics" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metricsGrid}>
          {metrics.map((m) => (
            <View key={m.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>{m.icon}</View>
              <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grid Consumption Trend (24h)</Text>
          <ConsumptionChart
            data={MOCK_CONSUMPTION}
            metric="loadCurr"
            color={Colors.accent}
            label="Aggregate Load (kW)"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consumer Balance Distribution</Text>
          <View style={styles.barList}>
            {clients.map((u) => (
              <BarRow
                key={u.id}
                label={u.name}
                value={u.balance}
                max={maxBal || 1}
                color={u.balance < 20 ? Colors.error : u.balance < 50 ? Colors.warning : Colors.success}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Architecture</Text>
          {[
            ['Hardware Layer', 'ESP32 + Potentiometer + Relay'],
            ['Blockchain Layer', 'Solidity Smart Contract (Hardhat)'],
            ['ML Models', 'Linear Regression + Isolation Forest'],
            ['Backend', 'FastAPI + Web3.py (Python)'],
            ['Database', 'SQLite (local) + Blockchain ledger'],
            ['Frontend', 'React Native (Expo)'],
          ].map(([label, value]) => (
            <View key={label} style={styles.archRow}>
              <Text style={styles.archLabel}>{label}</Text>
              <Text style={styles.archValue}>{value}</Text>
            </View>
          ))}
        </View>

        <GradientButton
          label="Export Report (PDF)"
          onPress={() => {}}
          variant="outline"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barList: {
    gap: 16,
  },
  archRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  archLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    width: 110,
  },
  archValue: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
});

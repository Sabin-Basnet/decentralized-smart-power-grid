import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Header } from '@/components/shared/Header';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { ConsumptionChart } from '@/components/client/ConsumptionChart';
import { Colors } from '@/constants/colors';
import { MOCK_CONSUMPTION } from '@/constants/mockData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

function DeltaBadge({ delta }: { delta: number }) {
  const abs = Math.abs(delta).toFixed(3);
  if (Math.abs(delta) < 0.01) {
    return (
      <View style={[styles.deltaBadge, { backgroundColor: Colors.surface3 }]}>
        <Minus size={12} color={Colors.textSecondary} strokeWidth={2} />
        <Text style={[styles.deltaText, { color: Colors.textSecondary }]}>Stable</Text>
      </View>
    );
  }
  if (delta > 0) {
    return (
      <View style={[styles.deltaBadge, { backgroundColor: Colors.errorBg }]}>
        <TrendingUp size={12} color={Colors.error} strokeWidth={2} />
        <Text style={[styles.deltaText, { color: Colors.error }]}>+{abs} kW</Text>
      </View>
    );
  }
  return (
    <View style={[styles.deltaBadge, { backgroundColor: Colors.successBg }]}>
      <TrendingDown size={12} color={Colors.success} strokeWidth={2} />
      <Text style={[styles.deltaText, { color: Colors.success }]}>{delta.toFixed(3)} kW</Text>
    </View>
  );
}

export default function ConsumptionScreen() {
  const data = MOCK_CONSUMPTION;
  const totalEnergy = data[data.length - 1].energyCum;
  const peakLoad = Math.max(...data.map((d) => d.loadCurr));
  const avgLoad = data.reduce((s, d) => s + d.loadCurr, 0) / data.length;
  const costToday = (totalEnergy / 1000) * 12;

  const summary = [
    { label: 'Total Energy', value: `${(totalEnergy / 1000).toFixed(2)} kWh`, color: Colors.accent },
    { label: 'Peak Load', value: `${peakLoad.toFixed(2)} kW`, color: Colors.error },
    { label: 'Avg Load', value: `${avgLoad.toFixed(2)} kW`, color: Colors.primaryLight },
    { label: 'Est. Cost', value: `NPR ${costToday.toFixed(0)}`, color: Colors.warning },
  ];

  return (
    <View style={styles.root}>
      <Header title="Energy Usage" subtitle="24-hour consumption analysis" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryGrid}>
          {summary.map((s) => (
            <View key={s.label} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View>
          <SectionTitle title="Load Current (kW)" />
          <ConsumptionChart
            data={data}
            metric="loadCurr"
            color={Colors.accent}
            label="Load Current (kW)"
          />
        </View>

        <View>
          <SectionTitle title="Token Balance Over Time" />
          <ConsumptionChart
            data={data}
            metric="balToken"
            color={Colors.primaryLight}
            label="Balance (NPR)"
          />
        </View>

        <View>
          <SectionTitle title="Hourly Breakdown" />
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Time</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2 }]}>Load (kW)</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Delta Load</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Balance</Text>
            </View>
            {data.map((d, i) => (
              <View key={i} style={[styles.tableRow, i < data.length - 1 && styles.tableRowBorder]}>
                <Text style={[styles.tableCell, { flex: 1, color: Colors.textSecondary }]}>{d.time}</Text>
                <Text style={[styles.tableCell, { flex: 1.2, color: Colors.text, fontWeight: '600' }]}>
                  {d.loadCurr.toFixed(2)}
                </Text>
                <View style={{ flex: 1.5 }}>
                  <DeltaBadge delta={d.deltaLoad} />
                </View>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', color: Colors.accent }]}>
                  {d.balToken.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableCell: {
    fontSize: 12,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

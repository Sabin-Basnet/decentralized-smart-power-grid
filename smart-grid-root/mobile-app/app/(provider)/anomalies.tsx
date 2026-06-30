import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Header } from '@/components/shared/Header';
import { AnomalyItem } from '@/components/provider/AnomalyItem';
import { Colors } from '@/constants/colors';
import { MOCK_ANOMALIES } from '@/constants/mockData';
import { AnomalyAlert } from '@/types';

type FilterType = 'all' | 'open' | 'resolved';

export default function AnomaliesScreen() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(MOCK_ANOMALIES);
  const [filter, setFilter] = useState<FilterType>('all');

  const handleResolve = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'open') return !a.resolved;
    if (filter === 'resolved') return a.resolved;
    return true;
  });

  const openCount = alerts.filter((a) => !a.resolved).length;
  const resolvedCount = alerts.filter((a) => a.resolved).length;

  const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...filtered].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  return (
    <View style={styles.root}>
      <Header
        title="Anomaly Detection"
        subtitle="Isolation Forest ML Model"
        showBell
        alertCount={openCount}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: Colors.errorBg }]}>
            <Text style={[styles.summaryVal, { color: Colors.error }]}>{openCount}</Text>
            <Text style={styles.summaryLabel}>Open Alerts</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: Colors.successBg }]}>
            <Text style={[styles.summaryVal, { color: Colors.success }]}>{resolvedCount}</Text>
            <Text style={styles.summaryLabel}>Resolved</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryVal, { color: Colors.accent }]}>{alerts.length}</Text>
            <Text style={styles.summaryLabel}>Total Events</Text>
          </View>
        </View>

        <View style={styles.mlNote}>
          <Text style={styles.mlNoteTitle}>Isolation Forest Detection</Text>
          <Text style={styles.mlNoteBody}>
            Anomalies are detected using unsupervised ML by isolating statistical deviations in deltaLoad, loadCurr, and hourTod features. Sudden voltage drops without circuit breaks are primary triggers.
          </Text>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'open', 'resolved'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {sorted.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No alerts match the filter</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {sorted.map((a, i) => (
              <AnomalyItem
                key={a.id}
                alert={a}
                onResolve={handleResolve}
                isLast={i === sorted.length - 1}
              />
            ))}
          </View>
        )}
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
    gap: 16,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  mlNote: {
    backgroundColor: 'rgba(0,212,170,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.15)',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  mlNoteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
  },
  mlNoteBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: 'rgba(0,212,170,0.12)',
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.accent,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

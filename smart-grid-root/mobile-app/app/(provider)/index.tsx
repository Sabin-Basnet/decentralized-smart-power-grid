import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Header } from '@/components/shared/Header';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { StatCard } from '@/components/provider/StatCard';
import { AnomalyItem } from '@/components/provider/AnomalyItem';
import { ConsumerRow } from '@/components/provider/ConsumerRow';
import { Colors } from '@/constants/colors';
import { MOCK_GRID_STATS, MOCK_ANOMALIES, MOCK_USERS } from '@/constants/mockData';
import { Users, Zap, ZapOff, AlertTriangle, DollarSign, Activity } from 'lucide-react-native';
import { AnomalyAlert } from '@/types';

export default function ProviderDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [anomalies, setAnomalies] = useState(MOCK_ANOMALIES);

  const clients = MOCK_USERS.filter((u) => u.role === 'client');
  const openAlerts = anomalies.filter((a) => !a.resolved);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleResolve = (id: string) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
  };

  return (
    <View style={styles.root}>
      <Header
        title="Grid Overview"
        subtitle="Admin · SmartGrid Control"
        showBell
        alertCount={openAlerts.length}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Total Consumers"
              value={MOCK_GRID_STATS.totalConsumers}
              icon={<Users size={18} color={Colors.primaryLight} strokeWidth={1.8} />}
              color={Colors.primaryLight}
              bg="rgba(56,139,253,0.12)"
            />
            <StatCard
              label="Active"
              value={MOCK_GRID_STATS.activeConsumers}
              icon={<Zap size={18} color={Colors.success} strokeWidth={1.8} />}
              color={Colors.success}
              bg={Colors.successBg}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Inactive"
              value={MOCK_GRID_STATS.inactiveConsumers}
              icon={<ZapOff size={18} color={Colors.error} strokeWidth={1.8} />}
              color={Colors.error}
              bg={Colors.errorBg}
            />
            <StatCard
              label="Open Alerts"
              value={openAlerts.length}
              icon={<AlertTriangle size={18} color={Colors.warning} strokeWidth={1.8} />}
              color={Colors.warning}
              bg={Colors.warningBg}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Energy Dispatched"
              value={`${(MOCK_GRID_STATS.totalEnergyDispatched / 1000).toFixed(1)} MWh`}
              icon={<Activity size={18} color={Colors.accent} strokeWidth={1.8} />}
              color={Colors.accent}
              bg="rgba(0,212,170,0.1)"
            />
            <StatCard
              label="Total Revenue"
              value={`NPR ${(MOCK_GRID_STATS.totalRevenue / 1000).toFixed(0)}K`}
              icon={<DollarSign size={18} color={Colors.accentLight} strokeWidth={1.8} />}
              color={Colors.accentLight}
              bg="rgba(0,212,170,0.08)"
            />
          </View>
        </View>

        {openAlerts.length > 0 ? (
          <View>
            <SectionTitle
              title={`Active Alerts (${openAlerts.length})`}
              actionLabel="View All"
              onAction={() => router.push('/(provider)/anomalies')}
            />
            <View style={styles.card}>
              {openAlerts.slice(0, 2).map((a, i) => (
                <AnomalyItem
                  key={a.id}
                  alert={a}
                  onResolve={handleResolve}
                  isLast={i === Math.min(openAlerts.length, 2) - 1}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noAlertsCard}>
            <Text style={styles.noAlertsText}>No active anomaly alerts</Text>
          </View>
        )}

        <View>
          <SectionTitle
            title="Consumer Status"
            actionLabel="Manage"
            onAction={() => router.push('/(provider)/users')}
          />
          <View style={styles.card}>
            {clients.map((user, i) => (
              <ConsumerRow
                key={user.id}
                user={user}
                isLast={i === clients.length - 1}
              />
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
  statsGrid: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noAlertsCard: {
    backgroundColor: Colors.successBg,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(63,185,80,0.2)',
  },
  noAlertsText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
  },
});

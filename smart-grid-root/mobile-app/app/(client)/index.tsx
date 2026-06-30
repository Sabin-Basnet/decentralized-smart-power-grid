import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { Header } from '@/components/shared/Header';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { GradientButton } from '@/components/shared/GradientButton';
import { BalanceCard } from '@/components/client/BalanceCard';
import { UsageMetrics } from '@/components/client/UsageMetrics';
import { ConsumptionChart } from '@/components/client/ConsumptionChart';
import { BudgetCountdown } from '@/components/client/BudgetCountdown';
import { TransactionItem } from '@/components/client/TransactionItem';
import { Colors } from '@/constants/colors';
import { MOCK_CLIENT, MOCK_CONSUMPTION, MOCK_TRANSACTIONS, generateConsumptionData } from '@/constants/mockData';
import { useRouter } from 'expo-router';

export default function ClientDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(MOCK_CONSUMPTION);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setData(generateConsumptionData());
      setRefreshing(false);
    }, 1200);
  }, []);

  const latest = data[data.length - 1];
  const avgLoad = data.reduce((sum, d) => sum + d.loadCurr, 0) / data.length;
  const recentTxns = MOCK_TRANSACTIONS.slice(0, 3);

  return (
    <View style={styles.root}>
      <Header
        title="Dashboard"
        subtitle={`Welcome, ${MOCK_CLIENT.name.split(' ')[0]}`}
        showBell
        alertCount={0}
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
        <BalanceCard
          balance={MOCK_CLIENT.balance}
          meterId={MOCK_CLIENT.meterId}
          walletAddress={MOCK_CLIENT.walletAddress}
          powerStatus={MOCK_CLIENT.powerStatus}
        />

        <GradientButton
          label="Recharge Balance"
          onPress={() => {}}
          style={styles.rechargeBtn}
        />

        <View>
          <SectionTitle title="Live Metrics" />
          <UsageMetrics latest={latest} />
        </View>

        <View>
          <SectionTitle title="Power Consumption — 24h" />
          <ConsumptionChart
            data={data}
            metric="loadCurr"
            color={Colors.accent}
            label="Load (kW)"
          />
        </View>

        <BudgetCountdown
          balance={MOCK_CLIENT.balance}
          avgLoadKw={avgLoad}
          ratePerKwh={12}
        />

        <View>
          <SectionTitle
            title="Recent Transactions"
            actionLabel="View All"
            onAction={() => router.push('/(client)/transactions')}
          />
          <View style={styles.txCard}>
            {recentTxns.map((tx, i) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                isLast={i === recentTxns.length - 1}
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
  rechargeBtn: {
    marginTop: -4,
  },
  txCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

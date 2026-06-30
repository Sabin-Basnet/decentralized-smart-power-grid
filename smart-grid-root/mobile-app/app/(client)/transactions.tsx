import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Header } from '@/components/shared/Header';
import { TransactionItem } from '@/components/client/TransactionItem';
import { Colors } from '@/constants/colors';
import { MOCK_TRANSACTIONS } from '@/constants/mockData';
import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react-native';

export default function TransactionsScreen() {
  const totals = MOCK_TRANSACTIONS.reduce(
    (acc, tx) => {
      if (tx.type === 'recharge') acc.recharged += tx.amount;
      else acc.spent += Math.abs(tx.amount);
      return acc;
    },
    { recharged: 0, spent: 0 }
  );

  const counts = {
    recharge: MOCK_TRANSACTIONS.filter((t) => t.type === 'recharge').length,
    deduction: MOCK_TRANSACTIONS.filter((t) => t.type === 'deduction').length,
    penalty: MOCK_TRANSACTIONS.filter((t) => t.type === 'penalty').length,
  };

  return (
    <View style={styles.root}>
      <Header title="Blockchain Ledger" subtitle="Immutable transaction history" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <ArrowDownLeft size={16} color={Colors.success} strokeWidth={2} />
              <Text style={styles.statCount}>{counts.recharge}</Text>
            </View>
            <Text style={[styles.statAmount, { color: Colors.success }]}>
              +NPR {totals.recharged.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Recharged</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <ArrowUpRight size={16} color={Colors.error} strokeWidth={2} />
              <Text style={styles.statCount}>{counts.deduction}</Text>
            </View>
            <Text style={[styles.statAmount, { color: Colors.error }]}>
              -NPR {totals.spent.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Deducted</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <AlertTriangle size={16} color={Colors.warning} strokeWidth={2} />
              <Text style={styles.statCount}>{counts.penalty}</Text>
            </View>
            <Text style={[styles.statAmount, { color: Colors.warning }]}>
              Penalty
            </Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </View>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            All transactions are recorded on the blockchain and cannot be altered. Tap the hash to verify.
          </Text>
        </View>

        <View style={styles.txCard}>
          {MOCK_TRANSACTIONS.map((tx, i) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              isLast={i === MOCK_TRANSACTIONS.length - 1}
            />
          ))}
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
    gap: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  statAmount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  note: {
    backgroundColor: 'rgba(56,139,253,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,139,253,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  txCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

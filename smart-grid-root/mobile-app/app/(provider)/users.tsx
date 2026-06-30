import { ScrollView, View, Text, StyleSheet, TextInput } from 'react-native';
import { useState } from 'react';
import { Header } from '@/components/shared/Header';
import { ConsumerRow } from '@/components/provider/ConsumerRow';
import { Colors } from '@/constants/colors';
import { MOCK_USERS } from '@/constants/mockData';
import { Search } from 'lucide-react-native';
import { User } from '@/types';

export default function UsersScreen() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const clients = MOCK_USERS.filter((u) => u.role === 'client');

  const filtered = clients.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.meterId.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  const active = clients.filter((u) => u.powerStatus === 'active').length;
  const inactive = clients.length - active;
  const avgBal = clients.reduce((s, u) => s + u.balance, 0) / clients.length;

  return (
    <View style={styles.root}>
      <Header title="Consumers" subtitle={`${clients.length} registered meters`} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: Colors.success }]}>{active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: Colors.error }]}>{inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: Colors.accent }]}>NPR {avgBal.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Avg Balance</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Search size={16} color={Colors.textMuted} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, meter ID, email..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={styles.card}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No consumers match your search.</Text>
          ) : (
            filtered.map((user, i) => (
              <ConsumerRow
                key={user.id}
                user={user}
                isLast={i === filtered.length - 1}
                onPress={setSelected}
              />
            ))
          )}
        </View>

        {selected ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Consumer Detail</Text>
            {[
              ['Name', selected.name],
              ['Email', selected.email],
              ['Meter ID', selected.meterId],
              ['Wallet', selected.walletAddress],
              ['Balance', `NPR ${selected.balance.toFixed(2)}`],
              ['Power', selected.powerStatus.toUpperCase()],
              ['Registered', new Date(selected.registeredAt).toLocaleDateString('en-NP')],
            ].map(([label, value]) => (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}
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
    alignItems: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  empty: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});

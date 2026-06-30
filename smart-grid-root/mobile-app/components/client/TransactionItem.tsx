import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, ExternalLink } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  isLast?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' });
}

function truncateHash(hash: string): string {
  return hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;
}

export function TransactionItem({ transaction, isLast }: TransactionItemProps) {
  const isCredit = transaction.type === 'recharge';
  const isPenalty = transaction.type === 'penalty';

  const iconColor = isCredit ? Colors.success : isPenalty ? Colors.error : Colors.warning;
  const iconBg = isCredit ? Colors.successBg : isPenalty ? Colors.errorBg : Colors.warningBg;
  const amountColor = isCredit ? Colors.success : Colors.error;
  const amountPrefix = isCredit ? '+' : '';

  const Icon = isCredit ? ArrowDownLeft : isPenalty ? AlertTriangle : ArrowUpRight;

  return (
    <View style={[styles.item, !isLast && styles.bordered]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={17} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.info}>
        <Text style={styles.description}>{transaction.description}</Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(transaction.timestamp)}</Text>
          <TouchableOpacity style={styles.hashRow} activeOpacity={0.7}>
            <Text style={styles.hash}>{truncateHash(transaction.txHash)}</Text>
            <ExternalLink size={10} color={Colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.rightBlock}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}NPR {Math.abs(transaction.amount).toFixed(2)}
        </Text>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: transaction.status === 'confirmed' ? Colors.successBg
              : transaction.status === 'pending' ? Colors.warningBg
              : Colors.errorBg,
          },
        ]}>
          <Text style={[
            styles.statusText,
            {
              color: transaction.status === 'confirmed' ? Colors.success
                : transaction.status === 'pending' ? Colors.warning
                : Colors.error,
            },
          ]}>
            {transaction.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  description: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  meta: {
    gap: 3,
  },
  date: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '400',
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hash: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  rightBlock: {
    alignItems: 'flex-end',
    gap: 5,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

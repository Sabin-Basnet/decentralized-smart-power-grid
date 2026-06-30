import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Zap, ZapOff } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { User } from '@/types';

interface ConsumerRowProps {
  user: User;
  onPress?: (user: User) => void;
  isLast?: boolean;
}

function getBalanceColor(balance: number): string {
  if (balance === 0) return Colors.error;
  if (balance < 20) return Colors.error;
  if (balance < 50) return Colors.warning;
  return Colors.success;
}

export function ConsumerRow({ user, onPress, isLast }: ConsumerRowProps) {
  const balColor = getBalanceColor(user.balance);

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.bordered]}
      onPress={() => onPress?.(user)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.statusIndicator,
        { backgroundColor: user.powerStatus === 'active' ? Colors.success : Colors.error },
      ]} />

      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meterId}>{user.meterId}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.powerBadge}>
          {user.powerStatus === 'active' ? (
            <Zap size={12} color={Colors.success} strokeWidth={2} />
          ) : (
            <ZapOff size={12} color={Colors.error} strokeWidth={2} />
          )}
          <Text style={[styles.powerText, { color: user.powerStatus === 'active' ? Colors.success : Colors.error }]}>
            {user.powerStatus === 'active' ? 'ON' : 'OFF'}
          </Text>
        </View>
        <Text style={[styles.balance, { color: balColor }]}>
          NPR {user.balance.toFixed(2)}
        </Text>
      </View>

      <ChevronRight size={16} color={Colors.textMuted} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  meterId: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  powerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  powerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  balance: {
    fontSize: 13,
    fontWeight: '700',
  },
});

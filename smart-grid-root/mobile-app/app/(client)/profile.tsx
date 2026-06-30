import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/shared/Header';
import { Colors } from '@/constants/colors';
import { MOCK_CLIENT } from '@/constants/mockData';
import { User, Cpu, Link, Calendar, LogOut, ChevronRight, Bell, ShieldCheck } from 'lucide-react-native';

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && { fontFamily: 'monospace', fontSize: 12 }]}>{value}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  sublabel,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      <ChevronRight size={16} color={Colors.textMuted} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = MOCK_CLIENT;

  return (
    <View style={styles.root}>
      <Header title="Profile" subtitle="Account & device settings" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <User size={12} color={Colors.primaryLight} strokeWidth={2} />
            <Text style={styles.roleText}>Consumer</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <InfoRow label="Full Name" value={user.name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Registered" value={new Date(user.registeredAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Smart Meter</Text>
          <InfoRow label="Meter ID" value={user.meterId} mono />
          <InfoRow label="Wallet Address" value={user.walletAddress} mono />
          <InfoRow label="Power Status" value={user.powerStatus === 'active' ? 'Active (Relay ON)' : 'Inactive (Relay OFF)'} />
          <InfoRow label="Current Balance" value={`NPR ${user.balance.toFixed(2)}`} />
        </View>

        <View style={styles.card}>
          <MenuRow
            icon={<Bell size={18} color={Colors.primaryLight} strokeWidth={1.8} />}
            label="Notifications"
            sublabel="Balance alerts, anomaly warnings"
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            icon={<ShieldCheck size={18} color={Colors.accent} strokeWidth={1.8} />}
            label="Security"
            sublabel="Two-factor authentication"
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            icon={<Link size={18} color={Colors.warning} strokeWidth={1.8} />}
            label="Blockchain Explorer"
            sublabel="View your contract on Etherscan"
            onPress={() => {}}
          />
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <MenuRow
            icon={<LogOut size={18} color={Colors.error} strokeWidth={1.8} />}
            label="Sign Out"
            danger
            onPress={() => router.replace('/')}
          />
        </View>

        <View style={styles.versionBlock}>
          <Text style={styles.versionText}>SmartGrid v1.0.0 · Decentralized Prepaid Power Grid</Text>
          <Text style={styles.versionText}>Purwanchal Campus, IOE · 2024</Text>
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.white,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56,139,253,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,139,253,0.2)',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  dangerCard: {
    borderColor: Colors.errorBg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  menuSublabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 48,
  },
  versionBlock: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
  },
  versionText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

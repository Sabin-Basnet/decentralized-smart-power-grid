import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, User, Shield } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={['#0D1117', '#0A1628']} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.heroSection}>
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={['#1F6FEB', '#00D4AA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Zap size={36} color="#fff" strokeWidth={2} />
            </LinearGradient>
          </View>

          <Text style={styles.appName}>SmartGrid</Text>
          <Text style={styles.tagline}>Decentralized Prepaid Power Management</Text>

          <View style={styles.pillRow}>
            {['IoT', 'Blockchain', 'ML'].map((tag) => (
              <View key={tag} style={styles.pill}>
                <Text style={styles.pillText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.projectBadge}>
          <Text style={styles.projectLabel}>Minor Project — Tribhuvan University</Text>
          <Text style={styles.projectSub}>Purwanchal Campus, IOE</Text>
        </View>

        <View style={styles.roleSection}>
          <Text style={styles.rolePrompt}>Select your role to continue</Text>

          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => router.push('/(client)')}
          >
            <LinearGradient
              colors={['#0F2A4A', '#0A1D33']}
              style={styles.roleCardInner}
            >
              <View style={[styles.roleIcon, { backgroundColor: 'rgba(56,139,253,0.15)' }]}>
                <User size={26} color={Colors.primaryLight} strokeWidth={1.8} />
              </View>
              <View style={styles.roleTextBlock}>
                <Text style={styles.roleTitle}>Client</Text>
                <Text style={styles.roleDesc}>Monitor your usage, balance, and consumption history</Text>
              </View>
              <View style={styles.roleArrow}>
                <Text style={styles.roleArrowText}>{'→'}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => router.push('/(provider)')}
          >
            <LinearGradient
              colors={['#0F2A1E', '#081A12']}
              style={styles.roleCardInner}
            >
              <View style={[styles.roleIcon, { backgroundColor: 'rgba(0,212,170,0.12)' }]}>
                <Shield size={26} color={Colors.accent} strokeWidth={1.8} />
              </View>
              <View style={styles.roleTextBlock}>
                <Text style={styles.roleTitle}>Provider</Text>
                <Text style={styles.roleDesc}>Manage grid, view consumers, handle anomaly alerts</Text>
              </View>
              <View style={styles.roleArrow}>
                <Text style={[styles.roleArrowText, { color: Colors.accent }]}>{'→'}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          PUR080BCT064 · PUR080BCT067 · PUR080BCT077 · PUR080BCT082
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    gap: 14,
  },
  logoWrap: {
    shadowColor: '#1F6FEB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  projectBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  projectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  projectSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  roleSection: {
    gap: 12,
  },
  rolePrompt: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextBlock: {
    flex: 1,
    gap: 4,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  roleArrow: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleArrowText: {
    fontSize: 20,
    color: Colors.primaryLight,
    fontWeight: '300',
  },
  footer: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});

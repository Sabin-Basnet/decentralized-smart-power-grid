import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, CheckCircle, Zap, Cpu, TrendingDown, Radio } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { AnomalyAlert } from '@/types';

interface AnomalyItemProps {
  alert: AnomalyAlert;
  onResolve?: (id: string) => void;
  isLast?: boolean;
}

const SEVERITY_CONFIG = {
  critical: { color: Colors.critical, bg: Colors.criticalBg, label: 'CRITICAL' },
  high: { color: Colors.error, bg: Colors.errorBg, label: 'HIGH' },
  medium: { color: Colors.warning, bg: Colors.warningBg, label: 'MEDIUM' },
  low: { color: Colors.textSecondary, bg: Colors.surface3, label: 'LOW' },
};

const TYPE_ICONS: Record<AnomalyAlert['type'], React.ReactNode> = {
  meter_bypass: <Zap size={16} color={Colors.critical} strokeWidth={2} />,
  overconsumption: <TrendingDown size={16} color={Colors.error} strokeWidth={2} />,
  voltage_drop: <Radio size={16} color={Colors.warning} strokeWidth={2} />,
  null_reading: <Cpu size={16} color={Colors.textSecondary} strokeWidth={2} />,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NP', { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' });
}

export function AnomalyItem({ alert, onResolve, isLast }: AnomalyItemProps) {
  const sev = SEVERITY_CONFIG[alert.severity];

  return (
    <View style={[styles.item, !isLast && styles.bordered]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: sev.bg }]}>
          {TYPE_ICONS[alert.type]}
        </View>
        <View style={styles.middle}>
          <View style={styles.headerRow}>
            <Text style={styles.userName}>{alert.userName}</Text>
            <View style={[styles.sevBadge, { backgroundColor: sev.bg }]}>
              <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
            </View>
          </View>
          <Text style={styles.meterId}>{alert.meterId}</Text>
        </View>
        {alert.resolved ? (
          <CheckCircle size={18} color={Colors.success} strokeWidth={2} />
        ) : (
          <AlertTriangle size={18} color={sev.color} strokeWidth={2} />
        )}
      </View>

      <Text style={styles.description}>{alert.description}</Text>

      <View style={styles.bottomRow}>
        <Text style={styles.date}>{formatDate(alert.detectedAt)}</Text>
        <Text style={styles.delta}>
          {'\u0394'}Load: {alert.deltaLoad > 0 ? '+' : ''}{alert.deltaLoad.toFixed(2)} kW
        </Text>
        {!alert.resolved && onResolve ? (
          <TouchableOpacity
            style={styles.resolveBtn}
            onPress={() => onResolve(alert.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.resolveBtnText}>Resolve</Text>
          </TouchableOpacity>
        ) : alert.resolved ? (
          <Text style={styles.resolvedText}>Resolved</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 16,
    gap: 10,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    gap: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  sevBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sevText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  meterId: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    paddingLeft: 50,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 50,
    gap: 10,
  },
  date: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
  },
  delta: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  resolveBtn: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resolveBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  resolvedText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '500',
  },
});

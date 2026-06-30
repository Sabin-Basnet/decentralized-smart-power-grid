import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { ConsumptionDataPoint } from '@/types';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 40 - 32;
const CHART_H = 140;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOT = 20;

interface ConsumptionChartProps {
  data: ConsumptionDataPoint[];
  metric?: 'loadCurr' | 'balToken';
  color?: string;
  label?: string;
}

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
    const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
    d += ` C ${cp1x} ${points[i - 1].y} ${cp2x} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function buildAreaPath(line: string, chartH: number, padBot: number): string {
  if (!line) return '';
  const first = line.match(/M ([\d.]+) ([\d.]+)/);
  const last = [...line.matchAll(/[\d.]+ [\d.]+/g)].slice(-1)[0];
  if (!first || !last) return line;
  const bottom = chartH - padBot;
  return `${line} L ${last[0].split(' ')[0]} ${bottom} L ${first[1]} ${bottom} Z`;
}

export function ConsumptionChart({
  data,
  metric = 'loadCurr',
  color = Colors.accent,
  label = 'Load (kW)',
}: ConsumptionChartProps) {
  const values = data.map((d) => d[metric] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_H - PAD_TOP - PAD_BOT;

  const points = values.map((v, i) => ({
    x: PAD_LEFT + (i / (values.length - 1)) * plotW,
    y: PAD_TOP + (1 - (v - min) / range) * plotH,
  }));

  const linePath = buildPath(points);
  const areaPath = buildAreaPath(linePath, CHART_H, PAD_BOT);
  const gradId = `grad_${metric}`;
  const areaGradId = `areaGrad_${metric}`;

  const lastPoint = points[points.length - 1];
  const lastValue = values[values.length - 1];

  const xLabels = data.filter((_, i) => i % 4 === 0).map((d) => d.time);

  return (
    <View style={styles.container}>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <SvgGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.4" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {[0, 0.5, 1].map((t) => (
          <Line
            key={t}
            x1={PAD_LEFT}
            y1={PAD_TOP + t * plotH}
            x2={PAD_LEFT + plotW}
            y2={PAD_TOP + t * plotH}
            stroke={Colors.border}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        <Path d={areaPath} fill={`url(#${areaGradId})`} />
        <Path d={linePath} stroke={`url(#${gradId})`} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        <Circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill={color} />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={9} fill={color} fillOpacity={0.2} />
      </Svg>

      <View style={styles.xLabels}>
        {xLabels.map((l, i) => (
          <Text key={i} style={styles.xLabel}>{l}</Text>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendText}>{label}</Text>
        <Text style={[styles.currentValue, { color }]}>
          {lastValue.toFixed(metric === 'balToken' ? 2 : 3)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PAD_LEFT,
    marginTop: 4,
  },
  xLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  currentValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});

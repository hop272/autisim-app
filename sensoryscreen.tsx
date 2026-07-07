import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useStore, SensoryLog } from '../store';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { Card, Button, Label, SectionHeader, SliderRow, Divider } from '../components/ui';

const HOUR = 3600000;

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < HOUR) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 24 * HOUR) return `${Math.round(diff / HOUR)}h ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function intensityLabel(v: number): { text: string; variant: 'success' | 'warning' | 'danger' } {
  if (v <= 3) return { text: 'Low', variant: 'success' };
  if (v <= 6) return { text: 'Medium', variant: 'warning' };
  return { text: 'High', variant: 'danger' };
}

// Pattern analysis (rule-based for MVP)
function analyzePatterns(logs: SensoryLog[]): string[] {
  const insights: string[] = [];
  if (logs.length < 2) return insights;

  const highNoise = logs.filter(l => l.noise >= 7);
  if (highNoise.length >= 2) {
    const avgMood = highNoise.reduce((a, l) => a + l.mood, 0) / highNoise.length;
    if (avgMood <= 5) {
      insights.push(`High noise correlates with lower mood (avg ${avgMood.toFixed(1)}/10) across ${highNoise.length} check-ins`);
    }
  }

  const overloads = logs.filter(l => l.eventType === 'overload' || l.eventType === 'meltdown');
  if (overloads.length > 0) {
    const avgCrowding = overloads.reduce((a, l) => a + l.crowding, 0) / overloads.length;
    insights.push(`Overload events had average crowding of ${avgCrowding.toFixed(1)}/10`);
  }

  const lowEnergy = logs.filter(l => l.energy <= 3);
  if (lowEnergy.length >= 2) {
    const times = lowEnergy.map(l => new Date(l.timestamp).getHours());
    const afternoonCount = times.filter(h => h >= 14 && h <= 18).length;
    if (afternoonCount >= 2) {
      insights.push(`Low energy dips often happen in the afternoon (2–6pm) — consider scheduling rest then`);
    }
  }

  const highLight = logs.filter(l => l.light >= 7);
  if (highLight.length >= 2) {
    insights.push(`Bright lighting flagged ${highLight.length} times — check environments before staying long`);
  }

  return insights;
}

interface Props { navigation: any; }

export default function SensoryScreen({ navigation }: Props) {
  const { sensoryLogs, addSensoryLog } = useStore();
  const [tab, setTab] = useState<'log' | 'history' | 'patterns'>('log');

  // Log form state
  const [noise, setNoise] = useState(5);
  const [light, setLight] = useState(5);
  const [crowding, setCrowding] = useState(5);
  const [smell, setSmell] = useState(3);
  const [temperature, setTemperature] = useState(5);
  const [clothing, setClothing] = useState(5);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [eventType, setEventType] = useState<SensoryLog['eventType']>(undefined);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    addSensoryLog({
      timestamp: Date.now(),
      noise,
      light,
      crowding,
      smell,
      temperature,
      clothing,
      mood,
      energy,
      location: location.trim() || undefined,
      note: note.trim() || undefined,
      eventType,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Reset
    setNoise(5); setLight(5); setCrowding(5); setSmell(3);
    setTemperature(5); setClothing(5); setMood(5); setEnergy(5);
    setLocation(''); setNote(''); setEventType(undefined);
  }

  const patterns = analyzePatterns(sensoryLogs);

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabs}>
        {(['log', 'history', 'patterns'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'log' ? '+ Log' : t === 'history' ? 'History' : 'Patterns'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'log' && (
          <LogForm
            noise={noise} setNoise={setNoise}
            light={light} setLight={setLight}
            crowding={crowding} setCrowding={setCrowding}
            smell={smell} setSmell={setSmell}
            temperature={temperature} setTemperature={setTemperature}
            clothing={clothing} setClothing={setClothing}
            mood={mood} setMood={setMood}
            energy={energy} setEnergy={setEnergy}
            location={location} setLocation={setLocation}
            note={note} setNote={setNote}
            eventType={eventType} setEventType={setEventType}
            onSave={handleSave}
            saved={saved}
          />
        )}

        {tab === 'history' && (
          <View>
            <SectionHeader title="Check-in history" subtitle={`${sensoryLogs.length} entries`} />
            {sensoryLogs.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No logs yet. Use the Log tab to check in.</Text>
              </View>
            ) : (
              sensoryLogs.map(log => (
                <LogCard key={log.id} log={log} />
              ))
            )}
          </View>
        )}

        {tab === 'patterns' && (
          <View>
            <SectionHeader
              title="Patterns detected"
              subtitle={`Based on ${sensoryLogs.length} check-ins`}
            />
            {patterns.length === 0 ? (
              <Card>
                <Text style={styles.patternEmpty}>
                  Log at least 3 check-ins to start seeing patterns. The app will look for correlations between sensory inputs, mood, and energy.
                </Text>
              </Card>
            ) : (
              patterns.map((p, i) => (
                <Card key={i} style={styles.patternCard}>
                  <Text style={styles.patternIcon}>◉</Text>
                  <Text style={styles.patternText}>{p}</Text>
                </Card>
              ))
            )}

            <Card style={styles.heatCard}>
              <SectionHeader title="Sensory overview" />
              <SensoryHeatmap logs={sensoryLogs} />
            </Card>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

// ── Log form ──────────────────────────────────────────────────────────────────

function LogForm(props: {
  noise: number; setNoise: (v: number) => void;
  light: number; setLight: (v: number) => void;
  crowding: number; setCrowding: (v: number) => void;
  smell: number; setSmell: (v: number) => void;
  temperature: number; setTemperature: (v: number) => void;
  clothing: number; setClothing: (v: number) => void;
  mood: number; setMood: (v: number) => void;
  energy: number; setEnergy: (v: number) => void;
  location: string; setLocation: (v: string) => void;
  note: string; setNote: (v: string) => void;
  eventType: SensoryLog['eventType']; setEventType: (v: SensoryLog['eventType']) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const eventTypes: Array<{ key: SensoryLog['eventType']; label: string; color: string }> = [
    { key: 'regulated', label: '😌 Regulated', color: Colors.success },
    { key: 'overload', label: '😰 Overload', color: Colors.warning },
    { key: 'meltdown', label: '🌊 Meltdown', color: Colors.danger },
    { key: 'shutdown', label: '😶 Shutdown', color: Colors.secondary },
  ];

  return (
    <View>
      <Text style={styles.logTitle}>How are things right now?</Text>
      <Text style={styles.logSubtitle}>Rate each from 1 (very low / comfortable) to 10 (very high / overwhelming)</Text>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>Environment</Text>
        <SliderRow label="🔊 Noise" value={props.noise} onValueChange={props.setNoise} color={Colors.primary} />
        <SliderRow label="💡 Light brightness" value={props.light} onValueChange={props.setLight} color={Colors.warning} />
        <SliderRow label="👥 Crowding" value={props.crowding} onValueChange={props.setCrowding} color={Colors.secondary} />
        <SliderRow label="👃 Smell intensity" value={props.smell} onValueChange={props.setSmell} color={Colors.accent} />
        <SliderRow label="🌡 Temperature" value={props.temperature} onValueChange={props.setTemperature} color={Colors.danger} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>How you feel</Text>
        <SliderRow label="👕 Clothing comfort" value={props.clothing} onValueChange={props.setClothing} color={Colors.primary} />
        <SliderRow label="🌀 Mood (1=low, 10=good)" value={props.mood} onValueChange={props.setMood} color={Colors.success} />
        <SliderRow label="⚡ Energy (1=empty, 10=full)" value={props.energy} onValueChange={props.setEnergy} color={Colors.energyHigh} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>Event type (optional)</Text>
        <View style={styles.eventTypeRow}>
          {eventTypes.map(et => (
            <TouchableOpacity
              key={et.key}
              style={[
                styles.eventTypeBtn,
                props.eventType === et.key && { backgroundColor: et.color + '20', borderColor: et.color },
              ]}
              onPress={() => props.setEventType(props.eventType === et.key ? undefined : et.key)}
            >
              <Text style={[
                styles.eventTypeBtnText,
                props.eventType === et.key && { color: et.color, fontWeight: Typography.weight.semibold },
              ]}>
                {et.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>Location & notes (optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Where are you? (e.g. supermarket, home, work)"
          placeholderTextColor={Colors.textMuted}
          value={props.location}
          onChangeText={props.setLocation}
        />
        <TextInput
          style={[styles.textInput, { marginTop: Spacing.sm, minHeight: 60 }]}
          placeholder="Any notes…"
          placeholderTextColor={Colors.textMuted}
          value={props.note}
          onChangeText={props.setNote}
          multiline
        />
      </Card>

      <Button
        label={props.saved ? '✓ Saved' : 'Save check-in'}
        onPress={props.onSave}
        fullWidth
        variant={props.saved ? 'secondary' : 'primary'}
        style={{ marginTop: Spacing.sm }}
      />
    </View>
  );
}

// ── Log card ──────────────────────────────────────────────────────────────────

function LogCard({ log }: { log: SensoryLog }) {
  const { text: noiseLabel, variant: noiseVariant } = intensityLabel(log.noise);

  return (
    <Card style={styles.logCard}>
      <View style={styles.logCardHeader}>
        <Text style={styles.logCardTime}>{timeAgo(log.timestamp)}</Text>
        {log.location && <Text style={styles.logCardLocation}>📍 {log.location}</Text>}
        {log.eventType && (
          <Label
            text={log.eventType}
            variant={
              log.eventType === 'regulated' ? 'success'
              : log.eventType === 'overload' || log.eventType === 'meltdown' ? 'danger'
              : 'muted'
            }
          />
        )}
      </View>
      <View style={styles.logCardGrid}>
        {[
          { label: 'Noise', val: log.noise },
          { label: 'Light', val: log.light },
          { label: 'Crowd', val: log.crowding },
          { label: 'Mood', val: log.mood },
          { label: 'Energy', val: log.energy },
        ].map(item => {
          const { variant } = intensityLabel(item.val);
          return (
            <View key={item.label} style={styles.logGridCell}>
              <Text style={styles.logGridLabel}>{item.label}</Text>
              <Text style={[
                styles.logGridVal,
                { color: variant === 'success' ? Colors.success : variant === 'warning' ? Colors.warning : Colors.danger },
              ]}>
                {item.val}
              </Text>
            </View>
          );
        })}
      </View>
      {log.note && <Text style={styles.logNote}>{log.note}</Text>}
    </Card>
  );
}

// ── Sensory heatmap (average bars) ────────────────────────────────────────────

function SensoryHeatmap({ logs }: { logs: SensoryLog[] }) {
  if (logs.length === 0) return <Text style={styles.patternEmpty}>No data yet.</Text>;

  const fields: Array<{ key: keyof SensoryLog; label: string }> = [
    { key: 'noise', label: 'Noise' },
    { key: 'light', label: 'Light' },
    { key: 'crowding', label: 'Crowding' },
    { key: 'smell', label: 'Smell' },
    { key: 'temperature', label: 'Temperature' },
    { key: 'mood', label: 'Mood' },
    { key: 'energy', label: 'Energy' },
  ];

  return (
    <View style={{ gap: 10 }}>
      {fields.map(f => {
        const vals = logs.map(l => l[f.key] as number).filter(v => typeof v === 'number');
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const { variant } = intensityLabel(Math.round(avg));
        const barColor = variant === 'success' ? Colors.sensoryLow : variant === 'warning' ? Colors.sensoryMid : Colors.sensoryHigh;
        return (
          <View key={f.key} style={styles.heatRow}>
            <Text style={styles.heatLabel}>{f.label}</Text>
            <View style={styles.heatBar}>
              <View style={[styles.heatFill, { width: `${avg * 10}%` as any, backgroundColor: barColor }]} />
            </View>
            <Text style={[styles.heatVal, { color: barColor }]}>{avg.toFixed(1)}</Text>
          </View>
        );
      })}
      <Text style={styles.heatFooter}>Averages across {logs.length} check-ins</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: Typography.size.sm, color: Colors.textMuted, fontWeight: Typography.weight.medium },
  tabTextActive: { color: Colors.primary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },

  logTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  logSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: Typography.size.sm * 1.5,
  },
  section: { marginBottom: Spacing.sm },
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  eventTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  eventTypeBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  eventTypeBtnText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  textInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  logCard: { marginBottom: Spacing.sm },
  logCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.sm },
  logCardTime: { fontSize: Typography.size.sm, color: Colors.textMuted, fontWeight: Typography.weight.medium },
  logCardLocation: { fontSize: Typography.size.sm, color: Colors.textSecondary, flex: 1 },
  logCardGrid: { flexDirection: 'row', gap: Spacing.md },
  logGridCell: { alignItems: 'center' },
  logGridLabel: { fontSize: Typography.size.xs, color: Colors.textMuted },
  logGridVal: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, marginTop: 2 },
  logNote: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: Spacing.sm, fontStyle: 'italic' },

  empty: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: Typography.size.md, color: Colors.textMuted, textAlign: 'center' },

  patternCard: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.secondaryLight,
    borderColor: Colors.secondary + '40',
  },
  patternIcon: { fontSize: 16, color: Colors.secondary, marginTop: 2 },
  patternText: { flex: 1, fontSize: Typography.size.md, color: Colors.textPrimary, lineHeight: Typography.size.md * 1.5 },
  patternEmpty: { fontSize: Typography.size.md, color: Colors.textMuted, lineHeight: Typography.size.md * 1.6 },

  heatCard: { marginTop: Spacing.md },
  heatRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  heatLabel: { width: 80, fontSize: Typography.size.sm, color: Colors.textSecondary },
  heatBar: { flex: 1, height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, overflow: 'hidden' },
  heatFill: { height: '100%', borderRadius: Radius.full },
  heatVal: { width: 28, fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, textAlign: 'right' },
  heatFooter: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: Spacing.sm },
});
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, Alert, } from 'react-native';
import { useStore } from '../store';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { Card, Button, SectionHeader, EnergyBar, Divider } from '../components/ui';
const HOUR = 3600000;
function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000)
        return 'just now';
    if (diff < HOUR)
        return `${Math.round(diff / 60000)}m ago`;
    if (diff < 24 * HOUR)
        return `${Math.round(diff / HOUR)}h ago`;
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
const ACTIVITY_PRESETS = [
    { label: 'Good sleep', emoji: '😴', type: 'rest', cost: +40 },
    { label: 'Poor sleep', emoji: '💤', type: 'rest', cost: +10 },
    { label: 'Nap / rest break', emoji: '🛋', type: 'rest', cost: +15 },
    { label: 'Solo work (focused)', emoji: '💻', type: 'work', cost: -12 },
    { label: 'Meetings / calls', emoji: '📞', type: 'social', cost: -20 },
    { label: 'Open-plan office', emoji: '🏢', type: 'work', cost: -18 },
    { label: '1:1 social', emoji: '👥', type: 'social', cost: -15 },
    { label: 'Group social', emoji: '🎉', type: 'social', cost: -30 },
    { label: 'Commute (transit)', emoji: '🚌', type: 'travel', cost: -15 },
    { label: 'Driving', emoji: '🚗', type: 'travel', cost: -10 },
    { label: 'Grocery shopping', emoji: '🛒', type: 'personal', cost: -22 },
    { label: 'Exercise', emoji: '🏃', type: 'personal', cost: -8, note: 'Usually worth it' },
    { label: 'Outdoors / nature', emoji: '🌿', type: 'rest', cost: +12 },
    { label: 'Decompression time', emoji: '🎧', type: 'rest', cost: +20 },
    { label: 'Meal (safe food)', emoji: '🍽', type: 'personal', cost: +8 },
];
const TYPE_COLORS = {
    rest: Colors.success,
    work: Colors.secondary,
    social: Colors.accent,
    travel: Colors.warning,
    personal: Colors.primary,
    other: Colors.textMuted,
};
// ── Health data import banner ─────────────────────────────────────────────────
function HealthImportBanner({ onImport }) {
    return (<Card style={styles.healthBanner}>
      <View style={styles.healthBannerRow}>
        <Text style={styles.healthBannerEmoji}>⌚</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.healthBannerTitle}>Connect health data</Text>
          <Text style={styles.healthBannerBody}>
            Import sleep, heart rate, and HRV from Apple Health, Google Fit, Garmin, or Oura to auto-fill your energy baseline.
          </Text>
        </View>
      </View>
      <View style={styles.healthSourceRow}>
        {['Apple Health', 'Google Fit', 'Fitbit', 'Oura', 'Garmin'].map(src => (<TouchableOpacity key={src} style={styles.healthSource} onPress={onImport}>
            <Text style={styles.healthSourceText}>{src}</Text>
          </TouchableOpacity>))}
      </View>
    </Card>);
}
export default function EnergyScreen({ navigation }) {
    const { currentEnergy, energyEntries, addEnergyEntry, setCurrentEnergy, dailyEnergyBudget } = useStore();
    const [tab, setTab] = useState('today');
    const [customActivity, setCustomActivity] = useState('');
    const [customCost, setCustomCost] = useState('');
    const [customType, setCustomType] = useState('other');
    const [selectedPreset, setSelectedPreset] = useState(null);
    const todayEntries = energyEntries.filter(e => {
        const d = new Date(e.timestamp);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    });
    const totalIn = todayEntries.filter(e => e.cost > 0).reduce((a, e) => a + e.cost, 0);
    const totalOut = Math.abs(todayEntries.filter(e => e.cost < 0).reduce((a, e) => a + e.cost, 0));
    function handleImportHealth() {
        Alert.alert('Connect health data', 'In the full app, this connects to Apple Health (iOS), Google Health Connect (Android), or Garmin/Oura via their APIs to read:\n\n• Sleep duration & quality\n• Resting heart rate\n• HRV (stress indicator)\n• Steps / activity\n\nThis data would auto-adjust your daily energy baseline.', [
            { text: 'Got it', style: 'default' },
            {
                text: 'Simulate import',
                onPress: () => {
                    // Simulate wearable data arriving
                    addEnergyEntry({
                        timestamp: Date.now() - 3 * HOUR,
                        activity: 'Sleep (7h 20m) — from Apple Health',
                        activityType: 'rest',
                        cost: +35,
                        note: 'HRV 42ms, resting HR 58bpm',
                    });
                    Alert.alert('Imported', 'Sleep data added from health source (simulated).');
                },
            },
        ]);
    }
    function handleLogPreset(idx) {
        const p = ACTIVITY_PRESETS[idx];
        addEnergyEntry({
            timestamp: Date.now(),
            activity: p.label,
            activityType: p.type,
            cost: p.cost,
            note: p.note,
        });
        setSelectedPreset(null);
    }
    function handleLogCustom() {
        const cost = parseFloat(customCost);
        if (!customActivity.trim() || isNaN(cost))
            return;
        addEnergyEntry({
            timestamp: Date.now(),
            activity: customActivity.trim(),
            activityType: customType,
            cost,
        });
        setCustomActivity('');
        setCustomCost('');
    }
    const capacityLabel = currentEnergy >= 70 ? 'Good capacity for demanding tasks'
        : currentEnergy >= 50 ? 'Enough for 1–2 medium tasks'
            : currentEnergy >= 30 ? 'Light tasks and rest blocks only'
                : currentEnergy >= 15 ? 'Rest is the priority'
                    : 'Very low — protect your energy now';
    return (<View style={styles.container}>
      <View style={styles.tabs}>
        {['today', 'log', 'trends'].map(t => (<TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'today' ? 'Today' : t === 'log' ? '+ Log' : 'Trends'}
            </Text>
          </TouchableOpacity>))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── TODAY TAB ── */}
        {tab === 'today' && (<>
            <HealthImportBanner onImport={handleImportHealth}/>

            {/* Main energy display */}
            <Card style={styles.mainCard}>
              <Text style={styles.mainLabel}>Current energy</Text>
              <View style={styles.mainRow}>
                <View style={styles.energyGauge}>
                  <GaugeArc value={currentEnergy}/>
                </View>
                <View style={styles.mainMeta}>
                  <Text style={[styles.mainPct, {
                    color: currentEnergy >= 60 ? Colors.energyHigh : currentEnergy >= 30 ? Colors.energyMid : Colors.energyLow,
                }]}>
                    {Math.round(currentEnergy)}
                    <Text style={styles.mainPctUnit}> / 100</Text>
                  </Text>
                  <Text style={styles.mainCapacity}>{capacityLabel}</Text>
                </View>
              </View>
              <EnergyBar value={currentEnergy} height={14} style={{ marginTop: Spacing.md }}/>
              <View style={styles.manualRow}>
                <Text style={styles.manualLabel}>Adjust manually</Text>
                <View style={styles.manualBtns}>
                  {[-10, -5, +5, +10].map(delta => (<TouchableOpacity key={delta} style={[styles.manualBtn, { backgroundColor: delta < 0 ? Colors.dangerLight : Colors.successLight }]} onPress={() => setCurrentEnergy(currentEnergy + delta)}>
                      <Text style={[styles.manualBtnText, { color: delta < 0 ? Colors.danger : Colors.success }]}>
                        {delta > 0 ? '+' : ''}{delta}
                      </Text>
                    </TouchableOpacity>))}
                </View>
              </View>
            </Card>

            {/* Today's flow */}
            <View style={styles.flowRow}>
              <Card style={[styles.flowCard, { borderLeftWidth: 3, borderLeftColor: Colors.success }]}>
                <Text style={styles.flowLabel}>Gained</Text>
                <Text style={[styles.flowValue, { color: Colors.success }]}>+{totalIn}</Text>
              </Card>
              <Card style={[styles.flowCard, { borderLeftWidth: 3, borderLeftColor: Colors.danger }]}>
                <Text style={styles.flowLabel}>Spent</Text>
                <Text style={[styles.flowValue, { color: Colors.danger }]}>-{totalOut}</Text>
              </Card>
              <Card style={[styles.flowCard, { borderLeftWidth: 3, borderLeftColor: Colors.primary }]}>
                <Text style={styles.flowLabel}>Net</Text>
                <Text style={[styles.flowValue, { color: Colors.primary }]}>
                  {totalIn - totalOut >= 0 ? '+' : ''}{totalIn - totalOut}
                </Text>
              </Card>
            </View>

            {/* Today's entries */}
            <SectionHeader title="Today's activities"/>
            {todayEntries.length === 0 ? (<Card><Text style={styles.emptyText}>No activities logged yet. Use the Log tab.</Text></Card>) : (todayEntries.slice().reverse().map(entry => (<EntryRow key={entry.id} entry={entry}/>)))}
          </>)}

        {/* ── LOG TAB ── */}
        {tab === 'log' && (<>
            <Text style={styles.logTitle}>What have you done?</Text>
            <Text style={styles.logSubtitle}>Tap a preset or add your own. Negative = draining, positive = restoring.</Text>

            <SectionHeader title="Quick presets" style={{ marginTop: Spacing.sm }}/>
            <View style={styles.presetGrid}>
              {ACTIVITY_PRESETS.map((p, idx) => (<TouchableOpacity key={idx} style={[styles.presetBtn, { borderLeftColor: TYPE_COLORS[p.type] }]} onPress={() => handleLogPreset(idx)} activeOpacity={0.7}>
                  <Text style={styles.presetEmoji}>{p.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetLabel}>{p.label}</Text>
                    <Text style={[styles.presetCost, { color: p.cost > 0 ? Colors.success : Colors.danger }]}>
                      {p.cost > 0 ? '+' : ''}{p.cost}
                    </Text>
                  </View>
                </TouchableOpacity>))}
            </View>

            <Divider />
            <SectionHeader title="Custom entry"/>
            <Card>
              <TextInput style={styles.input} placeholder="Activity name" placeholderTextColor={Colors.textMuted} value={customActivity} onChangeText={setCustomActivity}/>
              <TextInput style={[styles.input, { marginTop: Spacing.sm }]} placeholder="Energy cost (e.g. -15 or +20)" placeholderTextColor={Colors.textMuted} value={customCost} onChangeText={setCustomCost} keyboardType="numbers-and-punctuation"/>
              <View style={styles.typeRow}>
                {['rest', 'work', 'social', 'travel', 'personal'].map(t => (<TouchableOpacity key={t} style={[styles.typeBtn, customType === t && { backgroundColor: TYPE_COLORS[t] + '20', borderColor: TYPE_COLORS[t] }]} onPress={() => setCustomType(t)}>
                    <Text style={[styles.typeBtnText, customType === t && { color: TYPE_COLORS[t], fontWeight: Typography.weight.semibold }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>))}
              </View>
              <Button label="Log this activity" onPress={handleLogCustom} fullWidth style={{ marginTop: Spacing.md }} disabled={!customActivity.trim() || !customCost.trim()}/>
            </Card>
          </>)}

        {/* ── TRENDS TAB ── */}
        {tab === 'trends' && (<>
            <Card style={styles.trendCard}>
              <SectionHeader title="Activity breakdown"/>
              <ActivityBreakdown entries={energyEntries}/>
            </Card>

            <Card style={[styles.trendCard, { marginTop: Spacing.sm }]}>
              <SectionHeader title="Most draining activities"/>
              <TopDrains entries={energyEntries}/>
            </Card>

            <Card style={[styles.trendCard, { marginTop: Spacing.sm }]}>
              <SectionHeader title="Wearable data"/>
              <Text style={styles.wearableNote}>
                Connect Apple Health, Google Health Connect, Garmin Connect, Oura, or Fitbit in Settings to see heart rate, HRV, and sleep trends here. These will automatically adjust your daily energy baseline.
              </Text>
              <Button label="Connect health source" onPress={handleImportHealth} variant="secondary" style={{ marginTop: Spacing.md }}/>
            </Card>
          </>)}

        <View style={{ height: Spacing.xxl }}/>
      </ScrollView>
    </View>);
}
// ── Sub-components ─────────────────────────────────────────────────────────────
function EntryRow({ entry }) {
    const isGain = entry.cost > 0;
    return (<View style={styles.entryRow}>
      <View style={[styles.entryDot, { backgroundColor: TYPE_COLORS[entry.activityType] + '20', borderColor: TYPE_COLORS[entry.activityType] }]}/>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryActivity}>{entry.activity}</Text>
        {entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
        <Text style={styles.entryTime}>{timeAgo(entry.timestamp)}</Text>
      </View>
      <Text style={[styles.entryCost, { color: isGain ? Colors.success : Colors.danger }]}>
        {isGain ? '+' : ''}{entry.cost}
      </Text>
    </View>);
}
function GaugeArc({ value }) {
    const color = value >= 60 ? Colors.energyHigh : value >= 30 ? Colors.energyMid : Colors.energyLow;
    const bars = 20;
    const filled = Math.round((value / 100) * bars);
    return (<View style={styles.gauge}>
      {Array.from({ length: bars }).map((_, i) => (<View key={i} style={[
                styles.gaugeBar,
                { backgroundColor: i < filled ? color : Colors.surfaceAlt },
                i === filled - 1 && { opacity: 0.7 },
            ]}/>))}
    </View>);
}
function ActivityBreakdown({ entries }) {
    const byType = {};
    entries.forEach(e => {
        byType[e.activityType] = (byType[e.activityType] || 0) + Math.abs(e.cost);
    });
    const total = Object.values(byType).reduce((a, b) => a + b, 0) || 1;
    return (<View style={{ gap: 10 }}>
      {Object.entries(byType).map(([type, val]) => (<View key={type} style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{type}</Text>
          <View style={styles.breakdownBar}>
            <View style={[styles.breakdownFill, {
                    width: `${(val / total) * 100}%`,
                    backgroundColor: TYPE_COLORS[type] || Colors.textMuted,
                }]}/>
          </View>
          <Text style={styles.breakdownVal}>{Math.round((val / total) * 100)}%</Text>
        </View>))}
    </View>);
}
function TopDrains({ entries }) {
    const drains = entries.filter(e => e.cost < 0)
        .sort((a, b) => a.cost - b.cost)
        .slice(0, 5);
    if (drains.length === 0)
        return <Text style={styles.emptyText}>No draining activities logged yet.</Text>;
    return (<View style={{ gap: 6 }}>
      {drains.map(e => (<View key={e.id} style={styles.drainRow}>
          <Text style={styles.drainActivity} numberOfLines={1}>{e.activity}</Text>
          <Text style={styles.drainCost}>{e.cost}</Text>
        </View>))}
    </View>);
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.md },
    tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: Colors.primary },
    tabText: { fontSize: Typography.size.sm, color: Colors.textMuted, fontWeight: Typography.weight.medium },
    tabTextActive: { color: Colors.primary },
    scroll: { flex: 1 },
    content: { padding: Spacing.md },
    healthBanner: { marginBottom: Spacing.md, backgroundColor: Colors.secondaryLight, borderColor: Colors.secondary + '40' },
    healthBannerRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', marginBottom: Spacing.sm },
    healthBannerEmoji: { fontSize: 28 },
    healthBannerTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginBottom: 4 },
    healthBannerBody: { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: Typography.size.sm * 1.5 },
    healthSourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    healthSource: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
    healthSourceText: { fontSize: Typography.size.xs, color: Colors.primary, fontWeight: Typography.weight.medium },
    mainCard: { marginBottom: Spacing.md },
    mainLabel: { fontSize: Typography.size.xs, color: Colors.textMuted, fontWeight: Typography.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
    mainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
    energyGauge: { width: 80 },
    mainMeta: { flex: 1 },
    mainPct: { fontSize: 40, fontWeight: Typography.weight.bold, lineHeight: 44 },
    mainPctUnit: { fontSize: Typography.size.md, color: Colors.textMuted, fontWeight: Typography.weight.regular },
    mainCapacity: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 4, lineHeight: Typography.size.sm * 1.4 },
    manualRow: { marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    manualLabel: { fontSize: Typography.size.sm, color: Colors.textMuted },
    manualBtns: { flexDirection: 'row', gap: Spacing.xs },
    manualBtn: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 5, minWidth: 40, alignItems: 'center' },
    manualBtnText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
    flowRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    flowCard: { flex: 1, padding: Spacing.sm },
    flowLabel: { fontSize: Typography.size.xs, color: Colors.textMuted, marginBottom: 4 },
    flowValue: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
    entryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    entryDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 4 },
    entryActivity: { fontSize: Typography.size.md, color: Colors.textPrimary, fontWeight: Typography.weight.medium },
    entryNote: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
    entryTime: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
    entryCost: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, minWidth: 36, textAlign: 'right' },
    gauge: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, width: 80 },
    gaugeBar: { width: 14, height: 8, borderRadius: 4 },
    logTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: 4 },
    logSubtitle: { fontSize: Typography.size.sm, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: Typography.size.sm * 1.5 },
    presetGrid: { gap: Spacing.xs, marginBottom: Spacing.md },
    presetBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3 },
    presetEmoji: { fontSize: 20, width: 28 },
    presetLabel: { fontSize: Typography.size.sm, color: Colors.textPrimary, fontWeight: Typography.weight.medium },
    presetCost: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },
    input: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, padding: Spacing.sm, fontSize: Typography.size.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
    typeBtn: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt },
    typeBtnText: { fontSize: Typography.size.xs, color: Colors.textSecondary },
    trendCard: {},
    wearableNote: { fontSize: Typography.size.md, color: Colors.textSecondary, lineHeight: Typography.size.md * 1.6 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    breakdownLabel: { width: 70, fontSize: Typography.size.sm, color: Colors.textSecondary },
    breakdownBar: { flex: 1, height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, overflow: 'hidden' },
    breakdownFill: { height: '100%', borderRadius: Radius.full },
    breakdownVal: { width: 32, fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textSecondary, textAlign: 'right' },
    drainRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
    drainActivity: { flex: 1, fontSize: Typography.size.sm, color: Colors.textPrimary },
    drainCost: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.danger },
    emptyText: { fontSize: Typography.size.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.sm },
});

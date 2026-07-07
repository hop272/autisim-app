import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useStore } from '../store';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { Card, EnergyBar, Label, SectionHeader } from '../components/ui';

const HOUR = 3600000;

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < HOUR) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 24 * HOUR) return `${Math.round(diff / HOUR)}h ago`;
  return 'yesterday';
}

function energyLabel(e: number): string {
  if (e >= 70) return 'High';
  if (e >= 40) return 'Medium';
  if (e >= 20) return 'Low';
  return 'Very low';
}

function energyDescription(e: number): string {
  if (e >= 70) return 'Good capacity for demanding tasks';
  if (e >= 40) return 'Enough for 1–2 medium tasks';
  if (e >= 20) return 'Light tasks only — rest when you can';
  return 'Rest is the priority right now';
}

interface Props {
  navigation: any;
}

export default function DashboardScreen({ navigation }: Props) {
  const { currentEnergy, sensoryLogs, tasks, activeTaskId, isRecoveryMode } = useStore();
  const latestSensory = sensoryLogs[0];
  const activeTask = tasks.find(t => t.id === activeTaskId);
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const energyColor =
    currentEnergy >= 70 ? Colors.energyHigh
    : currentEnergy >= 40 ? Colors.energyMid
    : Colors.energyLow;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good to see you</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity
          style={[styles.recoveryBtn, isRecoveryMode && styles.recoveryBtnActive]}
          onPress={() => navigation.navigate('Recovery')}
        >
          <Text style={styles.recoveryBtnText}>🛡 Recovery</Text>
        </TouchableOpacity>
      </View>

      {/* Energy cockpit */}
      <Card style={styles.energyCard}>
        <View style={styles.energyTop}>
          <View>
            <Text style={styles.energyTitle}>Energy today</Text>
            <Text style={[styles.energyValue, { color: energyColor }]}>
              {energyLabel(currentEnergy)}
            </Text>
            <Text style={styles.energyDesc}>{energyDescription(currentEnergy)}</Text>
          </View>
          <View style={styles.energyCircle}>
            <Text style={[styles.energyPct, { color: energyColor }]}>
              {Math.round(currentEnergy)}
            </Text>
            <Text style={styles.energyPctLabel}>/ 100</Text>
          </View>
        </View>
        <EnergyBar value={currentEnergy} style={{ marginTop: Spacing.md }} height={12} />
        <TouchableOpacity
          style={styles.energyLink}
          onPress={() => navigation.navigate('Energy')}
        >
          <Text style={styles.energyLinkText}>Log activity →</Text>
        </TouchableOpacity>
      </Card>

      {/* Active task */}
      {activeTask ? (
        <View>
          <SectionHeader title="Current task" action={{ label: 'View all', onPress: () => navigation.navigate('Tasks') }} />
          <Card onPress={() => navigation.navigate('Tasks')}>
            <Label text="In progress" variant="accent" />
            <Text style={styles.taskGoal} numberOfLines={1}>{activeTask.goal}</Text>
            {activeTask.steps[activeTask.currentStepIndex] && (
              <View style={styles.stepNow}>
                <Text style={styles.stepNowLabel}>Next step</Text>
                <Text style={styles.stepNowText}>
                  {activeTask.steps[activeTask.currentStepIndex].text}
                </Text>
              </View>
            )}
            <Text style={styles.taskProgress}>
              {activeTask.steps.filter(s => s.done).length} of {activeTask.steps.length} steps done
            </Text>
          </Card>
        </View>
      ) : (
        <View>
          <SectionHeader title="Tasks" />
          <TouchableOpacity
            style={styles.emptyTask}
            onPress={() => navigation.navigate('Tasks')}
          >
            <Text style={styles.emptyTaskText}>＋ Break down a task</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sensory snapshot */}
      <View style={{ marginTop: Spacing.md }}>
        <SectionHeader
          title="Sensory snapshot"
          subtitle={latestSensory ? getTimeAgo(latestSensory.timestamp) : undefined}
          action={{ label: 'Log now', onPress: () => navigation.navigate('Sensory') }}
        />
        {latestSensory ? (
          <Card>
            <View style={styles.sensoryGrid}>
              {[
                { label: 'Noise', val: latestSensory.noise },
                { label: 'Light', val: latestSensory.light },
                { label: 'Crowd', val: latestSensory.crowding },
                { label: 'Energy', val: latestSensory.energy },
              ].map(item => (
                <View key={item.label} style={styles.sensoryCell}>
                  <Text style={styles.sensoryCellLabel}>{item.label}</Text>
                  <SensoryDot value={item.val} />
                  <Text style={styles.sensoryCellVal}>{item.val}/10</Text>
                </View>
              ))}
            </View>
            {latestSensory.location && (
              <Text style={styles.sensoryLocation}>📍 {latestSensory.location}</Text>
            )}
          </Card>
        ) : (
          <TouchableOpacity style={styles.emptyTask} onPress={() => navigation.navigate('Sensory')}>
            <Text style={styles.emptyTaskText}>＋ Log sensory state</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick actions */}
      <View style={{ marginTop: Spacing.md }}>
        <SectionHeader title="Quick actions" />
        <View style={styles.quickGrid}>
          {[
            { emoji: '🧩', label: 'Break down\na task', screen: 'Tasks' },
            { emoji: '🌡', label: 'Sensory\ncheck-in', screen: 'Sensory' },
            { emoji: '⚡', label: 'Log\nenergy', screen: 'Energy' },
            { emoji: '🛡', label: 'Recovery\nmode', screen: 'Recovery' },
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickCard}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickEmoji}>{item.emoji}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function SensoryDot({ value }: { value: number }) {
  const color = value <= 3 ? Colors.sensoryLow : value <= 6 ? Colors.sensoryMid : Colors.sensoryHigh;
  return (
    <View style={[styles.sensoryDot, { backgroundColor: color + '30', borderColor: color }]}>
      <View style={[styles.sensoryDotInner, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.md, paddingTop: Spacing.sm },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  recoveryBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  recoveryBtnActive: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  recoveryBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.primary,
  },

  energyCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  energyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  energyTitle: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  energyValue: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    marginTop: 4,
  },
  energyDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    maxWidth: 180,
  },
  energyCircle: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    width: 72,
    height: 72,
    justifyContent: 'center',
  },
  energyPct: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    lineHeight: 28,
  },
  energyPctLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  energyLink: { marginTop: Spacing.sm },
  energyLinkText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },

  taskGoal: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  stepNow: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  stepNowLabel: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepNowText: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginTop: 3,
  },
  taskProgress: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  emptyTask: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '50',
    borderStyle: 'dashed',
    padding: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
  },
  emptyTaskText: {
    fontSize: Typography.size.md,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },

  sensoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sensoryCell: { alignItems: 'center', gap: 4 },
  sensoryCellLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weight.medium,
  },
  sensoryDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensoryDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sensoryCellVal: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold,
  },
  sensoryLocation: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  quickEmoji: { fontSize: 24 },
  quickLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
    lineHeight: Typography.size.sm * 1.4,
  },
});
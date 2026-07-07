import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';

// ── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'recovery';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  fullWidth,
}: ButtonProps) {
  const btnStyle = [
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    fullWidth && { width: '100%' as any },
    (disabled || loading) && styles.btn_disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? Colors.primary : Colors.textInverse} size="small" />
      ) : (
        <Text style={[styles.btnText, styles[`btnText_${variant}`], styles[`btnText_${size}`]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────

interface LabelProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';
  style?: ViewStyle;
}

export function Label({ text, variant = 'default', style }: LabelProps) {
  return (
    <View style={[styles.label, styles[`label_${variant}`], style]}>
      <Text style={[styles.labelText, styles[`labelText_${variant}`]]}>{text}</Text>
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ── Energy Bar ────────────────────────────────────────────────────────────────

interface EnergyBarProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  height?: number;
  style?: ViewStyle;
}

export function EnergyBar({ value, max = 100, showLabel, height = 10, style }: EnergyBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct > 60 ? Colors.energyHigh : pct > 30 ? Colors.energyMid : Colors.energyLow;

  return (
    <View style={style}>
      <View style={[styles.energyBarTrack, { height }]}>
        <View
          style={[
            styles.energyBarFill,
            { width: `${pct}%` as any, backgroundColor: color, height },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.energyBarLabel, { color }]}>
          {Math.round(pct)}%
        </Text>
      )}
    </View>
  );
}

// ── Slider Row ────────────────────────────────────────────────────────────────

// Simple visual slider replacement (pure RN, no native slider needed for MVP)
interface SliderRowProps {
  label: string;
  value: number;
  max?: number;
  onValueChange: (v: number) => void;
  color?: string;
}

export function SliderRow({ label, value, max = 10, onValueChange, color = Colors.primary }: SliderRowProps) {
  const steps = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderDots}>
        {steps.map(step => (
          <TouchableOpacity
            key={step}
            onPress={() => onValueChange(step)}
            style={[
              styles.sliderDot,
              step <= value && { backgroundColor: color, borderColor: color },
            ]}
          />
        ))}
        <Text style={[styles.sliderValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  emoji: string;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ emoji, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body && <Text style={styles.emptyBody}>{body}</Text>}
      {action && (
        <Button label={action.label} onPress={action.onPress} variant="secondary" style={{ marginTop: Spacing.md }} />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  btn: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btn_primary: {
    backgroundColor: Colors.primary,
  },
  btn_secondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  btn_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btn_danger: {
    backgroundColor: Colors.danger,
  },
  btn_recovery: {
    backgroundColor: Colors.recoveryPrimary,
    borderRadius: Radius.lg,
  },
  btn_disabled: {
    opacity: 0.5,
  },
  btn_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, minHeight: 36 },
  btn_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, minHeight: 44 },
  btn_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 56 },

  btnText: { fontWeight: Typography.weight.semibold },
  btnText_primary: { color: Colors.textInverse, fontSize: Typography.size.md },
  btnText_secondary: { color: Colors.primary, fontSize: Typography.size.md },
  btnText_ghost: { color: Colors.textSecondary, fontSize: Typography.size.md },
  btnText_danger: { color: Colors.textInverse, fontSize: Typography.size.md },
  btnText_recovery: { color: '#0F1923', fontSize: Typography.size.lg },
  btnText_sm: { fontSize: Typography.size.sm },
  btnText_md: { fontSize: Typography.size.md },
  btnText_lg: { fontSize: Typography.size.lg },

  label: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label_default: { backgroundColor: Colors.surfaceAlt },
  label_success: { backgroundColor: Colors.successLight },
  label_warning: { backgroundColor: Colors.warningLight },
  label_danger: { backgroundColor: Colors.dangerLight },
  label_accent: { backgroundColor: Colors.accentLight },
  label_muted: { backgroundColor: Colors.surfaceAlt },
  labelText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium },
  labelText_default: { color: Colors.textSecondary },
  labelText_success: { color: Colors.success },
  labelText_warning: { color: Colors.warning },
  labelText_danger: { color: Colors.danger },
  labelText_accent: { color: Colors.accent },
  labelText_muted: { color: Colors.textMuted },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionAction: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
    paddingTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  energyBarTrack: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  energyBarFill: {
    borderRadius: Radius.full,
  },
  energyBarLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginTop: 4,
  },

  sliderRow: {
    marginVertical: Spacing.xs,
  },
  sliderLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  sliderDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sliderDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sliderValue: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    marginLeft: 6,
    minWidth: 18,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    fontSize: Typography.size.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.6,
  },
});
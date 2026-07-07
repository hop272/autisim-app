export const Colors = {
  // Calm teal-slate palette — chosen for sensory safety, not clinical aesthetic
  primary: '#3D7A8A',       // calm teal
  primaryLight: '#EAF4F6',
  primaryDark: '#2A5A68',

  secondary: '#6B7FA3',     // muted slate-blue
  secondaryLight: '#EEF1F7',

  accent: '#8B6BA8',        // soft purple for highlights
  accentLight: '#F2EEF8',

  // Semantic
  success: '#4A8C6A',
  successLight: '#EBF4EE',
  warning: '#B07D3A',
  warningLight: '#FBF2E6',
  danger: '#A64040',
  dangerLight: '#FAEAEA',

  // Energy levels
  energyHigh: '#4A8C6A',
  energyMid: '#B07D3A',
  energyLow: '#A64040',

  // Sensory intensity
  sensoryLow: '#4A8C6A',
  sensoryMid: '#B07D3A',
  sensoryHigh: '#A64040',

  // Neutrals
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F5',
  border: '#E2E6EC',
  borderStrong: '#C8CDD6',

  textPrimary: '#1C2536',
  textSecondary: '#5A6478',
  textMuted: '#8E97A8',
  textInverse: '#FFFFFF',

  // Recovery mode overrides (high contrast, calm)
  recoveryBg: '#0F1923',
  recoverySurface: '#1A2A3A',
  recoveryText: '#E8F4F8',
  recoveryPrimary: '#4AADCA',
  recoveryDanger: '#E07070',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
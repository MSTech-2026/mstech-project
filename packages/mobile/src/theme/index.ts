import { Platform } from 'react-native';

/**
 * GIAL DSR Design System
 *
 * All visual primitives live here so screens never duplicate or drift.
 * Import from this module, never from another screen file.
 */

/* ─── Color Palette ─────────────────────────────────────────────────── */
// Based on Kinetic Industrial Editorial Design System
export const colors = {
  // Background/Surface
  background: '#18130a', // bg0 / background
  surface: '#18130a', // same as background
  surfaceDim: '#18130a',
  surfaceBright: '#3f382e',
  surfaceContainerLowest: '#120d06',
  surfaceContainerLow: '#201b12',
  surfaceContainer: '#251f16',
  surfaceContainerHigh: '#2f2920',
  surfaceContainerHighest: '#3b342a',

  // Borders
  borderSubtle: '#302b27',
  borderDefault: '#9e8e7a', // outline
  borderStrong: '#514534', // outline-variant

  // Text
  onSurface: '#ede1d3',
  onSurfaceVariant: '#d5c4ae',
  inverseSurface: '#ede1d3',
  inverseOnSurface: '#362f26',

  text0: '#ede1d3', // on-surface
  text1: '#dbd5cf', // slightly dimmer than on-surface
  text2: '#b3aaa0', 
  text3: '#8c8278',
  text4: '#6b6158',

  // Primary (Amber)
  primary: '#ffba3d',
  onPrimary: '#432c00',
  primaryContainer: '#d4940a',
  onPrimaryContainer: '#4c3200',
  inversePrimary: '#7f5700',
  primaryFixed: '#ffdead',
  primaryFixedDim: '#ffba3d',
  onPrimaryFixed: '#281900',
  onPrimaryFixedVariant: '#604100',

  // Secondary
  secondary: '#d1c4b9',
  onSecondary: '#372f27',
  secondaryContainer: '#50473f',
  onSecondaryContainer: '#c3b6ab',
  secondaryFixed: '#eee0d5',
  secondaryFixedDim: '#d1c4b9',
  onSecondaryFixed: '#211a13',
  onSecondaryFixedVariant: '#4e453d',

  // Tertiary
  tertiary: '#99cbff',
  onTertiary: '#003354',
  tertiaryContainer: '#4da6f1',
  onTertiaryContainer: '#003a5f',
  tertiaryFixed: '#cfe5ff',
  tertiaryFixedDim: '#99cbff',
  onTertiaryFixed: '#001d34',
  onTertiaryFixedVariant: '#004a78',

  // Error
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  // Accent (for interactive elements)
  accent: '#ffba3d', // primary
  accentHover: '#ffc46a',
  accentActive: '#e6a800',
  accentSubtle: '#302510',
  accentFg: '#171412',

  // Focus
  focus: '#ffba3d', // primary

  // Status colors
  verified: '#3daa6d',
  verifiedBg: '#1a3328',
  verifiedFg: '#b8eacc',

  failed: '#d44a3a',
  failedBg: '#331a16',
  failedFg: '#ecc8c3',

  bypass: '#b89a3d',
  bypassBg: '#332a16',
  bypassFg: '#ece0c3',

  warning: '#d4a43d',
  warningBg: '#332a16',
  warningFg: '#171412',
} as const;

/* ─── Typography ────────────────────────────────────────────────────── */

/**
 * Font families — use the specified fonts from the design system.
 * Hanken Grotesk for headings, labels, metrics
 * IBM Plex Serif for body text
 */
const fontFamily = Platform.select({
  ios: undefined, // Will be set via expo-font if needed
  android: undefined,
  default: undefined,
});

const displayFamily = Platform.select({
  ios: 'Hanken Grotesk', // Headlines and metrics
  android: 'Hanken Grotesk',
  default: 'Hanken Grotesk',
});

const bodyFamily = Platform.select({
  ios: 'IBM Plex Serif', // Body text
  android: 'IBM Plex Serif',
  default: 'IBM Plex Serif',
});

const monoFamily = Platform.select({
  ios: 'JetBrains Mono', // Code/monospace
  android: 'JetBrains Mono',
  default: 'JetBrains Mono',
});

/** Minor-third type scale (1:1.2) — matches the web design system. */
export const typeScale = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
} as const;

/** Convenience lookup for common use cases. */
export const typography = {
  label: {
    fontSize: typeScale.xs,
    fontWeight: '600' as const,
    color: colors.text3,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.08, // 8% as per design system
    fontFamily: displayFamily,
  },
  body: {
    fontSize: typeScale.base,
    fontWeight: '400' as const,
    color: colors.text1,
    fontFamily: bodyFamily,
  },
  heading: {
    fontSize: typeScale['2xl'],
    fontWeight: '700' as const,
    color: colors.text0,
    letterSpacing: -0.02, // -0.02em for display-lg
    fontFamily: displayFamily,
  },
  caption: {
    fontSize: typeScale.sm,
    fontWeight: '400' as const,
    color: colors.text3,
    fontFamily: bodyFamily,
  },
  mono: {
    fontSize: typeScale.base,
    fontWeight: '600' as const,
    color: colors.text1,
    fontFamily: monoFamily,
    fontVariant: ['tabular-nums'],
  },
  displayLg: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: colors.text0,
    letterSpacing: -0.02,
    fontFamily: displayFamily,
  },
  displayLgMobile: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.text0,
    letterSpacing: -0.01,
    fontFamily: displayFamily,
  },
  headlineMd: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text0,
    letterSpacing: 0.02,
    fontFamily: displayFamily,
  },
  metricXl: {
    fontSize: 32,
    fontWeight: '600' as const,
    color: colors.text0,
    letterSpacing: -0.01,
    fontFamily: displayFamily,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400' as const,
    color: colors.text1,
    fontFamily: bodyFamily,
    lineHeight: 28,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.text1,
    fontFamily: bodyFamily,
    lineHeight: 24,
  },
} as const;

/* ─── Spacing Scale (4 px base) ────────────────────────────────────── */

export const space = {
  '0': 0,
  '1': 4,   // xs
  '2': 8,   // sm
  '3': 12,  // md-sm
  '4': 16,  // md
  '5': 20,  // md-lg
  '6': 24,  // lg / gutter
  '7': 28,  // lg-sm
  '8': 32,  // xl
  '9': 36,  // xl-sm
  '10': 40, // xl-md
  '11': 44, // xl-lg
  '12': 48, // 2xl / margin-desktop
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

/** Spacing aliases for easier reference */
export const spacing = {
  xs: space['1'],   // 4px
  sm: space['2'],   // 8px
  md: space['4'],   // 16px
  lg: space['6'],   // 24px (gutter)
  xl: space['8'],   // 32px
  '2xl': space['12'], // 48px (margin-desktop)
  '3xl': space['16'], // 64px
} as const;

/* ─── Border Radius Scale ──────────────────────────────────────────── */

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

/**
 * Standardised shadow preset (dark-theme tuned).
 */
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

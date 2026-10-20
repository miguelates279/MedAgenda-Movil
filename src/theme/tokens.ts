/**
 * Basado en dict_styles.md y DESIGN_SYSTEM.md
*/

export const tokens = {
  colors: {
    // Marca
    primary: '#259487',
    primaryHover: '#4682B4',
    primaryLight: '#e6f4f2',
    primaryDark: '#1d7369',
    secondary: '#4682B4',

    // Neutros y Superficies
    bg: '#ffffff',
    surface: '#f9fafb',
    surfaceMuted: '#f3f4f6',
    border: '#d1d5db',
    borderLight: '#e5e7eb',

    // Tipografía
    textMain: '#171717',
    textMuted: '#4b5563',
    textLight: '#9ca3af',

    // Semánticos / Feedback
    success: {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      text: '#065f46',
      badgeBg: '#d1fae5',
      badgeText: '#047857',
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      badgeBg: '#fee2e2',
      badgeText: '#b91c1c',
    },
    warning: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
    },
    info: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      badgeBg: '#dbeafe',
      badgeText: '#1d4ed8',
    },

    // Badges Especiales
    badgeCyan: {
      bg: '#cffafe',
      text: '#0e7490',
    },
    badgePurple: {
      bg: '#f3e8ff',
      text: '#7e22ce',
    },
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },

  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
  },
} as const;

export type AppTokens = typeof tokens;
export default tokens;

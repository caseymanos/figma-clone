// Figma UI3-inspired Design System
// Based on Figma's neutral color palette and modern UI patterns

export const colors = {
  // Neutral Grays (Figma-style scale)
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // UI Chrome (Dark theme)
  chrome: {
    header: '#1e1e1e',
    toolbar: '#2c2c2c',
    sidebar: '#ffffff',
    canvas: '#f8f9fa',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },

  // Accent Colors
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // Status Colors
  status: {
    online: '#10b981',
    away: '#f59e0b',
    busy: '#ef4444',
    offline: '#9ca3af',
  },

  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Text
  text: {
    primary: '#0a0a0a',
    secondary: '#525252',
    tertiary: '#a3a3a3',
    inverse: '#ffffff',
    disabled: '#d4d4d4',
  },

  // Borders
  border: {
    light: '#f5f5f5',
    base: '#e5e5e5',
    dark: '#d4d4d4',
    darker: '#a3a3a3',
  },
}

export const typography = {
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },

  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '24px',
    '3xl': '32px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    base: 1.5,
    relaxed: 1.75,
  },
}

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
}

export const borderRadius = {
  none: '0px',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
}

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  // Figma-specific shadows
  toolbar: '0 -2px 8px rgba(0, 0, 0, 0.1)',
  panel: '-2px 0 8px rgba(0, 0, 0, 0.05)',
  dropdown: '0 4px 12px rgba(0, 0, 0, 0.15)',
}

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Specific properties
  all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'background-color 150ms, border-color 150ms, color 150ms',
  transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
}

export const zIndex = {
  base: 1,
  dropdown: 100,
  sidebar: 200,
  header: 300,
  toolbar: 400,
  modal: 500,
  tooltip: 600,
  notification: 700,
}

// Component-specific design tokens
export const components = {
  button: {
    height: {
      sm: '28px',
      base: '32px',
      md: '36px',
      lg: '40px',
    },
    padding: {
      sm: '0 12px',
      base: '0 16px',
      md: '0 20px',
      lg: '0 24px',
    },
  },

  input: {
    height: {
      sm: '28px',
      base: '32px',
      md: '36px',
    },
    padding: {
      sm: '0 8px',
      base: '0 12px',
      md: '0 16px',
    },
  },

  header: {
    height: '48px',
    padding: '0 12px',
  },

  toolbar: {
    height: '44px',
    padding: '0 12px',
    gap: '4px',
  },

  sidebar: {
    width: '280px',
    collapsedWidth: '0px',
  },

  avatar: {
    size: {
      xs: '24px',
      sm: '28px',
      base: '32px',
      md: '40px',
      lg: '48px',
      xl: '56px',
    },
  },
}

// Helper function to create consistent inline styles
export const createStyles = {
  button: (variant: 'primary' | 'secondary' | 'ghost' = 'secondary') => ({
    height: components.button.height.base,
    padding: components.button.padding.base,
    borderRadius: borderRadius.base,
    border: variant === 'ghost' ? 'none' : `1px solid ${variant === 'primary' ? colors.primary[600] : colors.border.base}`,
    background: variant === 'primary' ? colors.primary[600] : variant === 'ghost' ? 'transparent' : '#ffffff',
    color: variant === 'primary' ? '#ffffff' : colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.base,
    cursor: 'pointer',
    transition: transitions.colors,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  }),

  iconButton: (size: 'sm' | 'base' | 'md' = 'base') => ({
    width: components.button.height[size],
    height: components.button.height[size],
    padding: '0',
    borderRadius: borderRadius.base,
    border: 'none',
    background: 'transparent',
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    cursor: 'pointer',
    transition: transitions.colors,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),

  input: () => ({
    height: components.input.height.base,
    padding: components.input.padding.base,
    borderRadius: borderRadius.base,
    border: `1px solid ${colors.border.base}`,
    background: '#ffffff',
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.base,
    transition: transitions.colors,
    outline: 'none',
  }),
}

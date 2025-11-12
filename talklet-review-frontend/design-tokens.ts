/**
 * Design Tokens for Talklet Review
 * Generated based on deterministic seed: sha256("Talklet Review" + "Sepolia" + "202511" + "TalkletReview.sol")
 * Theme: Academic Deep Blue
 */

export const designTokens = {
  // Color System
  colors: {
    // Primary: Deep Blue (Academic)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1e40af', // Main primary
      800: '#1e3a8a',
      900: '#1e293b',
    },
    // Secondary: Bright Blue
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Accent: Emerald Green (Success/Decrypted)
    accent: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981', // Main accent
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    // Warning: Amber (Pending)
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Main warning
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Neutral: Gray
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },

  // Dark Mode Colors
  darkMode: {
    background: '#0f172a',
    foreground: '#f8fafc',
    card: '#1e293b',
    cardForeground: '#f1f5f9',
    muted: '#334155',
    mutedForeground: '#cbd5e1',
    border: '#334155',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing
  spacing: {
    unit: 8, // Base unit: 8px
    compact: {
      xs: '0.25rem', // 4px
      sm: '0.5rem',  // 8px
      md: '1rem',    // 16px
      lg: '1.5rem',  // 24px
      xl: '2rem',    // 32px
    },
    comfortable: {
      xs: '0.5rem',  // 8px
      sm: '1rem',    // 16px
      md: '1.5rem',  // 24px
      lg: '2rem',    // 32px
      xl: '3rem',    // 48px
    },
  },

  // Border Radius
  borderRadius: {
    sm: '0.5rem',   // 8px (buttons)
    md: '0.75rem',  // 12px (cards)
    lg: '1rem',     // 16px
    full: '9999px', // pill shape
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Breakpoints
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
  },

  // Layout
  layout: {
    maxWidth: '1280px',
    gridColumns: 12,
    gutter: '1.5rem', // 24px
  },

  // Z-Index
  zIndex: {
    dropdown: 1000,
    modal: 1050,
    tooltip: 1100,
  },
} as const;

// CSS Variables for Tailwind
export const cssVariables = `
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 199 89% 48%;
  --secondary-foreground: 0 0% 100%;
  --accent: 160 84% 39%;
  --accent-foreground: 0 0% 100%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 214 32% 91%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 217 91% 60%;
  --radius: 0.75rem;
`;

export const cssVariablesDark = `
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 217 33% 17%;
  --card-foreground: 213 31% 91%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 17%;
`;

export type DesignTokens = typeof designTokens;


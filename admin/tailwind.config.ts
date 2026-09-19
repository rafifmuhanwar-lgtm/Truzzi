import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7F1D3A',
          light: '#9E2C4C',
          dark: '#5D1227',
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#64748B',
        },
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        divider: '#E2E8F0',
        border: '#CBD5E1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

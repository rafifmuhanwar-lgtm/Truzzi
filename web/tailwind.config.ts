/** Tailwind config — token mereplikasi AppColors Flutter. */
import type { Config } from 'tailwindcss'

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
        background: '#FAF8F8',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#1E1E1E',
          secondary: '#757575',
        },
        success: '#4CAF50',
        error: '#E53935',
        warning: '#FFB300',
        divider: '#EEEEEE',
        border: '#E0E0E0',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        sheet: '28px',
        btn: '12px',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0,0,0,0.04)',
        soft: '0 4px 20px rgba(0,0,0,0.05)',
        nav: '0 -5px 20px rgba(0,0,0,0.05)',
      },
      fontSize: {
        display2: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        display1: ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        display: ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        headline: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        title: ['18px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.4', fontWeight: '400' }],
        body2: ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        small: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
} satisfies Config
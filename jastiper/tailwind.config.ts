/** Tailwind config driver — token mereplikasi AppColors courier_app Flutter. */
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7F1D3A',
          light: '#A83250',
          dark: '#5A1228',
        },
        background: '#F8F6F2',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#1A1A1A',
          secondary: '#777570',
        },
        success: '#2E7D32',
        error: '#C62828',
        warning: '#E65100',
        divider: '#EFEDE8',
        border: '#E0DDD7',
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

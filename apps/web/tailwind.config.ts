import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38aaf6',
          500: '#0e8ee9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074c85',
          900: '#0c406e',
          950: '#082849',
        },
        slate: {
          850: '#151f32',
          925: '#0b1120',
          950: '#060a12',
        },
        background: '#f8fafc',
        foreground: '#0f172a',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
        border: '#e2e8f0',
        muted: {
          DEFAULT: '#f8fafc',
          foreground: '#64748b',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
        primary: {
          DEFAULT: '#d97706',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f1f5f9',
          foreground: '#0f172a',
        },
        accent: {
          DEFAULT: '#f1f5f9',
          foreground: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-brand': '0 0 30px -5px rgba(14, 142, 233, 0.4)',
        'glow-emerald': '0 0 30px -5px rgba(16, 185, 129, 0.4)',
        'glow-indigo': '0 0 30px -5px rgba(99, 102, 241, 0.4)',
        'soft-elevation': '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'card-elevated': '0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(14, 142, 233, 0.2)' },
          '50%': { boxShadow: '0 0 35px rgba(14, 142, 233, 0.5)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

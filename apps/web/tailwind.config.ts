import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1A2E',
          800: '#162240',
          700: '#1d2f58',
          600: '#243b70',
        },
        sky: {
          accent: '#2563EB',
          light: '#3B82F6',
          pale: '#EFF6FF',
        },
        chalk: '#F8FAFC',
      },
      fontFamily: {
        sora: ['var(--font-sora)', 'sans-serif'],
        figtree: ['var(--font-figtree)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(15,26,46,0.08)',
        'card-hover': '0 4px 20px 0 rgba(15,26,46,0.14)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}

export default config

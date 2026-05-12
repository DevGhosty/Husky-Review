/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        husky: {
          purple: '#4B2E83',
          'purple-dark': '#2C174F',
          'purple-soft': '#7A5AB8',
          gold: '#B7A57A',
          'gold-bright': '#D8C577',
          ink: '#111827',
          muted: '#5B6472',
          cloud: '#F6F7FA',
          line: '#E4E7EC',
          success: '#16A34A',
          warning: '#F59E0B',
        },
      },
      boxShadow: {
        glow: '0 24px 80px rgba(75, 46, 131, 0.22)',
        card: '0 20px 50px rgba(17, 24, 39, 0.10)',
        soft: '0 12px 30px rgba(75, 46, 131, 0.10)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowShift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(16px, -12px, 0) scale(1.05)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        progress: {
          from: { width: '0%' },
          to: { width: 'var(--progress-width)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-220% 0' },
          '100%': { backgroundPosition: '220% 0' },
        },
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(183, 165, 122, 0.36)' },
          '50%': { boxShadow: '0 0 0 10px rgba(183, 165, 122, 0)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'glow-shift': 'glowShift 12s ease-in-out infinite',
        'fade-up': 'fadeUp 700ms ease both',
        progress: 'progress 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        shimmer: 'shimmer 1.5s linear infinite',
        'pulse-ring': 'pulseRing 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

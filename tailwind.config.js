/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: '#ffffff',
        },
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
      transitionDuration: {
        'motion-fast': 'var(--duration-fast)',
        'motion-normal': 'var(--duration-normal)',
        'motion-slow': 'var(--duration-slow)',
        'motion-reveal': 'var(--duration-reveal)',
      },
      transitionTimingFunction: {
        brand: 'var(--ease-out)',
      },
      fontFamily: {
        sans: [
          'Nunito Variable',
          'Nunito',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        heading: ['Baloo 2', 'Fredoka Variable', 'Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
        display: ['Fredoka Variable', 'Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
        ui: [
          'Quicksand Variable',
          'Quicksand',
          'Nunito Variable',
          'Nunito',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 24px 80px rgba(75, 46, 131, 0.22)',
        card: '0 20px 50px rgba(17, 24, 39, 0.10)',
        soft: '0 12px 30px rgba(75, 46, 131, 0.10)',
        premium: '0 28px 90px rgba(28, 23, 54, 0.16)',
        frame: '0 30px 120px rgba(35, 19, 72, 0.16)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.72)',
        'gold-line': '0 0 20px rgba(216, 197, 119, 0.32)',
        'gold-line-strong': '0 0 22px rgba(216, 197, 119, 0.35)',
        'progress-track': '0 20px 50px rgba(0, 0, 0, 0.16)',
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
          from: { opacity: '0', transform: 'translateY(10px)' },
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(183, 165, 122, 0.22)' },
          '50%': { boxShadow: '0 0 0 7px rgba(183, 165, 122, 0)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) rotate(12deg)' },
          '100%': { transform: 'translateX(220%) rotate(12deg)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.62', transform: 'scale(1)' },
          '50%': { opacity: '0.82', transform: 'scale(1.02)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'glow-shift': 'glowShift 12s ease-in-out infinite',
        'fade-up': 'fadeUp 560ms cubic-bezier(0.22, 1, 0.36, 1) both',
        progress: 'progress 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        shimmer: 'shimmer 1.5s linear infinite',
        'pulse-ring': 'pulseRing 3.4s ease-in-out infinite',
        sheen: 'sheen 4.5s ease-in-out infinite',
        breathe: 'breathe 10s ease-in-out infinite',
        'slide-in': 'slideIn 480ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

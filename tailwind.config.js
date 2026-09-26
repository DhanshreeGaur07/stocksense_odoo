/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#12121a',
          raised: '#1a1a24',
          overlay: '#22222e',
        },
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(59, 130, 246, 0.35)',
        'glow-sm': '0 0 20px -8px rgba(59, 130, 246, 0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'splash-logo': {
          '0%': { opacity: '0', transform: 'scale(0.45) rotate(-12deg)' },
          '60%': { opacity: '1', transform: 'scale(1.08) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        'splash-ring': {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '40%': { opacity: '0.7' },
          '100%': { opacity: '0', transform: 'scale(1.55)' },
        },
        'splash-letter': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'splash-bar': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'splash-orbit': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'splash-orbit-rev': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'splash-pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 40px -8px rgba(59, 130, 246, 0.45)' },
          '50%': { boxShadow: '0 0 72px -4px rgba(99, 102, 241, 0.7)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.35s ease-out forwards',
        'slide-down': 'slide-down 0.25s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 4s ease-in-out infinite',
        'splash-logo': 'splash-logo 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'splash-ring': 'splash-ring 2.2s ease-out infinite',
        'splash-letter': 'splash-letter 0.5s ease-out forwards',
        'splash-bar': 'splash-bar 2.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'splash-orbit': 'splash-orbit 10s linear infinite',
        'splash-orbit-rev': 'splash-orbit-rev 10s linear infinite',
        'splash-pulse-glow': 'splash-pulse-glow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

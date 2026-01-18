import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fond
        'bg-primary': '#0B0F1A',
        'bg-secondary': '#141B2D',
        'bg-tertiary': '#1E2942',

        // Néon
        'neon-purple': '#9B5CFF',
        'neon-blue': '#3CCBFF',
        'neon-pink': '#FF4FD8',

        // Texte
        'text-primary': '#EDEDED',
        'text-secondary': '#8B9BB4',

        // États
        'success': '#00FF88',
        'danger': '#FF4757',
        'warning': '#FFB800',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'neon-purple': '0 0 20px #9B5CFF, 0 0 40px rgba(155, 92, 255, 0.3)',
        'neon-blue': '0 0 20px #3CCBFF, 0 0 40px rgba(60, 203, 255, 0.3)',
        'neon-pink': '0 0 20px #FF4FD8, 0 0 40px rgba(255, 79, 216, 0.3)',
        'neon-success': '0 0 20px #00FF88, 0 0 40px rgba(0, 255, 136, 0.3)',
        'neon-danger': '0 0 20px #FF4757, 0 0 40px rgba(255, 71, 87, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'click-flash': 'click-flash 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px #9B5CFF, 0 0 40px rgba(155, 92, 255, 0.3)' },
          '100%': { boxShadow: '0 0 30px #9B5CFF, 0 0 60px rgba(155, 92, 255, 0.5)' },
        },
        'click-flash': {
          '0%': { backgroundColor: 'rgba(155, 92, 255, 0.5)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

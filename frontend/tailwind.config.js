/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#d9e3ff',
          200: '#b3c8ff',
          300: '#8caaff',
          400: '#668cff',
          500: '#5566ff',
          600: '#3a4ce6',
          700: '#2a38bf',
          800: '#1a2699',
          900: '#0a1273',
        },
      },
      backgroundColor: {
        // Light mode
        'light-bg': '#ffffff',
        'light-bg-secondary': '#f8fafc',
        'light-bg-tertiary': '#f1f5f9',
        // Dark mode
        'dark-bg': '#0f172a',
        'dark-bg-secondary': '#1e293b',
        'dark-bg-tertiary': '#334155',
      },
      textColor: {
        // Light mode
        'light-primary': '#0f172a',
        'light-secondary': '#475569',
        'light-tertiary': '#64748b',
        // Dark mode
        'dark-primary': '#f8fafc',
        'dark-secondary': '#cbd5e1',
        'dark-tertiary': '#94a3b8',
      },
      borderColor: {
        // Light mode
        'light-border': '#e2e8f0',
        // Dark mode
        'dark-border': '#334155',
      },
      animation: {
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient 3s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      spacing: {
        'safe-top': 'max(1rem, env(safe-area-inset-top))',
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
}

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
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        'dark-bg': '#121212',
        'dark-card': '#1E1E1E',
        'dark-border': '#2A2A2A',
        'dark-accent': '#6D28D9',
        'dark-text-primary': '#E5E5E5',
        'dark-text-secondary': '#A3A3A3',
        'dark-text-muted': '#6B7280',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-in-out',
        'slide-in-left': 'slideInLeft 0.3s ease-in-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
          bg: '#121212',
          card: '#1e1e1e',
          border: '#333333',
          text: {
            primary: '#f3f4f6',
            secondary: '#9ca3af',
            muted: '#6b7280',
          },
          accent: '#8b5cf6',
        },
      },
      fontSize: {
        'xs-dynamic': 'var(--font-size-xs, 0.75rem)',
        'sm-dynamic': 'var(--font-size-sm, 0.875rem)',
        'base-dynamic': 'var(--font-size-base, 1rem)',
        'lg-dynamic': 'var(--font-size-lg, 1.125rem)',
        'xl-dynamic': 'var(--font-size-xl, 1.25rem)',
        '2xl-dynamic': 'var(--font-size-2xl, 1.5rem)',
      },
    },
  },
  plugins: [],
};
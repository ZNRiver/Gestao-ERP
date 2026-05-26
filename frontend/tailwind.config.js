/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: 'var(--primary-50)', 100: 'var(--primary-100)', 200: 'var(--primary-200)', 300: 'var(--primary-300)', 400: 'var(--primary-400)', 500: 'var(--primary-500)', 600: 'var(--primary-600)', 700: 'var(--primary-700)', 800: 'var(--primary-800)', 900: 'var(--primary-900)' },
        success: { 50: 'var(--success-50)', 500: 'var(--success-500)', 600: 'var(--success-600)' },
        warning: { 50: 'var(--warning-50)', 500: 'var(--warning-500)', 600: 'var(--warning-600)' },
        danger: { 50: 'var(--danger-50)', 500: 'var(--danger-500)', 600: 'var(--danger-600)' }
      }
    }
  },
  plugins: []
};
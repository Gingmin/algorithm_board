/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'c-primary': 'var(--color-primary)',
        'c-primary-dark': 'var(--color-primary-dark)',
        'c-bg': 'var(--color-bg)',
        'c-bg-2': 'var(--color-bg-secondary)',
        'c-bg-3': 'var(--color-bg-tertiary)',
        'c-text': 'var(--color-text)',
        'c-text-2': 'var(--color-text-secondary)',
        'c-border': 'var(--color-border)',
        'c-success': 'var(--color-success)',
        'c-error': 'var(--color-error)',
        'c-warn': 'var(--color-warning)',
      },
    },
  },
  plugins: [],
};

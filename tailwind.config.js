/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          violet: '#7c3aed',
          fuchsia: '#d946ef',
          cyan: '#06b6d4',
          amber: '#f59e0b',
        },
        brand: '#0f172a',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'brand-pop': {
          '0%': { transform: 'scale(0.7) rotate(-6deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'card-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'digit-pop': {
          '0%': { transform: 'translateY(-4px)', opacity: '0.4' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'brand-pop': 'brand-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'digit-pop': 'digit-pop 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};

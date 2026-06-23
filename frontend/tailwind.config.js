/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff1f5',
          100: '#ffe4ec',
          200: '#fecddc',
          300: '#fda4bd',
          400: '#fb7198',
          500: '#ec4777',
          600: '#d92d63',
          700: '#b91f50',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c0a',
        },
        brand: '#0f1729',
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", 'sans-serif'],
        body:    ["'Inter'", 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp:   { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
    },
  },
  plugins: [],
}

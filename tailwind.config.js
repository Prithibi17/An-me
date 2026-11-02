/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0f17',
        surface: '#151824',
        'surface-hover': '#1e2235',
        primary: {
          DEFAULT: '#7952f5',
          hover: '#693ee8',
          light: '#9b7bfa',
          glow: 'rgba(121, 82, 245, 0.35)',
        },
        accent: {
          pink: '#ff498b',
          cyan: '#00e5ff',
          yellow: '#ffb800',
        },
        card: '#161a29',
        border: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

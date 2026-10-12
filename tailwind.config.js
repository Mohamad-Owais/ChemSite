/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#15803d',
          600: '#166534',
          700: '#14532d',
          800: '#0f3f22',
          900: '#062813',
        },
        study: {
          surface: '#fbfbfb',
          card: '#ffffff',
          border: '#e5e7eb',
          subtle: '#f3f4f6',
          text: '#111827',
          muted: '#6b7280'
        }
      }
    },
  },
  plugins: [],
}

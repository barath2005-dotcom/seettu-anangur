/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2F7BFF', // Primary blue
          600: '#1d63e6',
          700: '#154ec2',
        },
        surface: {
          bg: '#F5F7FB', // Light banking background
          card: '#FFFFFF',
        },
        content: {
          main: '#172033', // Deep navy text
          muted: '#64748b',
        },
        financial: {
          success: '#10B981',
          pending: '#F59E0B',
          overdue: '#EF4444',
          disbursed: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

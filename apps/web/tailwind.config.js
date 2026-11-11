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
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F9D0D7',
          500: '#7A121D', // Royal Temple Maroon
          600: '#680E18',
          700: '#540B13',
          800: '#3F070E',
          900: '#2A0509',
        },
        gold: {
          50: '#FFFDF0',
          100: '#FEF9C3',
          200: '#FEF08A',
          400: '#FBBF24',
          500: '#F59E0B', // Temple Gold
          600: '#D97706',
          700: '#B45309',
        },
        surface: {
          bg: '#FCFAF5', // Warm Ivory background
          card: '#FFFFFF',
        },
        content: {
          main: '#1A0B0E', // Deep maroon-tinted obsidian text
          muted: '#6B585B',
        },
        financial: {
          success: '#10B981',
          pending: '#D97706',
          overdue: '#DC2626',
          disbursed: '#7A121D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

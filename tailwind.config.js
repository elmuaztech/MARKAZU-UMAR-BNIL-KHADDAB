/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#0F5132',
          'green-dark': '#064E3B',
          'green-light': '#16A34A',
          'green-emerald': '#10B981',
          sky: '#0EA5E9',
          'sky-dark': '#0284C7',
          purple: '#7C3AED',
          'purple-dark': '#6D28D9',
          gold: '#F59E0B',
          'gold-light': '#FBBF24',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        arabic: ['Traditional Arabic', 'Amiri', 'serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(22, 163, 74, 0.25)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.25)',
        'glow-sky': '0 0 20px rgba(14, 165, 233, 0.25)',
      }
    },
  },
  plugins: [],
}

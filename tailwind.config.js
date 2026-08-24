/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#0a0a0c',
          surface: '#141417',
          card: '#18181c',
          border: '#27272a',
          accent: '#ffffff',
          accentHover: '#e4e4e7',
          muted: '#8e8e93',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

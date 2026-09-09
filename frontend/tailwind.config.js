/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: "#0B0F17",
          panel: "#121824",
          card: "#182232",
          border: "#26354A",
          muted: "#94A3B8",
          text: "#F1F5F9",
          amber: "#F59E0B",
          amberLight: "#FBBF24",
          emerald: "#10B981",
          cyan: "#06B6D4"
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          canvas: "#0B1118",
          surface: "#101923",
          raised: "#162230",
          subtle: "#1C2B3C",
          border: "#1F3044",
          borderLight: "#2D425C",
          primary: "#E6EDF3",
          secondary: "#8D9FA7",
          muted: "#5A7182",
          brass: "#D97706",
          brassHover: "#B45309",
          cobalt: "#2563EB",
          cobaltHover: "#1D4ED8",
          emerald: "#10B981",
          ruby: "#EF4444"
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}

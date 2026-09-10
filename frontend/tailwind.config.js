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
          canvas: "#0A0E17",
          surface: "#111622",
          raised: "#171F30",
          subtle: "#1F2A40",
          border: "#232F46",
          borderLight: "#354564",
          primary: "#F1F5F9",
          secondary: "#94A3B8",
          muted: "#64748B",
          brass: "#F59E0B",
          brassHover: "#D97706",
          brassLight: "#FEF3C7",
          cobalt: "#3B82F6",
          cobaltHover: "#2563EB",
          cobaltLight: "#DBEAFE",
          emerald: "#10B981",
          emeraldLight: "#D1FAE5",
          ruby: "#EF4444",
          violet: "#8B5CF6",
          cyan: "#06B6D4"
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}

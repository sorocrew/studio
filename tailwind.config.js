/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          bg: "#FAFAFA",
          card: "#FFFFFF",
          black: "#000000",
          border: "#000000",
          blue: "#2563EB",
          cyan: "#00D2FF",
          yellow: "#FACC15",
          green: "#22C55E",
          red: "#EF4444",
          purple: "#A855F7",
        }
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
        'brutal-blue': '4px 4px 0px 0px #2563EB',
        'brutal-yellow': '4px 4px 0px 0px #FACC15',
      },
      fontFamily: {
        display: ['"Black Ops One"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}

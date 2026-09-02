/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0f172a",
        darkSurface: "#1e293b",
        darkCard: "#334155",
        accentPrimary: "#3b82f6",
        riskLow: "#10b981",
        riskMedium: "#f59e0b",
        riskHigh: "#f97316",
        riskCritical: "#ef4444",
      }
    },
  },
  plugins: [],
}

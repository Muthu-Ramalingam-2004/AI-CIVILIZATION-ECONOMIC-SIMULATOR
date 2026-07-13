/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#0a0b10",
          darker: "#050508",
          card: "rgba(16, 17, 28, 0.65)",
          border: "rgba(255, 255, 255, 0.08)",
          accent: "#a855f7", // Violet-500
          neonCyan: "#06b6d4",
          neonEmerald: "#10b981",
          neonRose: "#f43f5e",
          neonYellow: "#eab308"
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.4)',
        'neon-purple': '0 0 15px rgba(168, 85, 247, 0.4)',
      }
    },
  },
  plugins: [],
}

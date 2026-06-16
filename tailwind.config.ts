import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          750: "#283548",
          800: "#1e293b",
          850: "#172033",
          900: "#0f172a",
          950: "#020617",
        },
        accent: {
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
          violet: "#8b5cf6",
        },
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "pill": "9999px",
      },
      boxShadow: {
        "glow-brand": "0 0 20px -5px rgba(59, 130, 246, 0.4)",
        "glow-brand-lg": "0 0 40px -10px rgba(59, 130, 246, 0.3)",
        "glow-accent": "0 0 20px -5px rgba(16, 185, 129, 0.4)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3)",
        "elevated": "0 4px 24px -4px rgba(0, 0, 0, 0.5)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

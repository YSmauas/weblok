import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "var(--bg)",
          panel: "var(--panel)",
          panel2: "var(--panel-2)",
          border: "var(--border)",
        },
        ink: {
          primary: "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          muted: "var(--ink-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        success: "#7fae6f",
        danger: "#c96a5a",
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "sans-serif"],
        mono: ["'JetBrains Mono'", "Consolas", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
          "50%": { transform: "translateY(-26px) translateX(8px) rotate(5deg)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
          "50%": { transform: "translateY(20px) translateX(-10px) rotate(-4deg)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        floatSlow: "floatSlow 15s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

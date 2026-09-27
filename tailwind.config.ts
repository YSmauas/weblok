import type { Config } from "tailwindcss";

/**
 * צבע ממשתנה CSS שתומך גם במודיפייר שקיפות (bg-accent/15, border-accent/40...).
 * בלי <alpha-value> טיילווינד פשוט לא מייצר את המחלקות האלה - וכך היה עד עכשיו
 * בכל האתר (מצבי hover/active שקטים, מסגרות שלא הופיעו).
 */
const cssVar = (name: string) => `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: cssVar("bg"),
          panel: cssVar("panel"),
          panel2: cssVar("panel-2"),
          border: cssVar("border"),
        },
        ink: {
          primary: cssVar("ink-primary"),
          secondary: cssVar("ink-secondary"),
          muted: cssVar("ink-muted"),
        },
        accent: {
          DEFAULT: cssVar("accent"),
          hover: cssVar("accent-hover"),
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

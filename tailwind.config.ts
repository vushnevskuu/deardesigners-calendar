import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dd: {
          bg: "var(--dd-bg)",
          surface: "var(--dd-surface)",
          "surface-soft": "var(--dd-surface-soft)",
          ink: "var(--dd-ink)",
          muted: "var(--dd-muted)",
          border: "var(--dd-border)",
          hairline: "var(--dd-hairline)",
          accent: "var(--dd-accent)",
          "accent-soft": "var(--dd-accent-soft)",
          highlight: "var(--dd-highlight)",
        },
      },
      borderRadius: {
        "dd-card": "var(--dd-radius-card)",
        "dd-pill": "var(--dd-radius-pill)",
      },
      boxShadow: {
        "dd-soft": "var(--dd-shadow-soft)",
      },
      fontFamily: {
        sans: [
          "Onest",
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Onest",
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-2xl": [
          "clamp(64px, 11vw, 168px)",
          { lineHeight: "0.92", letterSpacing: "-0.04em", fontWeight: "600" },
        ],
        "display-xl": [
          "clamp(48px, 8vw, 112px)",
          { lineHeight: "0.94", letterSpacing: "-0.035em", fontWeight: "600" },
        ],
        "display-lg": [
          "clamp(36px, 5vw, 72px)",
          { lineHeight: "0.96", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        "display-md": [
          "clamp(28px, 3.4vw, 44px)",
          { lineHeight: "1.0", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
      },
    },
  },
  plugins: [],
};

export default config;

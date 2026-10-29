const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    path.join(__dirname, "src/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "../../packages/schema/src/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        "canvas-2": "var(--bg-canvas-2)",
        surface: "var(--bg-surface)",
        "surface-soft": "var(--bg-surface-soft)",
        elevated: "var(--bg-elevated)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        main: "var(--text-main)",
        soft: "var(--text-soft)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        "accent-soft": "var(--accent-soft)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

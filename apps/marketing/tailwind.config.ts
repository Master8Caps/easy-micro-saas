import type { Config } from "tailwindcss";
import sharedConfig from "@repo/ui/tailwind-preset";

const config: Config = {
  presets: [sharedConfig as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        sage: "rgb(var(--color-sage) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        birch: "rgb(var(--color-birch) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "var(--font-outfit)", "sans-serif"],
        body: ["var(--font-body)", "var(--font-dm-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

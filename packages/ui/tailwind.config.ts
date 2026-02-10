import type { Config } from "tailwindcss";

const config: Partial<Config> = {
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
};

export default config;

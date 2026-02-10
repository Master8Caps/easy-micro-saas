import type { Config } from "tailwindcss";
import sharedConfig from "@repo/ui/tailwind-preset";

const config: Config = {
  presets: [sharedConfig as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

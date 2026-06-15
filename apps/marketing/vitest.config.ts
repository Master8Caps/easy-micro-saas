import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The @repo/ui barrel re-exports .tsx components, so importing from it pulls
  // JSX into the module graph. The base tsconfig sets jsx: "preserve", which
  // makes Vite's default transform leave JSX unparsed; the React plugin handles
  // it so node-environment unit tests can resolve the barrel.
  plugins: [react()],
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});

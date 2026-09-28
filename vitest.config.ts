import { defineConfig } from "vitest/config";

// -----
// Kept apart from vite.config.ts — the Cloudflare
// plugin there rejects vitest's node environment,
// and core tests need no plugins anyway.
// -----
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

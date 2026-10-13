import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/*/src/**/*.test.ts",
      "packages/*/src/**/*.test.tsx",
      "apps/web/**/*.test.ts",
      "apps/web/**/*.test.tsx",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
  },
});

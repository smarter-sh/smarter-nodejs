import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/models/sam/**"],
      reporter: ["text", "lcov"],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});

import path from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/generated": path.resolve(import.meta.dirname, "generated"),
      "@/tests": path.resolve(import.meta.dirname, "tests"),
      "@": path.resolve(import.meta.dirname, "src"),
      "next/navigation": "next/dist/client/components/navigation.react-server.js",
    },
  },
  ssr: {
    resolve: {
      conditions: ["react-server"],
    },
  },
  test: {
    exclude: [...configDefaults.exclude, ".claude/worktrees/**", ".tmp/**"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    forceRerunTriggers: [
      ...configDefaults.forceRerunTriggers,
      ...[
        "package.json",
        "pnpm-lock.yaml",
        "vitest.config.mts",
        "tests/global-setup.ts",
        "tests/setup.ts",
        "tests/worker-database.ts",
        "prisma.config.ts",
        "src/infra/prisma/schema.prisma",
        "src/infra/prisma/migrations/**",
      ].map((relativePath) => path.resolve(import.meta.dirname, relativePath)),
    ],
    pool: "forks",
    isolate: true,
  },
});

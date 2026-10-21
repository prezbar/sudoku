import { afterEach, expect, test, vi } from "vitest";

import { z } from "zod";

async function importEnv() {
  vi.resetModules();
  return (await import("./env.server")).env;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

test("reads the database file URL the environment sets", async () => {
  vi.stubEnv("DATABASE_URL", "file:./data/app.db");

  await expect(importEnv()).resolves.toMatchObject({ DATABASE_URL: "file:./data/app.db" });
});

test("falls back to the development environment when NODE_ENV is unset", async () => {
  vi.stubEnv("NODE_ENV", undefined);

  await expect(importEnv()).resolves.toMatchObject({ NODE_ENV: "development" });
});

test("rejects a missing database URL", async () => {
  vi.stubEnv("DATABASE_URL", undefined);

  await expect(importEnv()).rejects.toThrow(z.ZodError);
});

test("rejects a database URL that is not a URL", async () => {
  vi.stubEnv("DATABASE_URL", "data/app.db");

  await expect(importEnv()).rejects.toThrow(z.ZodError);
});

test("rejects a database URL that is not a file URL", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/app");

  await expect(importEnv()).rejects.toThrow(z.ZodError);
});

test("rejects a NODE_ENV outside the three known environments", async () => {
  vi.stubEnv("NODE_ENV", "staging");

  await expect(importEnv()).rejects.toThrow(z.ZodError);
});

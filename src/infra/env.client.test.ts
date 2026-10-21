import { afterEach, expect, test, vi } from "vitest";

import { z } from "zod";

async function importEnv() {
  vi.resetModules();
  return (await import("./env.client")).env;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

test("exposes the app URL the environment sets", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");

  await expect(importEnv()).resolves.toEqual({ NEXT_PUBLIC_APP_URL: "https://app.example.com" });
});

test("rejects a missing app URL", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);

  await expect(importEnv()).rejects.toThrow(z.ZodError);
});

test("rejects an app URL that is not a URL", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "app.example.com");

  await expect(importEnv()).rejects.toThrow(z.ZodError);
});

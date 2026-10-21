import { afterEach, beforeAll, beforeEach, expect, inject } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { workerDatabaseUrl } from "./worker-database";

export type ResetHookContext = { testName: string; seed: number };
export type ResetHook = (context: ResetHookContext) => void | Promise<void>;

let isFileSetUp = false;
const resetHooks = new Set<ResetHook>();

export function isDatabaseSetUp() {
  return isFileSetUp;
}

export function registerResetHook(hook: ResetHook) {
  resetHooks.add(hook);
}

function seedFromTestName(testName: string) {
  let hash = 2166136261;
  for (let index = 0; index < testName.length; index++) {
    hash ^= testName.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const quoted = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

async function restoreTemplateRows(db: PrismaClient, templateDatabasePath: string) {
  const [{ foreign_keys: foreignKeysSetting }] =
    await db.$queryRawUnsafe<{ foreign_keys: number | bigint }[]>("PRAGMA foreign_keys");
  await db.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  await db.$executeRawUnsafe(`ATTACH DATABASE '${templateDatabasePath.replaceAll("'", "''")}' AS template`);
  try {
    const tables = await db.$queryRawUnsafe<{ name: string }[]>(
      "SELECT name FROM main.sqlite_master WHERE type = 'table' AND name <> '_prisma_migrations' " +
        "AND (name NOT LIKE 'sqlite%' OR name = 'sqlite_sequence')",
    );
    const restoreStatements = tables.flatMap(({ name }) => [
      `DELETE FROM main.${quoted(name)}`,
      `INSERT INTO main.${quoted(name)} SELECT * FROM template.${quoted(name)}`,
    ]);
    await db.$transaction(restoreStatements.map((statement) => db.$executeRawUnsafe(statement)));
  } finally {
    await db.$executeRawUnsafe("DETACH DATABASE template");
    await db.$executeRawUnsafe(`PRAGMA foreign_keys = ${Number(foreignKeysSetting) ? "ON" : "OFF"}`);
  }
}

export function setupDatabase(db: PrismaClient) {
  if (isFileSetUp) {
    throw new Error("setupDatabase() was called twice in this file — call it once, at the top of the file");
  }
  const templateDatabasePath = inject("templateDatabasePath");
  const poolId = process.env.VITEST_POOL_ID;
  if (
    !templateDatabasePath ||
    !poolId ||
    process.env.DATABASE_URL !== workerDatabaseUrl(templateDatabasePath, poolId)
  ) {
    throw new Error(
      `refusing to reset ${process.env.DATABASE_URL} — only this worker's test database may be reset; ` +
        "check that tests/global-setup.ts and tests/setup.ts are wired in vitest.config.mts",
    );
  }
  isFileSetUp = true;

  const reset = () => restoreTemplateRows(db, templateDatabasePath);

  beforeAll(reset);
  beforeEach(async () => {
    const testName = expect.getState().currentTestName ?? "";
    const seed = seedFromTestName(testName);
    for (const hook of resetHooks) await hook({ testName, seed });
  });
  afterEach(reset);
}

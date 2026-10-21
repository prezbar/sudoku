import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import type { TestProject } from "vitest/node";

import { workerDatabasePath } from "./worker-database";

function migrate(databasePath: string) {
  const prismaCliPath = createRequire(path.join(process.cwd(), "package.json")).resolve("prisma/build/index.js");
  const migration = spawnSync(process.execPath, [prismaCliPath, "migrate", "deploy"], {
    encoding: "utf-8",
    env: { ...process.env, DATABASE_URL: `file:${databasePath}` },
  });
  if (migration.status !== 0) {
    throw new Error(`\`prisma migrate deploy\` failed:\n${migration.stdout}${migration.stderr}`);
  }
}

function workerCount(project: TestProject) {
  return project.config.maxWorkers || project.vitest.config.maxWorkers || os.availableParallelism();
}

export default function setup(project: TestProject) {
  const runDirectory = mkdtempSync(path.join(os.tmpdir(), "sudoku-tests-"));
  const removeRunDirectory = () => rmSync(runDirectory, { recursive: true, force: true });
  const templateDatabasePath = path.join(runDirectory, "template.db");

  try {
    migrate(templateDatabasePath);
    for (let poolId = 1; poolId <= workerCount(project); poolId++) {
      copyFileSync(templateDatabasePath, workerDatabasePath(templateDatabasePath, String(poolId)));
    }
  } catch (error) {
    removeRunDirectory();
    throw error;
  }

  project.provide("templateDatabasePath", templateDatabasePath);
  return removeRunDirectory;
}

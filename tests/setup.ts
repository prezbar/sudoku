import { inject } from "vitest";

import { workerDatabaseUrl } from "./worker-database";

const poolId = process.env.VITEST_POOL_ID;
const templateDatabasePath = inject("templateDatabasePath");

if (!poolId || !templateDatabasePath) {
  throw new Error(
    "no worker database for this file: tests/setup.ts must run from `setupFiles`, inside a Vitest worker, " +
      "after tests/global-setup.ts ran from `globalSetup`",
  );
}

process.env.DATABASE_URL = workerDatabaseUrl(templateDatabasePath, poolId);

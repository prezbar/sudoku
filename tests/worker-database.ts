import path from "node:path";

declare module "vitest" {
  export interface ProvidedContext {
    templateDatabasePath: string;
  }
}

export function workerDatabasePath(templateDatabasePath: string, poolId: string) {
  return path.join(path.dirname(templateDatabasePath), `worker-${poolId}.db`);
}

export function workerDatabaseUrl(templateDatabasePath: string, poolId: string) {
  return `file:${workerDatabasePath(templateDatabasePath, poolId)}`;
}

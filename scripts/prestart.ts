import "dotenv/config";
import { z } from "zod";

type Check = {
  name: string;
  run: () => Promise<string | void> | string | void;
  formatError?: (error: unknown) => string;
};

const checks: Check[] = [
  {
    name: "environment",
    run: async () => {
      const { env } = await import("@/infra/env.server");
      return `NODE_ENV=${env.NODE_ENV}`;
    },
    formatError: (error) => (error instanceof z.ZodError ? z.prettifyError(error) : String(error)),
  },
];

async function main() {
  for (const check of checks) {
    console.log(`prestart: ${check.name}…`);
    try {
      const detail = await check.run();
      console.log(`prestart: ${check.name} OK${detail ? ` (${detail})` : ""}`);
    } catch (error: unknown) {
      console.error(`prestart: ${check.name} FAILED`);
      console.error(check.formatError ? check.formatError(error) : error);
      process.exit(1);
    }
  }
}

main().catch((error: unknown) => {
  console.error("prestart: unexpected failure");
  console.error(error);
  process.exit(1);
});

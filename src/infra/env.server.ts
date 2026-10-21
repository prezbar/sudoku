import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url({ protocol: /^file$/ }),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = schema.parse(process.env);

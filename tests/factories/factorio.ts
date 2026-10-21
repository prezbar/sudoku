import { initPrismaFactorio } from "@flefebvre/prisma-factorio";

import { db } from "@/infra/prisma/db";
import { isDatabaseSetUp, registerResetHook } from "@/tests/database";

export const prismaFactorio = initPrismaFactorio(
  () => {
    if (!isDatabaseSetUp()) {
      throw new Error("call setupDatabase(db) at the top of this test file");
    }
    return db;
  },
  { locale: "en" },
);

registerResetHook(({ seed }) => prismaFactorio.reseed(seed));

import { expect, test } from "vitest";

import { db } from "@/infra/prisma/db";

import { setupDatabase } from "./database";
import { userFactory } from "./factories/user";

setupDatabase(db);

test("the first of two ordered tests commits a user", async () => {
  await userFactory.create();

  await expect(db.user.count()).resolves.toBe(1);
});

test("the second of two ordered tests starts without the user the first one committed", async () => {
  await expect(db.user.count()).resolves.toBe(0);
});

test("a second setupDatabase call in the same file throws", () => {
  expect(() => setupDatabase(db)).toThrow("called twice");
});

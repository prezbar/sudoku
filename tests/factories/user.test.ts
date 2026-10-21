import { expect, test } from "vitest";

import { db } from "@/infra/prisma/db";
import { setupDatabase } from "@/tests/database";

import { userFactory } from "./user";

setupDatabase(db);

test("the factory persists a user the client can read back", async () => {
  const user = await userFactory.create();

  await expect(db.user.findUniqueOrThrow({ where: { id: user.id } })).resolves.toEqual(user);
});

test("the schema fills the id with a cuid", async () => {
  const user = await userFactory.create();

  expect(user.id).toMatch(/^[a-z][a-z0-9]+$/);
});

test("a batch draws one distinct email per record", async () => {
  const users = await userFactory.count(3).create();

  expect(new Set(users.map((user) => user.email)).size).toBe(3);
});

test("an override sets the email the test names", async () => {
  const user = await userFactory.create({ email: "ada@example.com" });

  expect(user.email).toBe("ada@example.com");
});

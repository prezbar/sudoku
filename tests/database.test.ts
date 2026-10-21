import { expect, test } from "vitest";

import { db } from "@/infra/prisma/db";

import { setupDatabase } from "./database";
import { gameFactory } from "./factories/game";

setupDatabase(db);

test("the first of two ordered tests commits a game", async () => {
  await gameFactory.create();

  await expect(db.game.count()).resolves.toBe(1);
});

test("the second of two ordered tests starts without the game the first one committed", async () => {
  await expect(db.game.count()).resolves.toBe(0);
});

test("a second setupDatabase call in the same file throws", () => {
  expect(() => setupDatabase(db)).toThrow("called twice");
});

import { expect, test } from "vitest";

import { db } from "@/infra/prisma/db";
import { parseGrid } from "@/lib/sudoku/grid";
import { countSolutions } from "@/lib/sudoku/solver";
import { setupDatabase } from "@/tests/database";

import { gameFactory } from "./game";

setupDatabase(db);

test("the factory persists a game the client can read back", async () => {
  const game = await gameFactory.create();

  await expect(db.game.findUniqueOrThrow({ where: { id: game.id } })).resolves.toEqual(game);
});

test("a game starts as an unfinished puzzle with a single solution", async () => {
  const game = await gameFactory.create();

  expect(countSolutions(parseGrid(game.puzzle))).toBe(1);
  expect(game).toMatchObject({ completedAt: null, durationInSeconds: null, playerName: null });
});

test("a batch draws one distinct puzzle per game", async () => {
  const games = await gameFactory.count(3).create();

  expect(new Set(games.map((game) => game.puzzle)).size).toBe(3);
});

test("a completed game carries its end and the duration between its start and end, but no player yet", async () => {
  const game = await gameFactory.completed().create();

  expect(game.playerName).toBeNull();
  expect(game.completedAt!.getTime() - game.startedAt.getTime()).toBe(game.durationInSeconds! * 1000);
});

test("a named game carries its player", async () => {
  const game = await gameFactory.completed().named().create();

  expect(game.playerName).toEqual(expect.any(String));
});

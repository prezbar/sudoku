import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { expect, test } from "vitest";

import { db } from "@/infra/prisma/db";
import { parseGrid } from "@/lib/sudoku/grid";
import { countSolutions } from "@/lib/sudoku/solver";
import { setupDatabase } from "@/tests/database";

import { startGame } from "./actions";

setupDatabase(db);

async function redirectUrlOf(pendingAction: Promise<unknown>) {
  const thrown = await pendingAction.then(
    () => null,
    (error: unknown) => error,
  );
  if (!isRedirectError(thrown)) throw new Error("the action did not redirect");
  return getURLFromRedirectError(thrown);
}

test("starting a game saves an unfinished game and redirects to its page", async () => {
  const redirectUrl = await redirectUrlOf(startGame(null, new FormData()));

  const game = await db.game.findFirstOrThrow();
  expect(redirectUrl).toBe(`/games/${game.id}`);
  expect(game).toMatchObject({ completedAt: null, durationInSeconds: null, playerName: null });
});

test("a started game holds a puzzle with a single solution and at least the medium target of givens", async () => {
  await redirectUrlOf(startGame(null, new FormData()));

  const puzzle = parseGrid((await db.game.findFirstOrThrow()).puzzle);
  expect(countSolutions(puzzle)).toBe(1);
  expect(puzzle.filter((value) => value !== 0).length).toBeGreaterThanOrEqual(32);
});

test("two started games get two different puzzles", async () => {
  await redirectUrlOf(startGame(null, new FormData()));
  await redirectUrlOf(startGame(null, new FormData()));

  const games = await db.game.findMany();
  expect(games).toHaveLength(2);
  expect(games[0].puzzle).not.toBe(games[1].puzzle);
});

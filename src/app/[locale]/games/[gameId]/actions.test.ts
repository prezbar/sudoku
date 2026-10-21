import { refresh } from "next/cache";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { db } from "@/infra/prisma/db";
import { parseGrid, serializeGrid } from "@/lib/sudoku/grid";
import { solvePuzzle } from "@/lib/sudoku/solver";
import { setupDatabase } from "@/tests/database";
import { gameFactory } from "@/tests/factories/game";

import { completeGame } from "./actions";

vi.mock("next/cache", () => ({ refresh: vi.fn() }));

setupDatabase(db);

const startedAt = new Date("2026-10-21T10:00:00.000Z");
const submittedAt = new Date("2026-10-21T10:12:34.000Z");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(submittedAt);
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(refresh).mockClear();
});

async function createGameWithSolution() {
  const game = await gameFactory.create({ startedAt });
  const solution = solvePuzzle(parseGrid(game.puzzle));
  if (!solution) throw new Error("the factory built a puzzle with no solution");
  return { game, solution };
}

function completionForm(fields: { gameId: string; grid: string; playerName: string }) {
  const formData = new FormData();
  Object.entries(fields).forEach(([name, value]) => formData.set(name, value));
  return formData;
}

test("a solved grid completes the game with the trimmed name and the time the server measured", async () => {
  const { game, solution } = await createGameWithSolution();

  const result = await completeGame(
    null,
    completionForm({ gameId: game.id, grid: serializeGrid(solution), playerName: "  Ada  " }),
  );

  expect(result).toMatchObject({ status: "success", data: { durationInSeconds: 754 } });
  await expect(db.game.findUniqueOrThrow({ where: { id: game.id } })).resolves.toMatchObject({
    completedAt: submittedAt,
    durationInSeconds: 754,
    playerName: "Ada",
  });
});

test("completing a game refreshes the page so the best times show it", async () => {
  const { game, solution } = await createGameWithSolution();

  await completeGame(null, completionForm({ gameId: game.id, grid: serializeGrid(solution), playerName: "Ada" }));

  expect(refresh).toHaveBeenCalledOnce();
});

test("a full grid that breaks the rules is rejected and leaves the game unfinished", async () => {
  const { game, solution } = await createGameWithSolution();
  const brokenGrid = solution.slice();
  const freeCellIndexes = parseGrid(game.puzzle).flatMap((value, cellIndex) => (value === 0 ? [cellIndex] : []));
  brokenGrid[freeCellIndexes[0]] = (brokenGrid[freeCellIndexes[0]] % 9) + 1;

  const result = await completeGame(
    null,
    completionForm({ gameId: game.id, grid: serializeGrid(brokenGrid), playerName: "Ada" }),
  );

  expect(result).toMatchObject({ status: "error", error: { type: "gridNotSolved" } });
  await expect(db.game.findUniqueOrThrow({ where: { id: game.id } })).resolves.toMatchObject({ completedAt: null });
  expect(refresh).not.toHaveBeenCalled();
});

test("a valid grid that changes a given is rejected", async () => {
  const { game, solution } = await createGameWithSolution();
  const relabeledSolution = solution.map((value) => (value % 9) + 1);

  const result = await completeGame(
    null,
    completionForm({ gameId: game.id, grid: serializeGrid(relabeledSolution), playerName: "Ada" }),
  );

  expect(result).toMatchObject({ status: "error", error: { type: "gridNotSolved" } });
});

test("a game that is already completed is rejected and keeps its first result", async () => {
  const { game, solution } = await createGameWithSolution();
  const grid = serializeGrid(solution);
  await completeGame(null, completionForm({ gameId: game.id, grid, playerName: "Ada" }));
  vi.setSystemTime(new Date("2026-10-21T11:00:00.000Z"));

  const result = await completeGame(null, completionForm({ gameId: game.id, grid, playerName: "Grace" }));

  expect(result).toMatchObject({ status: "error", error: { type: "gameAlreadyCompleted" } });
  await expect(db.game.findUniqueOrThrow({ where: { id: game.id } })).resolves.toMatchObject({
    playerName: "Ada",
    durationInSeconds: 754,
  });
});

test("an unknown game is rejected", async () => {
  const { solution } = await createGameWithSolution();

  const result = await completeGame(
    null,
    completionForm({ gameId: "unknown", grid: serializeGrid(solution), playerName: "Ada" }),
  );

  expect(result).toMatchObject({ status: "error", error: { type: "gameNotFound" } });
});

test.each([
  ["empty", "", "playerNameRequired"],
  ["blank", "    ", "playerNameRequired"],
  ["31 characters long", "a".repeat(31), "playerNameTooLong"],
])("a name that is %s is rejected with its key", async (_, playerName, errorKey) => {
  const { game, solution } = await createGameWithSolution();

  const result = await completeGame(
    null,
    completionForm({ gameId: game.id, grid: serializeGrid(solution), playerName }),
  );

  expect(result).toMatchObject({
    status: "error",
    error: { type: "schema", data: { fieldErrors: { playerName: [errorKey] } } },
  });
  await expect(db.game.findUniqueOrThrow({ where: { id: game.id } })).resolves.toMatchObject({ completedAt: null });
});

test.each([
  ["an empty cell", (grid: string) => `0${grid.slice(1)}`],
  ["80 cells", (grid: string) => grid.slice(1)],
  ["a letter", (grid: string) => `x${grid.slice(1)}`],
])("a grid with %s is rejected before the game is read", async (_, malformGrid) => {
  const { game, solution } = await createGameWithSolution();

  const result = await completeGame(
    null,
    completionForm({ gameId: game.id, grid: malformGrid(serializeGrid(solution)), playerName: "Ada" }),
  );

  expect(result).toMatchObject({
    status: "error",
    error: { type: "schema", data: { fieldErrors: { grid: ["invalidGrid"] } } },
  });
});

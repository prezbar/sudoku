import { refresh } from "next/cache";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { db } from "@/infra/prisma/db";
import { parseGrid, serializeGrid } from "@/lib/sudoku/grid";
import { solvePuzzle } from "@/lib/sudoku/solver";
import { setupDatabase } from "@/tests/database";
import { gameFactory } from "@/tests/factories/game";

import { completeGame, savePlayerName } from "./actions";

vi.mock("next/cache", () => ({ refresh: vi.fn() }));

setupDatabase(db);

const startedAt = new Date("2026-10-21T10:00:00.000Z");
const solvedAt = new Date("2026-10-21T10:12:34.000Z");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(solvedAt);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.mocked(refresh).mockClear();
});

async function createGameWithSolution() {
  const game = await gameFactory.create({ startedAt });
  const solution = solvePuzzle(parseGrid(game.puzzle));
  if (!solution) throw new Error("the factory built a puzzle with no solution");
  return { game, solution: serializeGrid(solution) };
}

async function createCompletedGame() {
  const { game, solution } = await createGameWithSolution();
  await completeGame({ gameId: game.id, solution });
  return game;
}

function writeConcurrentlyBeforeNextGamesUpdate(concurrentWrite: () => Promise<unknown>) {
  const updateGames = db.game.updateMany.bind(db.game);
  vi.spyOn(db.game, "updateMany").mockImplementationOnce(
    (args) => concurrentWrite().then(() => updateGames(args)) as ReturnType<typeof updateGames>,
  );
}

function submitPlayerName(gameId: string, playerName: string) {
  const formData = new FormData();
  formData.set("gameId", gameId);
  formData.set("playerName", playerName);
  return savePlayerName(null, formData);
}

function findStoredGame(gameId: string) {
  return db.game.findUniqueOrThrow({ where: { id: gameId } });
}

test("a solution completes the game with the time the server measured, and no name yet", async () => {
  const { game, solution } = await createGameWithSolution();

  const result = await completeGame({ gameId: game.id, solution });

  expect(result).toMatchObject({ status: "success", data: { durationInSeconds: 754 } });
  await expect(findStoredGame(game.id)).resolves.toMatchObject({
    completedAt: solvedAt,
    durationInSeconds: 754,
    playerName: null,
  });
});

test("completing a game that is already completed keeps and returns its first duration", async () => {
  const { game, solution } = await createGameWithSolution();
  await completeGame({ gameId: game.id, solution });
  vi.setSystemTime(new Date("2026-10-21T11:00:00.000Z"));

  const result = await completeGame({ gameId: game.id, solution });

  expect(result).toMatchObject({ data: { durationInSeconds: 754 } });
  expect((await findStoredGame(game.id)).completedAt).toEqual(solvedAt);
});

test("a game another request completes first returns the duration that request saved", async () => {
  const { game, solution } = await createGameWithSolution();
  writeConcurrentlyBeforeNextGamesUpdate(() =>
    db.game.update({ where: { id: game.id }, data: { completedAt: startedAt, durationInSeconds: 300 } }),
  );

  const result = await completeGame({ gameId: game.id, solution });

  expect(result).toMatchObject({ status: "success", data: { durationInSeconds: 300 } });
});

test("completing a game does not refresh the page, as the best times only list named games", async () => {
  const { game, solution } = await createGameWithSolution();

  await completeGame({ gameId: game.id, solution });

  expect(refresh).not.toHaveBeenCalled();
});

test("a full grid that breaks the rules is rejected and leaves the game unfinished", async () => {
  const { game, solution } = await createGameWithSolution();
  const brokenGrid = parseGrid(solution);
  const freeCellIndexes = parseGrid(game.puzzle).flatMap((value, cellIndex) => (value === 0 ? [cellIndex] : []));
  brokenGrid[freeCellIndexes[0]] = (brokenGrid[freeCellIndexes[0]] % 9) + 1;

  const result = await completeGame({ gameId: game.id, solution: serializeGrid(brokenGrid) });

  expect(result).toMatchObject({ status: "error", error: { type: "gridNotSolved" } });
  await expect(findStoredGame(game.id)).resolves.toMatchObject({ completedAt: null });
});

test("a valid grid that changes a given is rejected", async () => {
  const { game, solution } = await createGameWithSolution();
  const relabeledSolution = parseGrid(solution).map((value) => (value % 9) + 1);

  const result = await completeGame({ gameId: game.id, solution: serializeGrid(relabeledSolution) });

  expect(result).toMatchObject({ status: "error", error: { type: "gridNotSolved" } });
});

test("completing an unknown game is rejected", async () => {
  const { solution } = await createGameWithSolution();

  const result = await completeGame({ gameId: "unknown", solution });

  expect(result).toMatchObject({ status: "error", error: { type: "gameNotFound" } });
});

test.each([
  ["an empty cell", (solution: string) => `0${solution.slice(1)}`],
  ["80 cells", (solution: string) => solution.slice(1)],
  ["a letter", (solution: string) => `x${solution.slice(1)}`],
])("a solution with %s is rejected before the game is read", async (_, malformSolution) => {
  const { game, solution } = await createGameWithSolution();

  const result = await completeGame({ gameId: game.id, solution: malformSolution(solution) });

  expect(result).toMatchObject({
    status: "error",
    error: { type: "schema", data: { fieldErrors: { solution: ["invalidSolution"] } } },
  });
});

test("saving a name on a completed game stores the trimmed name and returns it", async () => {
  const game = await createCompletedGame();

  const result = await submitPlayerName(game.id, "  Ada  ");

  expect(result).toMatchObject({ status: "success", data: { playerName: "Ada" } });
  await expect(findStoredGame(game.id)).resolves.toMatchObject({
    playerName: "Ada",
    durationInSeconds: 754,
  });
});

test("saving a name refreshes the page so the best times show it", async () => {
  const game = await createCompletedGame();

  await submitPlayerName(game.id, "Ada");

  expect(refresh).toHaveBeenCalledOnce();
});

test("saving a name on a game that is not completed is rejected", async () => {
  const { game } = await createGameWithSolution();

  const result = await submitPlayerName(game.id, "Ada");

  expect(result).toMatchObject({ status: "error", error: { type: "gameNotCompleted" } });
  await expect(findStoredGame(game.id)).resolves.toMatchObject({ playerName: null });
  expect(refresh).not.toHaveBeenCalled();
});

test.each([
  ["by an earlier request", (gameId: string) => submitPlayerName(gameId, "Ada")],
  [
    "by a concurrent request",
    async (gameId: string) =>
      writeConcurrentlyBeforeNextGamesUpdate(() =>
        db.game.update({ where: { id: gameId }, data: { playerName: "Ada" } }),
      ),
  ],
])("a name saved %s wins over a later one", async (_, saveFirstPlayerName) => {
  const game = await createCompletedGame();
  await saveFirstPlayerName(game.id);

  const result = await submitPlayerName(game.id, "Grace");

  expect(result).toMatchObject({ status: "error", error: { type: "playerNameAlreadySaved" } });
  await expect(findStoredGame(game.id)).resolves.toMatchObject({ playerName: "Ada" });
});

test("saving a name on an unknown game is rejected", async () => {
  const result = await submitPlayerName("unknown", "Ada");

  expect(result).toMatchObject({ status: "error", error: { type: "gameNotFound" } });
});

test.each([
  ["empty", "", "playerNameRequired"],
  ["blank", "    ", "playerNameRequired"],
  ["31 characters long", "a".repeat(31), "playerNameTooLong"],
])("a name that is %s is rejected with its key", async (_, playerName, errorKey) => {
  const game = await createCompletedGame();

  const result = await submitPlayerName(game.id, playerName);

  expect(result).toMatchObject({
    status: "error",
    error: { type: "schema", data: { fieldErrors: { playerName: [errorKey] } } },
  });
  await expect(findStoredGame(game.id)).resolves.toMatchObject({ playerName: null });
});

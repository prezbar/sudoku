import { expect, test } from "vitest";

import { completedGameOf } from "./completed-game";

const classicPuzzle = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const classicSolution = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

test("an unfinished game is not completed and does not reveal its solution", () => {
  expect(
    completedGameOf({ puzzle: classicPuzzle, completedAt: null, durationInSeconds: null, playerName: null }),
  ).toBeNull();
});

test("a completed game nobody named carries its solution and duration, and no player", () => {
  expect(
    completedGameOf({
      puzzle: classicPuzzle,
      completedAt: new Date("2026-10-21T10:12:34Z"),
      durationInSeconds: 754,
      playerName: null,
    }),
  ).toEqual({ solution: classicSolution, durationInSeconds: 754, playerName: null });
});

test("a named game carries its player", () => {
  expect(
    completedGameOf({
      puzzle: classicPuzzle,
      completedAt: new Date("2026-10-21T10:12:34Z"),
      durationInSeconds: 754,
      playerName: "Ada",
    }),
  ).toMatchObject({ playerName: "Ada" });
});

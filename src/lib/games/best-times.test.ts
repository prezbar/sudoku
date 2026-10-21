import { expect, test } from "vitest";

import { db } from "@/infra/prisma/db";
import { setupDatabase } from "@/tests/database";
import { gameFactory } from "@/tests/factories/game";

import { findBestTimes } from "./best-times";

setupDatabase(db);

test("best times list completed games from the fastest to the slowest", async () => {
  await gameFactory.completed().named().create({ playerName: "Slow", durationInSeconds: 900 });
  await gameFactory.completed().named().create({ playerName: "Fast", durationInSeconds: 300 });
  await gameFactory.completed().named().create({ playerName: "Middle", durationInSeconds: 600 });

  const bestTimes = await findBestTimes();

  expect(bestTimes.map(({ playerName, durationInSeconds }) => ({ playerName, durationInSeconds }))).toEqual([
    { playerName: "Fast", durationInSeconds: 300 },
    { playerName: "Middle", durationInSeconds: 600 },
    { playerName: "Slow", durationInSeconds: 900 },
  ]);
});

test.each([
  ["nobody finished", () => gameFactory.create()],
  ["nobody named", () => gameFactory.completed().create()],
])("best times leave out games %s", async (_, createLeftOutGame) => {
  await createLeftOutGame();
  const namedGame = await gameFactory.completed().named().create();

  const bestTimes = await findBestTimes();

  expect(bestTimes.map((bestTime) => bestTime.gameId)).toEqual([namedGame.id]);
});

test("best times keep only the ten fastest games", async () => {
  await gameFactory.completed().named().count(12).create();

  const bestTimes = await findBestTimes();

  expect(bestTimes).toHaveLength(10);
});

test("two equal times rank the earlier finish first", async () => {
  const laterGame = await gameFactory
    .completed()
    .named()
    .create({
      durationInSeconds: 120,
      completedAt: new Date("2026-10-21T12:00:00Z"),
    });
  const earlierGame = await gameFactory
    .completed()
    .named()
    .create({
      durationInSeconds: 120,
      completedAt: new Date("2026-10-21T11:00:00Z"),
    });

  const bestTimes = await findBestTimes();

  expect(bestTimes.map((bestTime) => bestTime.gameId)).toEqual([earlierGame.id, laterGame.id]);
});

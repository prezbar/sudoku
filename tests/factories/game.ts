import { generatePuzzle } from "@/lib/sudoku/generator";
import { serializeGrid } from "@/lib/sudoku/grid";
import { createMulberry32 } from "@/lib/sudoku/random";

import { prismaFactorio } from "./factorio";

const largestUnsignedInt32 = 2 ** 32 - 1;

export const gameFactory = prismaFactorio.define("game", {
  definition: ({ faker }) => ({
    puzzle: serializeGrid(generatePuzzle(createMulberry32(faker.number.int({ max: largestUnsignedInt32 }))).puzzle),
  }),
  states: {
    completed: ({ faker }) => {
      const startedAt = faker.date.recent({ days: 30 });
      const durationInSeconds = faker.number.int({ min: 60, max: 3600 });
      return {
        startedAt,
        completedAt: new Date(startedAt.getTime() + durationInSeconds * 1000),
        durationInSeconds,
      };
    },
    named: ({ faker }) => ({ playerName: faker.person.firstName() }),
  },
});

import { describe, expect, test } from "vitest";

import { generatePuzzle, generateSolution, targetGivenCountByDifficulty, type Difficulty } from "./generator";
import { createMulberry32 } from "./random";
import { countSolutions, solvePuzzle } from "./solver";
import { isSolutionOf, isValidSolution } from "./validation";

const seeds = Array.from({ length: 40 }, (_, seedIndex) => seedIndex + 1);
const difficulties: Difficulty[] = ["easy", "medium", "hard"];

test("a generated solution is a valid full grid", () => {
  for (const seed of seeds) {
    expect(isValidSolution(generateSolution(createMulberry32(seed)))).toBe(true);
  }
});

describe.each(difficulties.flatMap((difficulty) => [true, false].map((isSymmetric) => ({ difficulty, isSymmetric }))))(
  "$difficulty puzzles, symmetric: $isSymmetric",
  ({ difficulty, isSymmetric }) => {
    const generatedPuzzles = seeds.map((seed) => generatePuzzle(createMulberry32(seed), difficulty, isSymmetric));

    test("every solution is valid", () => {
      for (const { solution } of generatedPuzzles) expect(isValidSolution(solution)).toBe(true);
    });

    test("every puzzle has exactly one solution", () => {
      for (const { puzzle } of generatedPuzzles) expect(countSolutions(puzzle)).toBe(1);
    });

    test("the givens are a subset of the solution", () => {
      for (const { puzzle, solution } of generatedPuzzles) {
        expect(puzzle.every((value, cellIndex) => value === 0 || value === solution[cellIndex])).toBe(true);
      }
    });

    test("solving the puzzle finds the solution, and the solution solves the puzzle", () => {
      for (const { puzzle, solution } of generatedPuzzles) {
        expect(solvePuzzle(puzzle)).toEqual(solution);
        expect(isSolutionOf(puzzle, solution)).toBe(true);
      }
    });

    test("the puzzle keeps at least the target number of givens", () => {
      for (const { puzzle } of generatedPuzzles) {
        expect(puzzle.filter((value) => value !== 0).length).toBeGreaterThanOrEqual(
          targetGivenCountByDifficulty[difficulty],
        );
      }
    });

    if (isSymmetric) {
      test("every blank has a blank mirror through the center", () => {
        for (const { puzzle } of generatedPuzzles) {
          expect(puzzle.every((value, cellIndex) => (value === 0) === (puzzle[80 - cellIndex] === 0))).toBe(true);
        }
      });
    }
  },
);

test("a symmetric medium puzzle stops at its target of 32 givens, or at 33 when the center cell must stay", () => {
  for (const seed of seeds) {
    const { puzzle } = generatePuzzle(createMulberry32(seed), "medium");

    expect([32, 33]).toContain(puzzle.filter((value) => value !== 0).length);
  }
});

test("the same seed generates the same puzzle and solution", () => {
  expect(generatePuzzle(createMulberry32(42))).toEqual(generatePuzzle(createMulberry32(42)));
});

test("two seeds generate different puzzles", () => {
  expect(generatePuzzle(createMulberry32(1)).puzzle).not.toEqual(generatePuzzle(createMulberry32(2)).puzzle);
});

test("50 hard puzzles generate in under a second", () => {
  const startedAtInMilliseconds = performance.now();

  for (let seed = 1; seed <= 50; seed++) generatePuzzle(createMulberry32(seed), "hard");

  expect(performance.now() - startedAtInMilliseconds).toBeLessThan(1000);
});

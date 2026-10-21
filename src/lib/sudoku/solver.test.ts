import { expect, test } from "vitest";

import { createEmptyGrid, parseGrid } from "./grid";
import { countSolutions, solvePuzzle } from "./solver";

const seventeenCluePuzzle = parseGrid(
  "000000010400000000020000000000050407008000300001090000300400200050100000000806000",
);
const inkalaPuzzle = parseGrid("800000000003600000070090200050007000000045700000100030001000068008500010090000400");
const classicPuzzle = parseGrid("530070000600195000098000060800060003400803001700020006060000280000419005000080079");
const classicSolution = parseGrid("534678912672195348198342567859761423426853791713924856961537284287419635345286179");

test("a known 17-clue puzzle has exactly one solution", () => {
  expect(countSolutions(seventeenCluePuzzle)).toBe(1);
});

test("Arto Inkala's puzzle has exactly one solution", () => {
  expect(countSolutions(inkalaPuzzle)).toBe(1);
});

test("blanking a given of a minimal puzzle leaves more than one solution", () => {
  const puzzleMissingAGiven = seventeenCluePuzzle.slice();
  puzzleMissingAGiven[seventeenCluePuzzle.findIndex((value) => value !== 0)] = 0;

  expect(countSolutions(puzzleMissingAGiven)).toBe(2);
});

test("two conflicting givens leave no solution", () => {
  const conflictingPuzzle = createEmptyGrid();
  conflictingPuzzle[0] = 5;
  conflictingPuzzle[1] = 5;

  expect(countSolutions(conflictingPuzzle)).toBe(0);
});

test("counting the empty grid stops at the limit", () => {
  expect(countSolutions(createEmptyGrid())).toBe(2);
  expect(countSolutions(createEmptyGrid(), 5)).toBe(5);
});

test("counting leaves the puzzle it was given untouched", () => {
  const puzzle = classicPuzzle.slice();

  countSolutions(puzzle);

  expect(puzzle).toEqual(classicPuzzle);
});

test("solving returns the one solution of a puzzle", () => {
  expect(solvePuzzle(classicPuzzle)).toEqual(classicSolution);
});

test("solving leaves the puzzle it was given untouched", () => {
  const puzzle = classicPuzzle.slice();

  solvePuzzle(puzzle);

  expect(puzzle).toEqual(classicPuzzle);
});

test("solving a puzzle with no solution returns null", () => {
  const conflictingPuzzle = createEmptyGrid();
  conflictingPuzzle[0] = 5;
  conflictingPuzzle[80] = 5;
  conflictingPuzzle[8] = 5;

  expect(solvePuzzle(conflictingPuzzle)).toBeNull();
});

import { expect, test } from "vitest";

import { parseGrid } from "./grid";
import { conflictingCellIndexes, conflictingPeerIndexes, isSolutionOf, isValidSolution } from "./validation";

const classicPuzzle = parseGrid("530070000600195000098000060800060003400803001700020006060000280000419005000080079");
const classicSolution = parseGrid("534678912672195348198342567859761423426853791713924856961537284287419635345286179");

test("a peer holding the same digit conflicts", () => {
  const board = classicPuzzle.slice();

  expect(conflictingPeerIndexes(board, 2, 5)).toEqual([0]);
  expect(conflictingPeerIndexes(board, 2, 6)).toEqual(expect.arrayContaining([9]));
});

test("the right digit in an empty cell conflicts with no peer", () => {
  expect(conflictingPeerIndexes(classicPuzzle, 2, classicSolution[2])).toEqual([]);
});

test("an empty value conflicts with nothing", () => {
  expect(conflictingPeerIndexes(classicPuzzle, 2, 0)).toEqual([]);
});

test("conflicting cells on a board are both sides of every clash", () => {
  const board = classicPuzzle.slice();
  board[2] = 5;

  expect(conflictingCellIndexes(board)).toEqual(new Set([0, 2]));
});

test("a board without clashes has no conflicting cell", () => {
  expect(conflictingCellIndexes(classicPuzzle).size).toBe(0);
  expect(conflictingCellIndexes(classicSolution).size).toBe(0);
});

test("a full grid that follows the rules is a valid solution", () => {
  expect(isValidSolution(classicSolution)).toBe(true);
});

test.each([
  [
    "two swapped cells",
    () => {
      const grid = classicSolution.slice();
      [grid[0], grid[1]] = [grid[1], grid[0]];
      return grid;
    },
  ],
  [
    "one empty cell",
    () => {
      const grid = classicSolution.slice();
      grid[5] = 0;
      return grid;
    },
  ],
  ["every cell a 5", () => classicSolution.map(() => 5)],
  ["80 cells", () => classicSolution.slice(0, 80)],
  ["82 cells", () => [...classicSolution, 1]],
  [
    "a 10",
    () => {
      const grid = classicSolution.slice();
      grid[0] = 10;
      return grid;
    },
  ],
  [
    "a 1.5",
    () => {
      const grid = classicSolution.slice();
      grid[0] = 1.5;
      return grid;
    },
  ],
])("a grid with %s is not a valid solution", (_, buildGrid) => {
  expect(isValidSolution(buildGrid())).toBe(false);
});

test("the solution of a puzzle is a solution of it", () => {
  expect(isSolutionOf(classicPuzzle, classicSolution)).toBe(true);
});

test("a valid grid that changes a given is not a solution of the puzzle", () => {
  const relabeledSolution = classicSolution.map((value) => (value % 9) + 1);

  expect(isValidSolution(relabeledSolution)).toBe(true);
  expect(isSolutionOf(classicPuzzle, relabeledSolution)).toBe(false);
});

test("an incomplete board is not a solution of the puzzle", () => {
  expect(isSolutionOf(classicPuzzle, classicPuzzle)).toBe(false);
});

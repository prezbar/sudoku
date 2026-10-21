import { expect, test } from "vitest";

import {
  adjacentCellIndex,
  boxIndexOf,
  cellIndexAt,
  columnIndexOf,
  createEmptyGrid,
  parseGrid,
  peerIndexesByCellIndex,
  rowIndexOf,
  serializeGrid,
} from "./grid";

test("a cell index splits into its row and its column in row-major order", () => {
  expect([rowIndexOf(0), columnIndexOf(0)]).toEqual([0, 0]);
  expect([rowIndexOf(8), columnIndexOf(8)]).toEqual([0, 8]);
  expect([rowIndexOf(9), columnIndexOf(9)]).toEqual([1, 0]);
  expect([rowIndexOf(80), columnIndexOf(80)]).toEqual([8, 8]);
});

test("a row and a column give back the cell index they came from", () => {
  for (let cellIndex = 0; cellIndex < 81; cellIndex++) {
    expect(cellIndexAt(rowIndexOf(cellIndex), columnIndexOf(cellIndex))).toBe(cellIndex);
  }
});

test("the box of the cells the doc lists as off-by-one traps", () => {
  expect([0, 8, 26, 27, 40, 80].map(boxIndexOf)).toEqual([0, 2, 2, 3, 4, 8]);
});

test("every cell has 20 distinct peers, none of them itself", () => {
  peerIndexesByCellIndex.forEach((peerIndexes, cellIndex) => {
    expect(peerIndexes).toHaveLength(20);
    expect(new Set(peerIndexes).size).toBe(20);
    expect(peerIndexes).not.toContain(cellIndex);
  });
});

test("the peers of a cell share its row, its column or its box", () => {
  const peerIndexes = peerIndexesByCellIndex[40];

  expect(peerIndexes).toEqual(expect.arrayContaining([36, 44, 4, 76, 30, 50]));
  expect(peerIndexes).not.toContain(0);
});

test("an empty grid holds 81 zeros", () => {
  expect(createEmptyGrid()).toEqual(new Array(81).fill(0));
});

test("a grid round-trips through its 81-character serialization", () => {
  const serializedGrid = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

  const grid = parseGrid(serializedGrid);

  expect(grid.slice(0, 9)).toEqual([5, 3, 0, 0, 7, 0, 0, 0, 0]);
  expect(serializeGrid(grid)).toBe(serializedGrid);
});

test("parsing rejects a text that is not 81 digits", () => {
  expect(() => parseGrid("123")).toThrow();
  expect(() => parseGrid("x".repeat(81))).toThrow();
});

test("moving from a cell steps one row or one column in the direction asked", () => {
  expect(adjacentCellIndex(40, "up")).toBe(31);
  expect(adjacentCellIndex(40, "down")).toBe(49);
  expect(adjacentCellIndex(40, "left")).toBe(39);
  expect(adjacentCellIndex(40, "right")).toBe(41);
});

test("moving against an edge of the grid stays on the same cell", () => {
  expect(adjacentCellIndex(0, "up")).toBe(0);
  expect(adjacentCellIndex(0, "left")).toBe(0);
  expect(adjacentCellIndex(80, "down")).toBe(80);
  expect(adjacentCellIndex(80, "right")).toBe(80);
});

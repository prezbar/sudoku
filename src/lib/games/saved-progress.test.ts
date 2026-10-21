import { expect, test } from "vitest";

import { parseGrid } from "@/lib/sudoku/grid";

import {
  clearSavedProgress,
  hasSavedProgress,
  readSavedProgress,
  restoredBoardOf,
  saveProgress,
  type ProgressStorage,
} from "./saved-progress";

const classicPuzzle = parseGrid("530070000600195000098000060800060003400803001700020006060000280000419005000080079");
const boardWithOneEntry = parseGrid(
  "534070000600195000098000060800060003400803001700020006060000280000419005000080079",
);

function createProgressStorage() {
  const itemsByKey = new Map<string, string>();
  const progressStorage: ProgressStorage = {
    getItem: (key) => itemsByKey.get(key) ?? null,
    setItem: (key, value) => void itemsByKey.set(key, value),
    removeItem: (key) => void itemsByKey.delete(key),
  };
  return { itemsByKey, getProgressStorage: () => progressStorage };
}

const throwingProgressStorage: ProgressStorage = {
  getItem: () => {
    throw new Error("storage is blocked");
  },
  setItem: () => {
    throw new Error("storage is full");
  },
  removeItem: () => {
    throw new Error("storage is blocked");
  },
};

test("saved progress reads back as the board, for its game only", () => {
  const { getProgressStorage } = createProgressStorage();

  saveProgress("game-saved", classicPuzzle, boardWithOneEntry, getProgressStorage);

  expect(readSavedProgress("game-saved", getProgressStorage)).toBe(boardWithOneEntry.join(""));
  expect(hasSavedProgress("game-saved", getProgressStorage)).toBe(true);
  expect(readSavedProgress("another-game", getProgressStorage)).toBeNull();
});

test("progress stored by an earlier page load reads back", () => {
  const { itemsByKey, getProgressStorage } = createProgressStorage();
  saveProgress("game-reloaded", classicPuzzle, boardWithOneEntry, getProgressStorage);
  const [[storageKey, storedProgress]] = itemsByKey;
  clearSavedProgress("game-reloaded", getProgressStorage);

  itemsByKey.set(storageKey, storedProgress);

  expect(readSavedProgress("game-reloaded", getProgressStorage)).toBe(storedProgress);
});

test("a board without entries leaves no saved progress", () => {
  const { itemsByKey, getProgressStorage } = createProgressStorage();
  saveProgress("game-erased", classicPuzzle, boardWithOneEntry, getProgressStorage);

  saveProgress("game-erased", classicPuzzle, classicPuzzle, getProgressStorage);

  expect(hasSavedProgress("game-erased", getProgressStorage)).toBe(false);
  expect(itemsByKey.size).toBe(0);
});

test("cleared progress is gone", () => {
  const { itemsByKey, getProgressStorage } = createProgressStorage();
  saveProgress("game-cleared", classicPuzzle, boardWithOneEntry, getProgressStorage);

  clearSavedProgress("game-cleared", getProgressStorage);

  expect(readSavedProgress("game-cleared", getProgressStorage)).toBeNull();
  expect(itemsByKey.size).toBe(0);
});

test.each([
  ["80 digits", "0".repeat(80)],
  ["a letter", `x${"0".repeat(80)}`],
  ["JSON", '{"board":[]}'],
])("stored progress made of %s reads as none", (_, storedProgress) => {
  const { itemsByKey, getProgressStorage } = createProgressStorage();
  saveProgress("game-malformed", classicPuzzle, boardWithOneEntry, getProgressStorage);
  const [[storageKey]] = itemsByKey;
  clearSavedProgress("game-malformed", getProgressStorage);
  itemsByKey.set(storageKey, storedProgress);

  expect(readSavedProgress("game-malformed", getProgressStorage)).toBeNull();
});

test("a storage that throws reads as no progress, and still keeps progress for the page's lifetime", () => {
  const getThrowingProgressStorage = () => throwingProgressStorage;

  expect(readSavedProgress("game-blocked", getThrowingProgressStorage)).toBeNull();
  saveProgress("game-blocked", classicPuzzle, boardWithOneEntry, getThrowingProgressStorage);
  expect(readSavedProgress("game-blocked", getThrowingProgressStorage)).toBe(boardWithOneEntry.join(""));
  clearSavedProgress("game-blocked", getThrowingProgressStorage);
  expect(hasSavedProgress("game-blocked", getThrowingProgressStorage)).toBe(false);
});

test("a browser storage that cannot be reached reads as no progress", () => {
  expect(readSavedProgress("game-without-window")).toBeNull();
});

test("a restored board keeps the saved entries and the givens", () => {
  const savedProgress = `9${boardWithOneEntry.join("").slice(1)}`;

  const restoredBoard = restoredBoardOf(classicPuzzle, savedProgress);

  expect(restoredBoard[0]).toBe(5);
  expect(restoredBoard[2]).toBe(4);
  expect(restoredBoard.slice(3)).toEqual(classicPuzzle.slice(3));
});

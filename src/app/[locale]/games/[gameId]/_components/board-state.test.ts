import { expect, test } from "vitest";

import { parseGrid } from "@/lib/sudoku/grid";

import {
  boardActionForKeyPress,
  createBoardState,
  isBoardSolved,
  nextBoardState,
  type BoardAction,
} from "./board-state";

const classicPuzzle = parseGrid("530070000600195000098000060800060003400803001700020006060000280000419005000080079");
const classicSolution = parseGrid("534678912672195348198342567859761423426853791713924856961537284287419635345286179");

test("a new board shows the givens and selects no cell", () => {
  const boardState = createBoardState(classicPuzzle);

  expect(boardState.board).toEqual(classicPuzzle);
  expect(boardState.selectedCellIndex).toBeNull();
});

test("entering a digit fills the selected empty cell", () => {
  const selectedState = nextBoardState(createBoardState(classicPuzzle), { type: "selectCell", cellIndex: 2 });

  const filledState = nextBoardState(selectedState, { type: "enterValue", value: 4 });

  expect(filledState.board[2]).toBe(4);
  expect(filledState.selectedCellIndex).toBe(2);
});

test("entering a digit leaves the previous board untouched", () => {
  const selectedState = nextBoardState(createBoardState(classicPuzzle), { type: "selectCell", cellIndex: 2 });

  nextBoardState(selectedState, { type: "enterValue", value: 4 });

  expect(selectedState.board[2]).toBe(0);
});

test("entering the empty value clears the selected cell", () => {
  const boardActions: BoardAction[] = [
    { type: "selectCell", cellIndex: 2 },
    { type: "enterValue", value: 4 },
    { type: "enterValue", value: 0 },
  ];

  const filledState = boardActions.reduce(nextBoardState, createBoardState(classicPuzzle));

  expect(filledState.board[2]).toBe(0);
});

test("a given cannot be overwritten nor cleared", () => {
  const selectedGivenState = nextBoardState(createBoardState(classicPuzzle), { type: "selectCell", cellIndex: 0 });

  expect(nextBoardState(selectedGivenState, { type: "enterValue", value: 1 }).board[0]).toBe(5);
  expect(nextBoardState(selectedGivenState, { type: "enterValue", value: 0 }).board[0]).toBe(5);
});

test("entering a digit with no cell selected changes nothing", () => {
  const boardState = createBoardState(classicPuzzle);

  expect(nextBoardState(boardState, { type: "enterValue", value: 4 })).toBe(boardState);
});

test("moving the selection with no cell selected selects the first cell", () => {
  expect(nextBoardState(createBoardState(classicPuzzle), { type: "moveSelection", direction: "right" })).toMatchObject({
    selectedCellIndex: 0,
  });
});

test("moving the selection steps to the adjacent cell", () => {
  const selectedState = nextBoardState(createBoardState(classicPuzzle), { type: "selectCell", cellIndex: 40 });

  expect(nextBoardState(selectedState, { type: "moveSelection", direction: "down" }).selectedCellIndex).toBe(49);
});

test("a board matching the solution is solved", () => {
  const solvedState = { ...createBoardState(classicPuzzle), board: classicSolution };

  expect(isBoardSolved(solvedState)).toBe(true);
  expect(isBoardSolved(createBoardState(classicPuzzle))).toBe(false);
});

test("filling the last empty cell correctly solves the board", () => {
  const almostSolvedBoard = classicSolution.slice();
  almostSolvedBoard[2] = 0;
  const almostSolvedState = { board: almostSolvedBoard, puzzle: classicPuzzle, selectedCellIndex: 2 };

  const solvedState = nextBoardState(almostSolvedState, { type: "enterValue", value: classicSolution[2] });

  expect(isBoardSolved(solvedState)).toBe(true);
});

test("a full board that breaks the rules is not solved", () => {
  const brokenBoard = classicSolution.slice();
  brokenBoard[2] = (brokenBoard[2] % 9) + 1;

  expect(isBoardSolved({ ...createBoardState(classicPuzzle), board: brokenBoard })).toBe(false);
});

test("a solved board is locked", () => {
  const solvedState = { board: classicSolution, puzzle: classicPuzzle, selectedCellIndex: 2 };

  expect(nextBoardState(solvedState, { type: "enterValue", value: 0 })).toBe(solvedState);
});

const noModifiers = { altKey: false, ctrlKey: false, metaKey: false };

test.each([
  ["1", "Digit1", { type: "enterValue", value: 1 }],
  ["9", "Digit9", { type: "enterValue", value: 9 }],
  ["0", "Digit0", { type: "enterValue", value: 0 }],
  ["Backspace", "Backspace", { type: "enterValue", value: 0 }],
  ["Delete", "Delete", { type: "enterValue", value: 0 }],
  ["ArrowUp", "ArrowUp", { type: "moveSelection", direction: "up" }],
  ["ArrowDown", "ArrowDown", { type: "moveSelection", direction: "down" }],
  ["ArrowLeft", "ArrowLeft", { type: "moveSelection", direction: "left" }],
  ["ArrowRight", "ArrowRight", { type: "moveSelection", direction: "right" }],
])("the %s key maps to its board action", (key, code, boardAction) => {
  expect(boardActionForKeyPress({ key, code, ...noModifiers })).toEqual(boardAction);
});

test.each([
  ["&", "Digit1", 1],
  ["é", "Digit2", 2],
  ["ç", "Digit9", 9],
  ["à", "Digit0", 0],
  ["1", "Numpad1", 1],
  ["9", "Numpad9", 9],
  ["0", "Numpad0", 0],
])("the %j key on the %s physical key maps to entering %i", (key, code, value) => {
  expect(boardActionForKeyPress({ key, code, ...noModifiers })).toEqual({ type: "enterValue", value });
});

test("a numpad key that the keyboard sends as an arrow moves the selection", () => {
  expect(boardActionForKeyPress({ key: "ArrowUp", code: "Numpad8", ...noModifiers })).toEqual({
    type: "moveSelection",
    direction: "up",
  });
});

test.each([
  ["a", "KeyA"],
  ["Enter", "Enter"],
  ["Tab", "Tab"],
  [" ", "Space"],
  ["10", ""],
  ["-", "Minus"],
])("the %j key maps to no board action", (key, code) => {
  expect(boardActionForKeyPress({ key, code, ...noModifiers })).toBeNull();
});

test.each([
  ["Control", { ctrlKey: true }],
  ["Meta", { metaKey: true }],
  ["Alt", { altKey: true }],
])("a digit pressed with %s held is left to the browser", (_, modifiers) => {
  expect(boardActionForKeyPress({ key: "1", code: "Digit1", ...noModifiers, ...modifiers })).toBeNull();
});

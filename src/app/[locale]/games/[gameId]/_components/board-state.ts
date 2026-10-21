import {
  adjacentCellIndex,
  emptyCellValue,
  serializeGrid,
  type CellIndex,
  type CellValue,
  type Grid,
  type MoveDirection,
  type SerializedGrid,
} from "@/lib/sudoku/grid";
import { isSolutionOf } from "@/lib/sudoku/validation";

export type BoardState = { puzzle: Grid; board: Grid; selectedCellIndex: CellIndex | null };

export type BoardAction =
  | { type: "selectCell"; cellIndex: CellIndex }
  | { type: "enterValue"; value: CellValue }
  | { type: "moveSelection"; direction: MoveDirection };

export function createBoardState(puzzle: Grid): BoardState {
  return { puzzle, board: puzzle.slice(), selectedCellIndex: null };
}

export function isBoardSolved(boardState: BoardState): boolean {
  return isSolutionOf(boardState.puzzle, boardState.board);
}

export function solutionOf(boardState: BoardState): SerializedGrid | null {
  return isBoardSolved(boardState) ? serializeGrid(boardState.board) : null;
}

export function nextBoardState(boardState: BoardState, boardAction: BoardAction): BoardState {
  switch (boardAction.type) {
    case "selectCell":
      return { ...boardState, selectedCellIndex: boardAction.cellIndex };
    case "moveSelection":
      return {
        ...boardState,
        selectedCellIndex:
          boardState.selectedCellIndex === null
            ? 0
            : adjacentCellIndex(boardState.selectedCellIndex, boardAction.direction),
      };
    case "enterValue": {
      const { selectedCellIndex } = boardState;
      const isSelectedCellEditable =
        selectedCellIndex !== null && boardState.puzzle[selectedCellIndex] === emptyCellValue;
      if (!isSelectedCellEditable || isBoardSolved(boardState)) return boardState;
      const board = boardState.board.slice();
      board[selectedCellIndex] = boardAction.value;
      return { ...boardState, board };
    }
  }
}

const moveDirectionByArrowKey = new Map<string, MoveDirection>([
  ["ArrowUp", "up"],
  ["ArrowDown", "down"],
  ["ArrowLeft", "left"],
  ["ArrowRight", "right"],
]);
const clearingKeys = new Set(["Backspace", "Delete", "0"]);
const digitKeyPattern = /^[1-9]$/;
const digitKeyCodePattern = /^(?:Digit|Numpad)([0-9])$/;

export type KeyPress = Pick<KeyboardEvent, "key" | "code" | "altKey" | "ctrlKey" | "metaKey">;

export function boardActionForKeyPress(keyPress: KeyPress): BoardAction | null {
  if (keyPress.altKey || keyPress.ctrlKey || keyPress.metaKey) return null;
  const digitOfKeyCode = digitKeyCodePattern.exec(keyPress.code)?.[1];
  if (digitOfKeyCode !== undefined) return { type: "enterValue", value: Number(digitOfKeyCode) };
  const { key } = keyPress;
  if (digitKeyPattern.test(key)) return { type: "enterValue", value: Number(key) };
  if (clearingKeys.has(key)) return { type: "enterValue", value: emptyCellValue };
  const direction = moveDirectionByArrowKey.get(key);
  return direction ? { type: "moveSelection", direction } : null;
}

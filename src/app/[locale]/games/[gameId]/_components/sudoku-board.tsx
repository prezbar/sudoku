"use client";

import { useTranslations } from "next-intl";
import type { KeyboardEvent } from "react";

import {
  boxIndexOf,
  cellIndexAt,
  columnIndexOf,
  emptyCellValue,
  gridSideLength,
  rowIndexOf,
  type CellIndex,
} from "@/lib/sudoku/grid";
import { cn } from "@/lib/utils";

import type { BoardState } from "./board-state";

type SudokuBoardProps = {
  boardState: BoardState;
  conflictingCellIndexes: Set<CellIndex>;
  isSolved: boolean;
  onCellFocus: (cellIndex: CellIndex) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  registerCellElement: (cellIndex: CellIndex, cellElement: HTMLDivElement | null) => void;
};

const lineIndexes = [...Array(gridSideLength).keys()];

function isPeerOfSelection(cellIndex: CellIndex, selectedCellIndex: CellIndex | null) {
  if (selectedCellIndex === null || cellIndex === selectedCellIndex) return false;
  return (
    rowIndexOf(cellIndex) === rowIndexOf(selectedCellIndex) ||
    columnIndexOf(cellIndex) === columnIndexOf(selectedCellIndex) ||
    boxIndexOf(cellIndex) === boxIndexOf(selectedCellIndex)
  );
}

export function SudokuBoard({
  boardState,
  conflictingCellIndexes,
  isSolved,
  onCellFocus,
  onKeyDown,
  registerCellElement,
}: SudokuBoardProps) {
  const t = useTranslations("SudokuBoard");
  const { puzzle, board, selectedCellIndex } = boardState;
  const selectedValue = selectedCellIndex === null ? emptyCellValue : board[selectedCellIndex];
  const focusableCellIndex = selectedCellIndex ?? 0;

  return (
    <div
      role="grid"
      aria-label={t("label")}
      aria-readonly={isSolved}
      onKeyDown={onKeyDown}
      className="grid aspect-square w-full grid-cols-9 overflow-hidden rounded-xl border-2 border-foreground/80 bg-card shadow-sm select-none"
    >
      {lineIndexes.map((rowIndex) => (
        <div role="row" key={rowIndex} className="contents">
          {lineIndexes.map((columnIndex) => {
            const cellIndex = cellIndexAt(rowIndex, columnIndex);
            const value = board[cellIndex];
            const isGiven = puzzle[cellIndex] !== emptyCellValue;
            const isSelected = cellIndex === selectedCellIndex;
            const isConflicting = conflictingCellIndexes.has(cellIndex);
            const isSameValueAsSelection = value !== emptyCellValue && value === selectedValue && !isSelected;
            const cellState =
              value === emptyCellValue ? "empty" : isGiven ? "given" : isConflicting ? "conflicting" : "filled";

            return (
              <div
                role="gridcell"
                key={columnIndex}
                ref={(cellElement) => registerCellElement(cellIndex, cellElement)}
                tabIndex={cellIndex === focusableCellIndex ? 0 : -1}
                aria-selected={isSelected}
                aria-readonly={isGiven || isSolved}
                aria-invalid={isConflicting}
                aria-label={t("cell", { row: rowIndex + 1, column: columnIndex + 1, value, state: cellState })}
                onFocus={() => onCellFocus(cellIndex)}
                className={cn(
                  "flex cursor-pointer items-center justify-center border-border text-xl transition-colors outline-none sm:text-2xl",
                  "focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-sky-500/60 focus-visible:ring-inset",
                  columnIndex < gridSideLength - 1 &&
                    (columnIndex % 3 === 2 ? "border-r-2 border-r-foreground/70" : "border-r"),
                  rowIndex < gridSideLength - 1 &&
                    (rowIndex % 3 === 2 ? "border-b-2 border-b-foreground/70" : "border-b"),
                  isGiven ? "font-semibold text-foreground" : "font-medium text-sky-700 dark:text-sky-300",
                  isPeerOfSelection(cellIndex, selectedCellIndex) && "bg-muted",
                  isSameValueAsSelection && "bg-sky-100 dark:bg-sky-900/50",
                  isSelected && "bg-sky-200 dark:bg-sky-800/70",
                  isConflicting && "bg-destructive/10 text-destructive dark:text-destructive",
                  isSolved && "cursor-default bg-emerald-50 dark:bg-emerald-950/40",
                )}
              >
                {value === emptyCellValue ? "" : value}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

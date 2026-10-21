"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, type KeyboardEvent } from "react";

import { NewGameButton } from "@/components/games/new-game-button";
import { durationInSecondsBetween, formatDuration, type DurationInSeconds } from "@/lib/games/duration";
import { parseGrid, serializeGrid, type CellIndex, type CellValue, type SerializedGrid } from "@/lib/sudoku/grid";
import { conflictingCellIndexes } from "@/lib/sudoku/validation";

import {
  boardActionForKeyPress,
  createBoardState,
  isBoardSolved,
  nextBoardState,
  type BoardAction,
} from "./board-state";
import { CompletionForm } from "./completion-form";
import { NumberPad } from "./number-pad";
import { SudokuBoard } from "./sudoku-board";

export type SavedResult = { playerName: string; durationInSeconds: DurationInSeconds; solution: SerializedGrid };

type SudokuGameProps = { gameId: string; puzzle: SerializedGrid; startedAt: string; savedResult: SavedResult | null };

function initialBoardState(puzzle: SerializedGrid, savedResult: SavedResult | null) {
  const boardState = createBoardState(parseGrid(puzzle));
  return savedResult ? { ...boardState, board: parseGrid(savedResult.solution) } : boardState;
}

export function SudokuGame({ gameId, puzzle, startedAt, savedResult }: SudokuGameProps) {
  const t = useTranslations("SudokuGame");
  const [boardState, setBoardState] = useState(() => initialBoardState(puzzle, savedResult));
  const [solvedInSeconds, setSolvedInSeconds] = useState<DurationInSeconds | null>(null);
  const cellElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isSolved = isBoardSolved(boardState);

  function applyBoardAction(boardAction: BoardAction) {
    const updatedBoardState = nextBoardState(boardState, boardAction);
    if (updatedBoardState === boardState) return updatedBoardState;
    setBoardState(updatedBoardState);
    if (!isSolved && isBoardSolved(updatedBoardState)) {
      setSolvedInSeconds(durationInSecondsBetween(new Date(startedAt), new Date()));
    }
    return updatedBoardState;
  }

  function focusCell(cellIndex: CellIndex | null) {
    if (cellIndex !== null) cellElementsRef.current[cellIndex]?.focus();
  }

  function handleBoardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const boardAction = boardActionForKeyPress(event);
    if (!boardAction) return;
    event.preventDefault();
    const updatedBoardState = applyBoardAction(boardAction);
    if (boardAction.type === "moveSelection") focusCell(updatedBoardState.selectedCellIndex);
  }

  function handleCellFocus(cellIndex: CellIndex) {
    if (cellIndex !== boardState.selectedCellIndex) applyBoardAction({ type: "selectCell", cellIndex });
  }

  function handlePadValue(value: CellValue) {
    applyBoardAction({ type: "enterValue", value });
    focusCell(boardState.selectedCellIndex);
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <SudokuBoard
        boardState={boardState}
        conflictingCellIndexes={conflictingCellIndexes(boardState.board)}
        isSolved={isSolved}
        onCellFocus={handleCellFocus}
        onKeyDown={handleBoardKeyDown}
        registerCellElement={(cellIndex, cellElement) => {
          cellElementsRef.current[cellIndex] = cellElement;
        }}
      />
      {isSolved ? (
        <section
          aria-live="polite"
          className="w-full rounded-xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/40"
        >
          <h2 className="text-lg font-semibold tracking-tight">{t("solvedTitle")}</h2>
          {savedResult ? (
            <div className="mt-1 flex flex-col items-start gap-3">
              <p role="status" className="text-sm">
                {t("savedResult", {
                  playerName: savedResult.playerName,
                  duration: formatDuration(savedResult.durationInSeconds),
                })}
              </p>
              <NewGameButton />
            </div>
          ) : (
            <>
              {solvedInSeconds !== null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("solvedIn", { duration: formatDuration(solvedInSeconds) })}
                </p>
              )}
              <CompletionForm gameId={gameId} solvedGrid={serializeGrid(boardState.board)} />
            </>
          )}
        </section>
      ) : (
        <>
          <NumberPad isDisabled={isSolved} onEnterValue={handlePadValue} />
          <p className="text-center text-sm text-muted-foreground">{t("instructions")}</p>
        </>
      )}
    </div>
  );
}

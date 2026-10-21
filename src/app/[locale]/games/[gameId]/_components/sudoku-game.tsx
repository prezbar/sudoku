"use client";

import { useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";

import { NewGameButton } from "@/components/games/new-game-button";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/games/duration";
import { clearSavedProgress, readSavedProgress, restoredBoardOf, saveProgress } from "@/lib/games/saved-progress";
import { parseGrid, type CellIndex, type CellValue, type SerializedGrid } from "@/lib/sudoku/grid";
import { conflictingCellIndexes } from "@/lib/sudoku/validation";

import { completeGame } from "../actions";
import type { CompletedGame } from "../completed-game";
import { boardActionForKeyPress, createBoardState, nextBoardState, solutionOf, type BoardAction } from "./board-state";
import { completionStateOf, type CompletionState } from "./completion-state";
import { NumberPad } from "./number-pad";
import { PlayerNameForm } from "./player-name-form";
import { SudokuBoard } from "./sudoku-board";

type SudokuGameProps = { gameId: string; puzzle: SerializedGrid; completedGame: CompletedGame | null };

function initialBoardState(
  puzzle: SerializedGrid,
  completedGame: CompletedGame | null,
  savedProgress: SerializedGrid | null,
) {
  const boardState = createBoardState(parseGrid(puzzle));
  if (completedGame) return { ...boardState, board: parseGrid(completedGame.solution) };
  if (savedProgress) return { ...boardState, board: restoredBoardOf(boardState.puzzle, savedProgress) };
  return boardState;
}

const subscribeToNoChange = () => () => {};

export function SudokuGame(sudokuGameProps: SudokuGameProps) {
  const savedProgress = useSyncExternalStore(
    subscribeToNoChange,
    () => readSavedProgress(sudokuGameProps.gameId),
    () => undefined,
  );
  const isInBrowser = savedProgress !== undefined;

  return (
    <SudokuGameFromProgress
      key={isInBrowser ? "browser" : "server"}
      {...sudokuGameProps}
      savedProgress={savedProgress ?? null}
    />
  );
}

function SudokuGameFromProgress({
  gameId,
  puzzle,
  completedGame,
  savedProgress,
}: SudokuGameProps & { savedProgress: SerializedGrid | null }) {
  const t = useTranslations("SudokuGame");
  const [boardState, setBoardState] = useState(() => initialBoardState(puzzle, completedGame, savedProgress));
  const [savedPlayerName, setSavedPlayerName] = useState<string | null>(null);
  const [completionState, dispatchCompletion, isCompleting] = useActionState(
    async (_previousCompletionState: CompletionState, solution: SerializedGrid): Promise<CompletionState> => {
      try {
        const completionState = completionStateOf(await completeGame({ gameId, solution }));
        if (completionState.status === "completed") clearSavedProgress(gameId);
        return completionState;
      } catch {
        return { status: "failed", errorKey: "unexpected" };
      }
    },
    { status: "pending" },
  );
  const cellElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const solution = solutionOf(boardState);
  const isSolved = solution !== null;
  const isCompletionNeeded = isSolved && completedGame === null;

  useEffect(() => {
    if (completedGame !== null) clearSavedProgress(gameId);
  }, [completedGame, gameId]);

  useEffect(() => {
    if (!isCompletionNeeded) return;
    startTransition(() => dispatchCompletion(solution));
  }, [isCompletionNeeded, solution, dispatchCompletion]);

  const durationInSeconds =
    completedGame?.durationInSeconds ??
    (completionState.status === "completed" ? completionState.durationInSeconds : null);
  const playerName = completedGame?.playerName ?? savedPlayerName;

  function applyBoardAction(boardAction: BoardAction) {
    const updatedBoardState = nextBoardState(boardState, boardAction);
    if (updatedBoardState === boardState) return boardState;
    setBoardState(updatedBoardState);
    if (updatedBoardState.board !== boardState.board) {
      saveProgress(gameId, updatedBoardState.puzzle, updatedBoardState.board);
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

  function retryCompletion() {
    if (solution !== null) startTransition(() => dispatchCompletion(solution));
  }

  function renderCompletion() {
    if (durationInSeconds !== null && playerName !== null) {
      return (
        <div className="mt-1 flex flex-col items-start gap-3">
          <p role="status" className="text-sm">
            {t("savedResult", { playerName, duration: formatDuration(durationInSeconds) })}
          </p>
          <NewGameButton />
        </div>
      );
    }
    if (durationInSeconds !== null) {
      return (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("solvedIn", { duration: formatDuration(durationInSeconds) })}
          </p>
          <PlayerNameForm gameId={gameId} onPlayerNameSave={setSavedPlayerName} />
        </>
      );
    }
    if (completionState.status === "failed" && !isCompleting) {
      return (
        <div className="mt-1 flex flex-col items-start gap-3">
          <p role="alert" className="text-sm text-destructive">
            {t(`completionErrors.${completionState.errorKey}`)}
          </p>
          {completionState.errorKey === "unexpected" ? (
            <Button variant="outline" size="lg" onClick={retryCompletion} className="px-4">
              {t("retryCompletion")}
            </Button>
          ) : (
            <NewGameButton variant="outline" />
          )}
        </div>
      );
    }
    return <p className="mt-1 text-sm text-muted-foreground">{t("completing")}</p>;
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
          {renderCompletion()}
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

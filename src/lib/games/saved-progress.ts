import { emptyCellValue, serializeGrid, type Grid, type SerializedGrid } from "@/lib/sudoku/grid";

export type ProgressStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const browserProgressStorage = (): ProgressStorage => window.localStorage;
const savedProgressByGameId = new Map<string, SerializedGrid>();
const savedProgressPattern = /^[0-9]{81}$/;

const storageKeyOf = (gameId: string) => `sudoku.progress.${gameId}`;

function attemptStorageAccess<T>(storageAccess: () => T): T | null {
  try {
    return storageAccess();
  } catch {
    return null;
  }
}

const hasEntries = (puzzle: Grid, board: Grid) =>
  board.some((value, cellIndex) => puzzle[cellIndex] === emptyCellValue && value !== emptyCellValue);

export function readSavedProgress(gameId: string, getProgressStorage = browserProgressStorage): SerializedGrid | null {
  const savedProgress =
    savedProgressByGameId.get(gameId) ?? attemptStorageAccess(() => getProgressStorage().getItem(storageKeyOf(gameId)));
  return savedProgress !== null && savedProgressPattern.test(savedProgress) ? savedProgress : null;
}

export function hasSavedProgress(gameId: string, getProgressStorage = browserProgressStorage): boolean {
  return readSavedProgress(gameId, getProgressStorage) !== null;
}

export function clearSavedProgress(gameId: string, getProgressStorage = browserProgressStorage): void {
  savedProgressByGameId.delete(gameId);
  attemptStorageAccess(() => getProgressStorage().removeItem(storageKeyOf(gameId)));
}

export function saveProgress(
  gameId: string,
  puzzle: Grid,
  board: Grid,
  getProgressStorage = browserProgressStorage,
): void {
  if (!hasEntries(puzzle, board)) return clearSavedProgress(gameId, getProgressStorage);
  const savedProgress = serializeGrid(board);
  savedProgressByGameId.set(gameId, savedProgress);
  attemptStorageAccess(() => getProgressStorage().setItem(storageKeyOf(gameId), savedProgress));
}

export function restoredBoardOf(puzzle: Grid, savedProgress: SerializedGrid): Grid {
  return puzzle.map((given, cellIndex) => (given === emptyCellValue ? Number(savedProgress[cellIndex]) : given));
}

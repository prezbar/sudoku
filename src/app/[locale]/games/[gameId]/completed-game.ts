import type { Game } from "@/generated/prisma/client";
import type { DurationInSeconds } from "@/lib/games/duration";
import { parseGrid, serializeGrid, type SerializedGrid } from "@/lib/sudoku/grid";
import { solvePuzzle } from "@/lib/sudoku/solver";

export type CompletedGame = {
  solution: SerializedGrid;
  durationInSeconds: DurationInSeconds;
  playerName: string | null;
};

export function completedGameOf(
  game: Pick<Game, "puzzle" | "completedAt" | "durationInSeconds" | "playerName">,
): CompletedGame | null {
  if (game.completedAt === null || game.durationInSeconds === null) return null;
  const solution = solvePuzzle(parseGrid(game.puzzle));
  if (!solution) return null;
  return { solution: serializeGrid(solution), durationInSeconds: game.durationInSeconds, playerName: game.playerName };
}

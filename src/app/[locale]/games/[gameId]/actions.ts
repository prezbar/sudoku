"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { formActionPipe } from "@flefebvre/next-pipe/pipes";
import { error, success } from "@flefebvre/next-pipe/server";

import { db } from "@/infra/prisma/db";
import { durationInSecondsBetween } from "@/lib/games/duration";
import { playerNameSchema } from "@/lib/games/player-name";
import { parseGrid } from "@/lib/sudoku/grid";
import { isSolutionOf } from "@/lib/sudoku/validation";

const completeGameSchema = z.object({
  gameId: z.string().min(1),
  grid: z.string().regex(/^[1-9]{81}$/, { error: "invalidGrid" }),
  playerName: playerNameSchema,
});

export const completeGame = formActionPipe(completeGameSchema).handle(async ({ input }) => {
  const game = await db.game.findUnique({ where: { id: input.gameId } });
  if (!game) return error("gameNotFound", null);
  if (game.completedAt) return error("gameAlreadyCompleted", null);
  if (!isSolutionOf(parseGrid(game.puzzle), parseGrid(input.grid))) return error("gridNotSolved", null);

  const completedAt = new Date();
  const durationInSeconds = durationInSecondsBetween(game.startedAt, completedAt);
  const { count: completedGameCount } = await db.game.updateMany({
    where: { id: game.id, completedAt: null },
    data: { completedAt, durationInSeconds, playerName: input.playerName },
  });
  if (completedGameCount === 0) return error("gameAlreadyCompleted", null);

  refresh();
  return success({ durationInSeconds });
});

"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { actionPipe, formActionPipe } from "@flefebvre/next-pipe/pipes";
import { error, success } from "@flefebvre/next-pipe/server";

import { db } from "@/infra/prisma/db";
import { durationInSecondsBetween } from "@/lib/games/duration";
import { playerNameSchema } from "@/lib/games/player-name";
import { parseGrid } from "@/lib/sudoku/grid";
import { isSolutionOf } from "@/lib/sudoku/validation";

const completeGameSchema = z.object({
  gameId: z.string().min(1),
  solution: z.string().regex(/^[1-9]{81}$/, { error: "invalidSolution" }),
});

export const completeGame = actionPipe(completeGameSchema).handle(async ({ input }) => {
  const game = await db.game.findUnique({ where: { id: input.gameId } });
  if (!game) return error("gameNotFound", null);
  if (!isSolutionOf(parseGrid(game.puzzle), parseGrid(input.solution))) return error("gridNotSolved", null);
  if (game.completedAt !== null && game.durationInSeconds !== null) {
    return success({ durationInSeconds: game.durationInSeconds });
  }

  const completedAt = new Date();
  const durationInSeconds = durationInSecondsBetween(game.startedAt, completedAt);
  const { count: completedGameCount } = await db.game.updateMany({
    where: { id: game.id, completedAt: null },
    data: { completedAt, durationInSeconds },
  });
  if (completedGameCount === 1) return success({ durationInSeconds });

  const gameCompletedFirst = await db.game.findUnique({ where: { id: game.id } });
  const durationInSecondsSavedFirst = gameCompletedFirst?.durationInSeconds ?? null;
  if (durationInSecondsSavedFirst === null) return error("gameNotFound", null);
  return success({ durationInSeconds: durationInSecondsSavedFirst });
});

const savePlayerNameSchema = z.object({
  gameId: z.string().min(1),
  playerName: playerNameSchema,
});

export const savePlayerName = formActionPipe(savePlayerNameSchema).handle(async ({ input }) => {
  const game = await db.game.findUnique({ where: { id: input.gameId } });
  if (!game) return error("gameNotFound", null);
  if (game.completedAt === null) return error("gameNotCompleted", null);

  const { count: namedGameCount } = await db.game.updateMany({
    where: { id: game.id, completedAt: { not: null }, playerName: null },
    data: { playerName: input.playerName },
  });
  if (namedGameCount === 0) return error("playerNameAlreadySaved", null);

  refresh();
  return success({ playerName: input.playerName });
});

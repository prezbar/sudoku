import "server-only";

import { db } from "@/infra/prisma/db";

import type { DurationInSeconds } from "./duration";

export type BestTime = { gameId: string; playerName: string; durationInSeconds: DurationInSeconds };

const bestTimeCount = 10;

export async function findBestTimes(): Promise<BestTime[]> {
  const completedGames = await db.game.findMany({
    where: { completedAt: { not: null }, playerName: { not: null }, durationInSeconds: { not: null } },
    orderBy: [{ durationInSeconds: "asc" }, { completedAt: "asc" }],
    take: bestTimeCount,
    select: { id: true, playerName: true, durationInSeconds: true },
  });
  return completedGames.flatMap(({ id, playerName, durationInSeconds }) =>
    playerName === null || durationInSeconds === null ? [] : [{ gameId: id, playerName, durationInSeconds }],
  );
}

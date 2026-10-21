import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { findBestTimes } from "@/lib/games/best-times";
import { formatDuration } from "@/lib/games/duration";

async function BestTimesList() {
  await connection();
  const [t, bestTimes] = await Promise.all([getTranslations("BestTimes"), findBestTimes()]);

  if (bestTimes.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;

  return (
    <ol className="divide-y divide-border">
      {bestTimes.map((bestTime, rankIndex) => (
        <li key={bestTime.gameId} className="flex items-baseline gap-3 py-2 text-sm">
          <span className="w-5 text-right font-mono text-muted-foreground tabular-nums">{rankIndex + 1}</span>
          <span className="min-w-0 flex-1 truncate">{bestTime.playerName}</span>
          <span className="font-mono tabular-nums">{formatDuration(bestTime.durationInSeconds)}</span>
        </li>
      ))}
    </ol>
  );
}

export async function BestTimes() {
  const t = await getTranslations("BestTimes");

  return (
    <section aria-labelledby="best-times-title" className="w-full rounded-xl border bg-card p-5 shadow-xs">
      <h2 id="best-times-title" className="mb-3 text-base font-semibold tracking-tight">
        {t("title")}
      </h2>
      <Suspense fallback={<p className="text-sm text-muted-foreground">{t("loading")}</p>}>
        <BestTimesList />
      </Suspense>
    </section>
  );
}

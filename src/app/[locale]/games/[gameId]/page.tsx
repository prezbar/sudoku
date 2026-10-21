import { getTranslations } from "next-intl/server";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { pagePipe } from "@flefebvre/next-pipe/pipes";

import { BestTimes } from "@/components/games/best-times";
import { NewGameButton } from "@/components/games/new-game-button";
import { db } from "@/infra/prisma/db";

import { SudokuGame } from "./_components/sudoku-game";
import { completedGameOf } from "./completed-game";

async function GameBoard({ gameIdPromise }: { gameIdPromise: Promise<string> }) {
  const game = await db.game.findUnique({ where: { id: await gameIdPromise } });
  if (!game) notFound();

  return <SudokuGame gameId={game.id} puzzle={game.puzzle} completedGame={completedGameOf(game)} />;
}

async function CurrentGameNewGameButton({ gameIdPromise }: { gameIdPromise: Promise<string> }) {
  return <NewGameButton variant="outline" currentGameId={await gameIdPromise} />;
}

export default pagePipe<PageProps<"/[locale]/games/[gameId]">>().handle(async ({ params }) => {
  const t = await getTranslations("GamePage");
  const gameIdPromise = params.then(({ gameId }) => gameId);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href={"/" as Route} className="text-2xl font-semibold tracking-tight">
          {t("homeLink")}
        </Link>
        <Suspense fallback={<NewGameButton variant="outline" />}>
          <CurrentGameNewGameButton gameIdPromise={gameIdPromise} />
        </Suspense>
      </header>
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <div className="w-full max-w-xl">
          <Suspense fallback={<p className="text-sm text-muted-foreground">{t("loadingBoard")}</p>}>
            <GameBoard gameIdPromise={gameIdPromise} />
          </Suspense>
        </div>
        <div className="w-full lg:max-w-xs">
          <BestTimes />
        </div>
      </div>
    </main>
  );
});

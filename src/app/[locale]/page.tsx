import { getTranslations } from "next-intl/server";

import { pagePipe } from "@flefebvre/next-pipe/pipes";

import { BestTimes } from "@/components/games/best-times";
import { NewGameButton } from "@/components/games/new-game-button";

export default pagePipe<PageProps<"/[locale]">>().handle(async () => {
  const t = await getTranslations("HomePage");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-10 px-4 py-16 sm:py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("tagline")}</p>
        <NewGameButton />
      </div>
      <BestTimes />
    </main>
  );
});

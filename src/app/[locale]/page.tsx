import { getTranslations } from "next-intl/server";

import { pagePipe } from "@flefebvre/next-pipe/pipes";

export default pagePipe<PageProps<"/[locale]">>().handle(async () => {
  const t = await getTranslations("HomePage");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="max-w-prose text-muted-foreground">
        {t.rich("startFrom", {
          code: (chunks) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{chunks}</code>,
        })}
      </p>
    </main>
  );
});

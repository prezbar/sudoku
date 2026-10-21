import { getTranslations } from "next-intl/server";
import type { Route } from "next";
import Link from "next/link";

export default async function NotFoundPage() {
  const t = await getTranslations("NotFoundPage");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Link href={"/" as Route} className="text-sm font-medium underline underline-offset-4">
        {t("homeLink")}
      </Link>
    </main>
  );
}

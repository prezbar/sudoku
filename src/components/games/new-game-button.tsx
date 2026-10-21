"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { startGame } from "@/app/[locale]/actions";
import { Button } from "@/components/ui/button";

export function NewGameButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  const t = useTranslations("NewGameButton");
  const [, submitStartGame, isStartingGame] = useActionState(startGame, null);

  return (
    <form action={submitStartGame}>
      <Button type="submit" size="lg" variant={variant} disabled={isStartingGame} className="px-4">
        {isStartingGame ? t("starting") : t("label")}
      </Button>
    </form>
  );
}

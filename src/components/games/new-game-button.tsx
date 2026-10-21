"use client";

import { useTranslations } from "next-intl";
import { useActionState, type FormEvent } from "react";

import { startGame } from "@/app/[locale]/actions";
import { Button } from "@/components/ui/button";
import { hasSavedProgress } from "@/lib/games/saved-progress";

type NewGameButtonProps = { variant?: "default" | "outline"; currentGameId?: string };

export function NewGameButton({ variant = "default", currentGameId }: NewGameButtonProps) {
  const t = useTranslations("NewGameButton");
  const [, submitStartGame, isStartingGame] = useActionState(startGame, null);

  function confirmLeavingUnfinishedGame(event: FormEvent<HTMLFormElement>) {
    if (currentGameId === undefined || !hasSavedProgress(currentGameId)) return;
    if (!window.confirm(t("leaveUnfinishedGameConfirmation"))) event.preventDefault();
  }

  return (
    <form action={submitStartGame} onSubmit={confirmLeavingUnfinishedGame}>
      <Button type="submit" size="lg" variant={variant} disabled={isStartingGame} className="px-4">
        {isStartingGame ? t("starting") : t("label")}
      </Button>
    </form>
  );
}

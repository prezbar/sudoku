"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState, type FormEvent } from "react";

import { NewGameButton } from "@/components/games/new-game-button";
import { Button } from "@/components/ui/button";
import { isPlayerNameErrorKey, playerNameSchema } from "@/lib/games/player-name";

import { savePlayerName } from "../actions";
import {
  isPlayerNameFormClosedBy,
  savePlayerNameErrorKeyOf,
  type SavePlayerNameErrorKey,
  type SavePlayerNameResult,
} from "./save-player-name-error";

type PlayerNameFormProps = { gameId: string; onPlayerNameSave: (playerName: string) => void };

export function PlayerNameForm({ gameId, onPlayerNameSave }: PlayerNameFormProps) {
  const t = useTranslations("PlayerNameForm");
  const [playerName, setPlayerName] = useState("");
  const [clientErrorKey, setClientErrorKey] = useState<SavePlayerNameErrorKey | null>(null);
  const [result, submitPlayerName, isSubmitting] = useActionState(
    async (previousResult: SavePlayerNameResult | null, formData: FormData) => {
      try {
        setClientErrorKey(null);
        const savePlayerNameResult = await savePlayerName(previousResult, formData);
        if (savePlayerNameResult.status === "success") onPlayerNameSave(savePlayerNameResult.data.playerName);
        return savePlayerNameResult;
      } catch {
        setClientErrorKey("unexpected");
        return null;
      }
    },
    null,
  );

  const errorKey = clientErrorKey ?? savePlayerNameErrorKeyOf(result);
  const isFormClosed = isPlayerNameFormClosedBy(errorKey);

  function validatePlayerName(event: FormEvent<HTMLFormElement>) {
    const playerNameErrorKey = playerNameSchema.safeParse(playerName).error?.issues[0].message;
    if (!isPlayerNameErrorKey(playerNameErrorKey)) return;
    event.preventDefault();
    setClientErrorKey(playerNameErrorKey);
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      <form action={submitPlayerName} onSubmit={validatePlayerName} noValidate className="flex w-full flex-col gap-2">
        <input type="hidden" name="gameId" value={gameId} />
        <label htmlFor="player-name" className="text-sm font-medium">
          {t("playerNameLabel")}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="player-name"
            name="playerName"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder={t("playerNamePlaceholder")}
            autoComplete="nickname"
            autoFocus
            disabled={isFormClosed}
            aria-invalid={errorKey !== null}
            aria-describedby={errorKey ? "player-name-error" : undefined}
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 sm:text-sm"
          />
          <Button type="submit" size="lg" disabled={isSubmitting || isFormClosed} className="px-4">
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
        {errorKey && (
          <p id="player-name-error" role="alert" className="text-sm text-destructive">
            {t(`errors.${errorKey}`)}
          </p>
        )}
      </form>
      {isFormClosed && <NewGameButton variant="outline" />}
    </div>
  );
}

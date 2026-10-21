"use client";

import { getActionError } from "@flefebvre/next-pipe/client";
import { useTranslations } from "next-intl";
import { useActionState, useState, type FormEvent } from "react";

import { NewGameButton } from "@/components/games/new-game-button";
import { Button } from "@/components/ui/button";
import { isPlayerNameErrorKey, playerNameSchema, type PlayerNameErrorKey } from "@/lib/games/player-name";
import type { SerializedGrid } from "@/lib/sudoku/grid";

import { completeGame } from "../actions";

type CompletionResult = Awaited<ReturnType<typeof completeGame>>;
type CompletionErrorKey = PlayerNameErrorKey | "gridNotSolved" | "gameNotFound" | "gameAlreadyCompleted" | "unexpected";

function completionErrorKeyOf(result: CompletionResult | null): CompletionErrorKey | null {
  if (result === null || result.status === "success") return null;
  const playerNameErrorKey = getActionError(result, "schema")?.fieldErrors.playerName?.[0];
  if (isPlayerNameErrorKey(playerNameErrorKey)) return playerNameErrorKey;
  return result.error.type === "schema" ? "unexpected" : result.error.type;
}

export function CompletionForm({ gameId, solvedGrid }: { gameId: string; solvedGrid: SerializedGrid }) {
  const t = useTranslations("CompletionForm");
  const [playerName, setPlayerName] = useState("");
  const [clientErrorKey, setClientErrorKey] = useState<CompletionErrorKey | null>(null);
  const [result, submitCompletion, isSubmitting] = useActionState(
    async (previousResult: CompletionResult | null, formData: FormData) => {
      try {
        setClientErrorKey(null);
        return await completeGame(previousResult, formData);
      } catch {
        setClientErrorKey("unexpected");
        return null;
      }
    },
    null,
  );

  const errorKey = clientErrorKey ?? completionErrorKeyOf(result);
  const isGameClosed = errorKey === "gameAlreadyCompleted" || errorKey === "gameNotFound";

  function validatePlayerName(event: FormEvent<HTMLFormElement>) {
    const playerNameErrorKey = playerNameSchema.safeParse(playerName).error?.issues[0].message;
    if (!isPlayerNameErrorKey(playerNameErrorKey)) return;
    event.preventDefault();
    setClientErrorKey(playerNameErrorKey);
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      <form action={submitCompletion} onSubmit={validatePlayerName} noValidate className="flex w-full flex-col gap-2">
        <input type="hidden" name="gameId" value={gameId} />
        <input type="hidden" name="grid" value={solvedGrid} />
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
            disabled={isGameClosed}
            aria-invalid={errorKey !== null}
            aria-describedby={errorKey ? "player-name-error" : undefined}
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 sm:text-sm"
          />
          <Button type="submit" size="lg" disabled={isSubmitting || isGameClosed} className="px-4">
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
        {errorKey && (
          <p id="player-name-error" role="alert" className="text-sm text-destructive">
            {t(`errors.${errorKey}`)}
          </p>
        )}
      </form>
      {isGameClosed && <NewGameButton variant="outline" />}
    </div>
  );
}

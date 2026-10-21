import { isPlayerNameErrorKey, type PlayerNameErrorKey } from "@/lib/games/player-name";

import type { savePlayerName } from "../actions";

export type SavePlayerNameResult = Awaited<ReturnType<typeof savePlayerName>>;

export type SavePlayerNameErrorKey =
  PlayerNameErrorKey | "gameNotFound" | "gameNotCompleted" | "playerNameAlreadySaved" | "unexpected";

export function savePlayerNameErrorKeyOf(result: SavePlayerNameResult | null): SavePlayerNameErrorKey | null {
  if (result === null || result.status === "success") return null;
  if (result.error.type !== "schema") return result.error.type;
  const playerNameErrorKey = result.error.data.fieldErrors.playerName?.[0];
  return isPlayerNameErrorKey(playerNameErrorKey) ? playerNameErrorKey : "unexpected";
}

const formClosingErrorKeys = new Set<SavePlayerNameErrorKey>([
  "gameNotFound",
  "gameNotCompleted",
  "playerNameAlreadySaved",
]);

export function isPlayerNameFormClosedBy(errorKey: SavePlayerNameErrorKey | null): boolean {
  return errorKey !== null && formClosingErrorKeys.has(errorKey);
}

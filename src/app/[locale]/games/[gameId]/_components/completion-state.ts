import type { DurationInSeconds } from "@/lib/games/duration";

import type { completeGame } from "../actions";

type CompleteGameResult = Awaited<ReturnType<typeof completeGame>>;

export type CompletionErrorKey = "gameNotFound" | "gridNotSolved" | "unexpected";

export type CompletionState =
  | { status: "pending" }
  | { status: "completed"; durationInSeconds: DurationInSeconds }
  | { status: "failed"; errorKey: CompletionErrorKey };

export function completionStateOf(result: CompleteGameResult): CompletionState {
  if (result.status === "success") return { status: "completed", durationInSeconds: result.data.durationInSeconds };
  return { status: "failed", errorKey: result.error.type === "schema" ? "unexpected" : result.error.type };
}

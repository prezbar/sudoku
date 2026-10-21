import { z } from "zod";

const playerNameMaxLength = 30;

const playerNameErrorKeys = ["playerNameRequired", "playerNameTooLong"] as const;
export type PlayerNameErrorKey = (typeof playerNameErrorKeys)[number];

export function isPlayerNameErrorKey(key: string | undefined): key is PlayerNameErrorKey {
  return playerNameErrorKeys.some((playerNameErrorKey) => playerNameErrorKey === key);
}

export const playerNameSchema = z
  .string()
  .trim()
  .min(1, { error: "playerNameRequired" satisfies PlayerNameErrorKey })
  .max(playerNameMaxLength, { error: "playerNameTooLong" satisfies PlayerNameErrorKey });

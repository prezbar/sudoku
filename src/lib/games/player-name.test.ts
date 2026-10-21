import { expect, test } from "vitest";

import { isPlayerNameErrorKey, playerNameSchema } from "./player-name";

test("a name is trimmed", () => {
  expect(playerNameSchema.parse("  Ada  ")).toBe("Ada");
});

test("a name of 30 characters is accepted", () => {
  expect(playerNameSchema.parse("a".repeat(30))).toBe("a".repeat(30));
});

test("a name of 30 characters surrounded by spaces is accepted", () => {
  expect(playerNameSchema.parse(` ${"a".repeat(30)} `)).toBe("a".repeat(30));
});

test("an empty name is rejected with the playerNameRequired key", () => {
  expect(playerNameSchema.safeParse("").error?.issues[0].message).toBe("playerNameRequired");
});

test("a name made only of spaces is rejected with the playerNameRequired key", () => {
  expect(playerNameSchema.safeParse("   ").error?.issues[0].message).toBe("playerNameRequired");
});

test("a name over 30 characters is rejected with the playerNameTooLong key", () => {
  expect(playerNameSchema.safeParse("a".repeat(31)).error?.issues[0].message).toBe("playerNameTooLong");
});

test("the keys the schema reports are player name error keys", () => {
  expect(isPlayerNameErrorKey("playerNameRequired")).toBe(true);
  expect(isPlayerNameErrorKey("playerNameTooLong")).toBe(true);
});

test("any other key is not a player name error key", () => {
  expect(isPlayerNameErrorKey("invalidGrid")).toBe(false);
  expect(isPlayerNameErrorKey(undefined)).toBe(false);
});

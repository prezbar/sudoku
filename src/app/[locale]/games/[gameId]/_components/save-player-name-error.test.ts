import { expect, test } from "vitest";

import { isPlayerNameFormClosedBy, savePlayerNameErrorKeyOf } from "./save-player-name-error";

const input = { gameId: "game", playerName: "Ada" };

test("no result and a success carry no error", () => {
  expect(savePlayerNameErrorKeyOf(null)).toBeNull();
  expect(savePlayerNameErrorKeyOf({ status: "success", data: { playerName: "Ada" }, input })).toBeNull();
});

test.each(["playerNameRequired", "playerNameTooLong"] as const)(
  "a name rejected with %s maps to that key",
  (playerNameErrorKey) => {
    expect(
      savePlayerNameErrorKeyOf({
        status: "error",
        error: { type: "schema", data: { formErrors: [], fieldErrors: { playerName: [playerNameErrorKey] } } },
        input,
      }),
    ).toBe(playerNameErrorKey);
  },
);

test("any other schema error maps to unexpected", () => {
  expect(
    savePlayerNameErrorKeyOf({
      status: "error",
      error: { type: "schema", data: { formErrors: [], fieldErrors: { gameId: ["Too small"] } } },
      input,
    }),
  ).toBe("unexpected");
});

test.each([
  { status: "error", error: { type: "gameNotFound", data: null }, input },
  { status: "error", error: { type: "gameNotCompleted", data: null }, input },
  { status: "error", error: { type: "playerNameAlreadySaved", data: null }, input },
] as const)("a $error.type error maps to its own key and closes the form", (result) => {
  const savePlayerNameErrorKey = savePlayerNameErrorKeyOf(result);

  expect(savePlayerNameErrorKey).toBe(result.error.type);
  expect(isPlayerNameFormClosedBy(savePlayerNameErrorKey)).toBe(true);
});

test.each(["playerNameRequired", "playerNameTooLong", "unexpected", null] as const)(
  "a %s error leaves the form open for another try",
  (errorKey) => {
    expect(isPlayerNameFormClosedBy(errorKey)).toBe(false);
  },
);

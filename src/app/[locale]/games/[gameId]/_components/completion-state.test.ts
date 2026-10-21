import { expect, test } from "vitest";

import { completionStateOf } from "./completion-state";

test("a completed game reads as completed in the duration the server measured", () => {
  expect(completionStateOf({ status: "success", data: { durationInSeconds: 754 } })).toEqual({
    status: "completed",
    durationInSeconds: 754,
  });
});

test.each([
  { status: "error", error: { type: "gameNotFound", data: null } },
  { status: "error", error: { type: "gridNotSolved", data: null } },
] as const)("a $error.type error fails with its own key", (result) => {
  expect(completionStateOf(result)).toEqual({ status: "failed", errorKey: result.error.type });
});

test("a malformed request fails as unexpected", () => {
  expect(
    completionStateOf({
      status: "error",
      error: { type: "schema", data: { formErrors: [], fieldErrors: { solution: ["invalidSolution"] } } },
    }),
  ).toEqual({ status: "failed", errorKey: "unexpected" });
});

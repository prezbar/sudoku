import { expect, test } from "vitest";

import { durationInSecondsBetween, formatDuration } from "./duration";

test("the duration between two instants is counted in whole seconds, rounded", () => {
  const startedAt = new Date("2026-10-21T10:00:00.000Z");

  expect(durationInSecondsBetween(startedAt, new Date("2026-10-21T10:04:05.400Z"))).toBe(245);
  expect(durationInSecondsBetween(startedAt, new Date("2026-10-21T10:04:05.600Z"))).toBe(246);
});

test("an end before the start counts as no time at all", () => {
  expect(durationInSecondsBetween(new Date("2026-10-21T10:00:05Z"), new Date("2026-10-21T10:00:00Z"))).toBe(0);
});

test("a duration under an hour reads as minutes and padded seconds", () => {
  expect(formatDuration(0)).toBe("0:00");
  expect(formatDuration(65)).toBe("1:05");
  expect(formatDuration(3599)).toBe("59:59");
});

test("a duration of an hour or more reads as hours, padded minutes and padded seconds", () => {
  expect(formatDuration(3600)).toBe("1:00:00");
  expect(formatDuration(3 * 3600 + 7 * 60 + 9)).toBe("3:07:09");
});

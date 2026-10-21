import { expect, test } from "vitest";

import { createMulberry32, createRandomSeed, shuffleInPlace } from "./random";

test("the same seed draws the same sequence", () => {
  const firstRandom = createMulberry32(42);
  const secondRandom = createMulberry32(42);

  const firstDraws = Array.from({ length: 5 }, firstRandom);
  const secondDraws = Array.from({ length: 5 }, secondRandom);

  expect(firstDraws).toEqual(secondDraws);
});

test("two seeds draw different sequences", () => {
  expect(createMulberry32(1)()).not.toBe(createMulberry32(2)());
});

test("every draw falls in [0, 1)", () => {
  const random = createMulberry32(7);

  const draws = Array.from({ length: 1000 }, random);

  expect(draws.every((draw) => draw >= 0 && draw < 1)).toBe(true);
});

test("a shuffle keeps every item and returns the same array", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const shuffledItems = shuffleInPlace(items, createMulberry32(3));

  expect(shuffledItems).toBe(items);
  expect([...shuffledItems].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("a shuffle with the same seed gives the same order", () => {
  const firstOrder = shuffleInPlace([1, 2, 3, 4, 5, 6, 7, 8, 9], createMulberry32(11));
  const secondOrder = shuffleInPlace([1, 2, 3, 4, 5, 6, 7, 8, 9], createMulberry32(11));

  expect(firstOrder).toEqual(secondOrder);
});

test("a random seed is an unsigned 32-bit integer", () => {
  const seed = createRandomSeed();

  expect(Number.isInteger(seed)).toBe(true);
  expect(seed).toBeGreaterThanOrEqual(0);
  expect(seed).toBeLessThan(2 ** 32);
});

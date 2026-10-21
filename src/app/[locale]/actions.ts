"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { formActionPipe } from "@flefebvre/next-pipe/pipes";

import { db } from "@/infra/prisma/db";
import { generatePuzzle } from "@/lib/sudoku/generator";
import { serializeGrid } from "@/lib/sudoku/grid";
import { createMulberry32, createRandomSeed } from "@/lib/sudoku/random";

export const startGame = formActionPipe().handle(async () => {
  const { puzzle } = generatePuzzle(createMulberry32(createRandomSeed()), "medium");
  const game = await db.game.create({ data: { puzzle: serializeGrid(puzzle) } });
  redirect(`/games/${game.id}` as Route);
});

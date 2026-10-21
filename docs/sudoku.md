# Sudoku algorithms: developer notes

How to represent, generate, solve and validate classic 9x9 Sudoku. The TypeScript in sections 1 to 5 forms one self-contained module (about 150 lines, no dependencies). It was run and property-tested on Node 25 before being written here (timings are in section 3).

## 1. Representation

- A grid is a **flat array of 81 numbers in row-major order**. `0` means empty and `1..9` is a digit. It serializes as an 81-character string (`"530070000600195000..."`), which is handy for the DB, URLs and test fixtures.
- Keep the **puzzle** (givens) separate from the **player's entries**. The UI marks a cell as locked when `puzzle[i] !== 0`. The current board is `puzzle` merged with the player's entries. Never let a player overwrite a given.
- The full **solution** is a by-product of generation. The server keeps it, and it does not need to be sent to the client (see section 5).

```ts
export type Grid = number[]; // length 81, row-major, 0 = empty, 1..9 = digit

export const rowOf = (i: number) => Math.floor(i / 9);
export const colOf = (i: number) => i % 9;
export const boxOf = (i: number) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
export const idx = (row: number, col: number) => row * 9 + col;

// The 20 peers of each cell (same row, column or box), precomputed once.
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const peers: number[] = [];
  for (let j = 0; j < 81; j++) {
    if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) {
      peers.push(j);
    }
  }
  return peers;
});
```

There are 27 units (9 rows, 9 columns, 9 boxes). Each cell belongs to 3 units and has 20 peers (Norvig).

## 2. Seeded randomness

`Math.random()` can't be seeded. Pass a `rand: () => number` into every function that needs randomness, so that tests (and "puzzle #seed" links) can reproduce a grid exactly. Mulberry32 is a tiny, well-known 32-bit PRNG and is plenty for games. It is **not** cryptographic, so don't use it for anything security-related.

```ts
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  // Fisher-Yates, in place
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

In production, seed with `crypto.getRandomValues(new Uint32Array(1))[0]` and store the seed alongside the game.

## 3. Solver and solution counting

A single depth-first search does three jobs: solving, **counting solutions up to a limit**, and (with shuffled digit order) **generating random full grids**. It uses two techniques:

- **Bitmasks.** For each row, column and box, a 9-bit mask records the digits already used. The candidates for cell `i` are `0x1ff & ~(rows[r] | cols[c] | boxes[b])`, which costs O(1) per cell.
- **MRV (minimum remaining values).** At each step, branch on the empty cell with the fewest candidates. A cell with 0 candidates is a dead end, so prune it. A cell with 1 candidate is a forced move (a "naked single"). MRV is what makes plain backtracking fast. Without it, naive cell-by-cell backtracking can blow up on adversarial puzzles (Wikipedia mentions a 17-clue puzzle with an empty top row built to defeat it).

```ts
const ALL = 0x1ff; // bits 0..8 => digits 1..9
const popcount = (m: number) => {
  let c = 0;
  while (m) {
    m &= m - 1;
    c++;
  }
  return c;
};

/**
 * Depth-first search over `grid` (mutated in place; when the limit is hit the
 * grid is left holding the last solution found, otherwise it is restored).
 * Returns the number of solutions found, stopping once `limit` is reached.
 */
function search(grid: Grid, limit: number, rand?: () => number): number {
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v === 0) continue;
    const bit = 1 << (v - 1);
    const r = rowOf(i),
      c = colOf(i),
      b = boxOf(i);
    if ((rows[r] | cols[c] | boxes[b]) & bit) return 0; // givens already conflict
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[b] |= bit;
  }

  let count = 0;
  const recurse = (): boolean => {
    // MRV: pick the empty cell with the fewest candidates.
    let best = -1,
      bestMask = 0,
      bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) continue;
      const mask = ALL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const n = popcount(mask);
      if (n < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = n;
        if (n <= 1) break; // 0 = dead end, 1 = forced: no need to look further
      }
    }
    if (best === -1) return ++count >= limit; // no empty cell: a solution
    if (bestCount === 0) return false;

    const digits: number[] = [];
    for (let d = 1; d <= 9; d++) if (bestMask & (1 << (d - 1))) digits.push(d);
    if (rand) shuffle(digits, rand);

    const r = rowOf(best),
      c = colOf(best),
      b = boxOf(best);
    for (const d of digits) {
      const bit = 1 << (d - 1);
      grid[best] = d;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      if (recurse()) return true; // limit reached: stop, leave grid as is
      grid[best] = 0;
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      boxes[b] &= ~bit;
    }
    return false;
  };
  recurse();
  return count;
}

/** Counts solutions, stopping at `limit` (2 is enough to test uniqueness). Does not mutate. */
export function countSolutions(puzzle: Grid, limit = 2): number {
  return search(puzzle.slice(), limit);
}

/** Returns the first solution found, or null. */
export function solve(puzzle: Grid): Grid | null {
  const g = puzzle.slice();
  return search(g, 1) === 1 ? g : null;
}
```

**Always count with `limit = 2`.** You only need to know 0, 1 or "more than one". Counting every solution of a sparse grid can take a very long time (an empty grid has about 6.67 × 10²¹ solutions, the number of valid completed grids).

**Measured** (Node 25, Apple Silicon). Each 17-clue puzzle we tried counted in about 3 ms, Arto Inkala's "world's hardest" puzzle in about 20 ms, and an empty grid (stopping at 2) in about 0.1 ms. If you ever need more speed, add Norvig's second rule (a "hidden single": a digit with only one possible place in a unit is forced) or switch to Knuth's Algorithm X with Dancing Links, which treats Sudoku as an exact-cover problem with 324 constraints and 729 candidate rows. Neither is needed here.

## 4. Generating a puzzle

**Step 1: full solution grid.** Run the solver on an empty grid with shuffled candidate order. Every random path either completes or backtracks, so the result is always a valid random grid.

**Step 2: dig holes while keeping the solution unique.** Visit cells in random order. Blank each one, and if `countSolutions(puzzle, 2) !== 1`, put the digit back. Stop once you reach the target number of givens. The puzzle is unique at every step by construction, so no final check is needed (the tests still check it).

```ts
export function generateSolution(rand: () => number): Grid {
  const g: Grid = new Array(81).fill(0);
  search(g, 1, rand); // random digit order => random full grid
  return g;
}

export type Difficulty = "easy" | "medium" | "hard";
const TARGET_GIVENS: Record<Difficulty, number> = { easy: 40, medium: 32, hard: 26 };

export function generatePuzzle(
  rand: () => number,
  difficulty: Difficulty = "medium",
  symmetric = true,
): { puzzle: Grid; solution: Grid } {
  const solution = generateSolution(rand);
  const puzzle = solution.slice();
  const target = TARGET_GIVENS[difficulty];
  let givens = 81;

  // Visit cells in random order; with symmetry, cell i and 80 - i go together.
  const order = shuffle([...Array(81).keys()], rand);
  for (const i of order) {
    if (givens <= target) break;
    if (puzzle[i] === 0) continue;
    const j = 80 - i;
    const pair = symmetric && j !== i ? [i, j] : [i];
    if (givens - pair.length < target && pair.length > 1) continue;
    const saved = pair.map((k) => puzzle[k]);
    pair.forEach((k) => (puzzle[k] = 0));
    if (countSolutions(puzzle, 2) === 1) {
      givens -= pair.length;
    } else {
      pair.forEach((k, n) => (puzzle[k] = saved[n])); // not unique: put back
    }
  }
  return { puzzle, solution };
}
```

Notes:

- **Symmetry is optional and cosmetic.** 180° rotational symmetry (removing cell `i` together with cell `80 - i`) is a newspaper convention. It makes low targets slightly harder to reach. In testing, symmetric "hard" puzzles averaged 27.7 givens against a target of 26 (max 32). Treat the target as "at most this many givens, if reachable".
- **Difficulty by clue count is a rough proxy.** Real difficulty depends on which solving techniques are required, not on how many givens there are. For an MVP, 40 / 32 / 26 givens is a reasonable easy / medium / hard split. A better grader would solve with human techniques (singles, pairs, and so on) and score the hardest technique needed. That's out of scope here.
- **17 is the floor.** McGuire, Tugemann and Civario (2012) showed by exhaustive computer search (about 7 million CPU hours) that no 16-clue puzzle with a unique solution exists. Random digging can't get anywhere near 17: digging until no cell can be removed gave **minimal** puzzles with 22 to 27 givens (average 24.3). Don't set a target below about 22, or the loop will just stop wherever it gets stuck.
- **Measured generation time** (300 seeds per row, two runs, Node 25, including the solution grid; 50 hard puzzles in about 70 ms total):

  | mode                       | avg         | p99      | max                         |
  | -------------------------- | ----------- | -------- | --------------------------- |
  | easy / medium (sym or not) | 0.2–0.5 ms  | ≤ 3.2 ms | ≤ 6 ms                      |
  | hard (26)                  | ~1.3–1.5 ms | ~5–6 ms  | 7–26 ms (varies run to run) |
  | minimal (dig until stuck)  | 3.6 ms      | —        | 21 ms                       |

  This is fast enough to generate on the server per request, or in the browser, with no worker thread.

## 5. Validation

```ts
/** Peers of `i` that currently hold `value` (empty array = no conflict). */
export function conflicts(grid: Grid, i: number, value: number): number[] {
  return value === 0 ? [] : PEERS[i].filter((j) => grid[j] === value);
}

/** True if the grid is full and every row/column/box contains 1..9 exactly once. */
export function isValidSolution(grid: Grid): boolean {
  if (grid.length !== 81) return false;
  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (!Number.isInteger(v) || v < 1 || v > 9) return false;
    if (conflicts(grid, i, v).length > 0) return false;
  }
  return true;
}

/** Server-side check: the submission is a valid full grid that keeps every given. */
export function isSolutionOf(puzzle: Grid, submission: Grid): boolean {
  return isValidSolution(submission) && puzzle.every((given, i) => given === 0 || given === submission[i]);
}
```

- **Move feedback (client).** `conflicts(board, i, v)` returns the peer cells to highlight. A move can be rule-legal now and still be wrong (it contradicts the unique solution). Whether to reveal that, as "mistake" highlighting, is a product choice. It requires the solution on the client, which makes cheating trivial.
- **Completion.** The game is won when the board is full and `isSolutionOf(puzzle, board)` holds. **Checking against the rules and checking against the stored solution are equivalent for our puzzles.** Any full grid that obeys the rules and keeps the givens is, by definition, a solution of the puzzle, and the puzzle has exactly one solution. Prefer the rule check anyway. It doesn't need the solution, and it stays correct if a non-unique puzzle ever slips in (for example, a hand-entered one). In that case, comparing to a stored solution would wrongly reject a valid alternative answer.
- **Server (don't trust the client).** When a game starts, the server generates the puzzle (or derives it from a seed) and stores `{ gameId, puzzle, startedAt }` in the DB. On submit, the client sends `{ gameId, grid, name }`. The server loads the **stored** puzzle and runs `isSolutionOf(storedPuzzle, grid)`. Never accept the puzzle or the elapsed time from the request body. Also check the shape of the input (`Array.isArray`, length 81, integers 1–9; `isValidSolution` already rejects anything else), mark the game as finished so it can't be submitted twice, and limit `name` length.

## 6. Testing (properties to assert)

The following properties were all checked over 300 seeds × 3 difficulties × symmetric on/off, using plain asserts (they port directly to Vitest `expect`):

- `isValidSolution(solution)` holds for every generated solution.
- `countSolutions(puzzle, 2) === 1` (uniqueness).
- The givens are a subset of the solution: `puzzle.every((v, i) => v === 0 || v === solution[i])`.
- `solve(puzzle)` equals `solution`, and `isSolutionOf(puzzle, solution)` holds.
- The given count is at least the target, and, when `symmetric`, `(puzzle[i] === 0) === (puzzle[80 - i] === 0)` for all `i`.
- **Determinism:** the same seed produces an identical `{ puzzle, solution }`.
- **The validator rejects known-bad grids:** a valid solution with two cells swapped, a grid with one `0`, an all-`5` grid, a grid of length 80, values like `10` or `1.5`, and a correct grid that alters a given (`isSolutionOf` must be false).
- **Solver fixtures:** a known 17-clue puzzle gives a count of 1. A puzzle with a cell blanked out of a known-unique minimal puzzle gives 2. Two givens that conflict give 0. An empty grid gives 2 at `limit = 2`.
- A coarse performance guard, for example generating 50 hard puzzles in under 1 s, catches accidental exponential regressions.

Known fixtures (`0` = empty):

```
17 clues:  000000010400000000020000000000050407008000300001090000300400200050100000000806000
Inkala:    800000000003600000070090200050007000000045700000100030001000068008500010090000400
```

## 7. Pitfalls

- **Uniqueness requires `limit = 2`, not a full solve.** Finding _a_ solution says nothing about uniqueness, and counting _all_ solutions is wasteful.
- **Don't shuffle digits in `countSolutions`.** That only matters for generation. For counting, a fixed order keeps the work deterministic.
- **Mutating shared arrays.** `countSolutions` copies its input, but `search` doesn't. Don't pass the React state array to `search` directly.
- **`boxOf` off-by-one errors.** The box is `floor(row / 3) * 3 + floor(col / 3)`. Unit-test it on cells 0, 8, 26, 27, 40 and 80, which should give boxes 0, 2, 2, 3, 4 and 8.
- **Heavy tails.** Norvig observed rare random puzzles (non-unique or unsolvable ones) taking minutes with a plain DFS. Our generator only calls the solver on grids derived from a valid solution, and the limit of 2 bounds the work, so this didn't show up in testing. Still, never run the solver on arbitrary user-entered puzzles on the server without a time or node budget.
- **Givens alone don't define difficulty**, as noted in section 4.

## References (consulted)

- Peter Norvig, _Solving Every Sudoku Puzzle_: units and peers, constraint propagation, MRV search, and heavy-tailed run times. https://norvig.com/sudoku.html
- Wikipedia, _Sudoku solving algorithms_: backtracking (and how it can be defeated), constraint programming, exact cover, Algorithm X / DLX, and stochastic methods. https://en.wikipedia.org/wiki/Sudoku_solving_algorithms
- G. McGuire, B. Tugemann, G. Civario, _There is no 16-Clue Sudoku: Solving the Sudoku Minimum Number of Clues Problem_ (2012, rev. 2013), arXiv:1201.0749. https://arxiv.org/abs/1201.0749
- University College Dublin press release about the result (about 7 million CPU hours). https://www.ucd.ie/news/2012/01JAN12/100111-There-is-no-16-clue-or-less-Sudoku-mathematician-proves.html
- Wikipedia, _Mathematics of Sudoku_: 6,670,903,752,021,072,936,960 completed grids. https://en.wikipedia.org/wiki/Mathematics_of_Sudoku
- D. E. Knuth, _Dancing Links_ (2000), arXiv:cs/0011047, the exact-cover alternative to the solver above. https://arxiv.org/abs/cs/0011047

import { createEmptyGrid, emptyCellValue, gridCellCount, type Grid } from "./grid";
import { shuffleInPlace, type RandomNumberGenerator } from "./random";
import { countSolutions, searchSolutionsInPlace } from "./solver";

export type Difficulty = "easy" | "medium" | "hard";
export type GeneratedPuzzle = { puzzle: Grid; solution: Grid };

export const targetGivenCountByDifficulty: Record<Difficulty, number> = { easy: 40, medium: 32, hard: 26 };

const centerMirrorIndexSum = gridCellCount - 1;

export function generateSolution(random: RandomNumberGenerator): Grid {
  const solution = createEmptyGrid();
  searchSolutionsInPlace(solution, 1, random);
  return solution;
}

export function generatePuzzle(
  random: RandomNumberGenerator,
  difficulty: Difficulty = "medium",
  isSymmetric = true,
): GeneratedPuzzle {
  const solution = generateSolution(random);
  const puzzle = solution.slice();
  const targetGivenCount = targetGivenCountByDifficulty[difficulty];
  let givenCount = gridCellCount;

  const visitOrder = shuffleInPlace([...Array(gridCellCount).keys()], random);
  for (const cellIndex of visitOrder) {
    if (givenCount <= targetGivenCount) break;
    if (puzzle[cellIndex] === emptyCellValue) continue;
    const mirrorCellIndex = centerMirrorIndexSum - cellIndex;
    const blankedCellIndexes =
      isSymmetric && mirrorCellIndex !== cellIndex ? [cellIndex, mirrorCellIndex] : [cellIndex];
    if (blankedCellIndexes.length > 1 && givenCount - blankedCellIndexes.length < targetGivenCount) continue;

    const savedValues = blankedCellIndexes.map((blankedCellIndex) => puzzle[blankedCellIndex]);
    for (const blankedCellIndex of blankedCellIndexes) puzzle[blankedCellIndex] = emptyCellValue;
    if (countSolutions(puzzle) === 1) {
      givenCount -= blankedCellIndexes.length;
    } else {
      blankedCellIndexes.forEach((blankedCellIndex, position) => (puzzle[blankedCellIndex] = savedValues[position]));
    }
  }
  return { puzzle, solution };
}

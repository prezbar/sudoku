import { boxIndexOf, columnIndexOf, gridCellCount, gridSideLength, rowIndexOf, type Grid } from "./grid";
import { shuffleInPlace, type RandomNumberGenerator } from "./random";

type DigitMask = number;

const allDigitsMask: DigitMask = 0x1ff;
const uniquenessSolutionLimit = 2;

const digitBitOf = (digit: number): DigitMask => 1 << (digit - 1);

function countSetBits(mask: DigitMask) {
  let setBitCount = 0;
  while (mask) {
    mask &= mask - 1;
    setBitCount++;
  }
  return setBitCount;
}

export function searchSolutionsInPlace(grid: Grid, solutionLimit: number, random?: RandomNumberGenerator): number {
  const usedDigitsByRowIndex = new Array<DigitMask>(gridSideLength).fill(0);
  const usedDigitsByColumnIndex = new Array<DigitMask>(gridSideLength).fill(0);
  const usedDigitsByBoxIndex = new Array<DigitMask>(gridSideLength).fill(0);

  for (let cellIndex = 0; cellIndex < gridCellCount; cellIndex++) {
    const value = grid[cellIndex];
    if (value === 0) continue;
    const digitBit = digitBitOf(value);
    const rowIndex = rowIndexOf(cellIndex);
    const columnIndex = columnIndexOf(cellIndex);
    const boxIndex = boxIndexOf(cellIndex);
    const usedDigits =
      usedDigitsByRowIndex[rowIndex] | usedDigitsByColumnIndex[columnIndex] | usedDigitsByBoxIndex[boxIndex];
    if (usedDigits & digitBit) return 0;
    usedDigitsByRowIndex[rowIndex] |= digitBit;
    usedDigitsByColumnIndex[columnIndex] |= digitBit;
    usedDigitsByBoxIndex[boxIndex] |= digitBit;
  }

  const candidateMaskOf = (cellIndex: number): DigitMask =>
    allDigitsMask &
    ~(
      usedDigitsByRowIndex[rowIndexOf(cellIndex)] |
      usedDigitsByColumnIndex[columnIndexOf(cellIndex)] |
      usedDigitsByBoxIndex[boxIndexOf(cellIndex)]
    );

  let solutionCount = 0;

  const isLimitReachedAfterSearching = (): boolean => {
    let mostConstrainedCellIndex = -1;
    let mostConstrainedCandidateMask: DigitMask = 0;
    let mostConstrainedCandidateCount = gridSideLength + 1;
    for (let cellIndex = 0; cellIndex < gridCellCount; cellIndex++) {
      if (grid[cellIndex] !== 0) continue;
      const candidateMask = candidateMaskOf(cellIndex);
      const candidateCount = countSetBits(candidateMask);
      if (candidateCount < mostConstrainedCandidateCount) {
        mostConstrainedCellIndex = cellIndex;
        mostConstrainedCandidateMask = candidateMask;
        mostConstrainedCandidateCount = candidateCount;
        if (candidateCount <= 1) break;
      }
    }
    if (mostConstrainedCellIndex === -1) return ++solutionCount >= solutionLimit;
    if (mostConstrainedCandidateCount === 0) return false;

    const candidateDigits: number[] = [];
    for (let digit = 1; digit <= gridSideLength; digit++) {
      if (mostConstrainedCandidateMask & digitBitOf(digit)) candidateDigits.push(digit);
    }
    if (random) shuffleInPlace(candidateDigits, random);

    const rowIndex = rowIndexOf(mostConstrainedCellIndex);
    const columnIndex = columnIndexOf(mostConstrainedCellIndex);
    const boxIndex = boxIndexOf(mostConstrainedCellIndex);
    for (const digit of candidateDigits) {
      const digitBit = digitBitOf(digit);
      grid[mostConstrainedCellIndex] = digit;
      usedDigitsByRowIndex[rowIndex] |= digitBit;
      usedDigitsByColumnIndex[columnIndex] |= digitBit;
      usedDigitsByBoxIndex[boxIndex] |= digitBit;
      if (isLimitReachedAfterSearching()) return true;
      grid[mostConstrainedCellIndex] = 0;
      usedDigitsByRowIndex[rowIndex] &= ~digitBit;
      usedDigitsByColumnIndex[columnIndex] &= ~digitBit;
      usedDigitsByBoxIndex[boxIndex] &= ~digitBit;
    }
    return false;
  };

  isLimitReachedAfterSearching();
  return solutionCount;
}

export function countSolutions(puzzle: Grid, solutionLimit = uniquenessSolutionLimit): number {
  return searchSolutionsInPlace(puzzle.slice(), solutionLimit);
}

export function solvePuzzle(puzzle: Grid): Grid | null {
  const solution = puzzle.slice();
  return searchSolutionsInPlace(solution, 1) === 1 ? solution : null;
}

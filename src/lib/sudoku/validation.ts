import {
  emptyCellValue,
  gridCellCount,
  peerIndexesByCellIndex,
  type CellIndex,
  type CellValue,
  type Grid,
} from "./grid";

export function conflictingPeerIndexes(grid: Grid, cellIndex: CellIndex, value: CellValue): CellIndex[] {
  if (value === emptyCellValue) return [];
  return peerIndexesByCellIndex[cellIndex].filter((peerIndex) => grid[peerIndex] === value);
}

export function conflictingCellIndexes(board: Grid): Set<CellIndex> {
  const cellIndexes = new Set<CellIndex>();
  board.forEach((value, cellIndex) => {
    if (conflictingPeerIndexes(board, cellIndex, value).length > 0) cellIndexes.add(cellIndex);
  });
  return cellIndexes;
}

export function isValidSolution(grid: Grid): boolean {
  if (grid.length !== gridCellCount) return false;
  return grid.every(
    (value, cellIndex) =>
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 9 &&
      conflictingPeerIndexes(grid, cellIndex, value).length === 0,
  );
}

export function isSolutionOf(puzzle: Grid, submission: Grid): boolean {
  return (
    isValidSolution(submission) &&
    puzzle.every((given, cellIndex) => given === emptyCellValue || given === submission[cellIndex])
  );
}

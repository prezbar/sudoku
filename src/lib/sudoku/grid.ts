export type CellIndex = number;
export type CellValue = number;
export type Grid = CellValue[];
export type SerializedGrid = string;
export type MoveDirection = "up" | "down" | "left" | "right";

export const gridSideLength = 9;
export const gridCellCount = gridSideLength * gridSideLength;
export const emptyCellValue = 0;

export const rowIndexOf = (cellIndex: CellIndex) => Math.floor(cellIndex / gridSideLength);
export const columnIndexOf = (cellIndex: CellIndex) => cellIndex % gridSideLength;
export const boxIndexOf = (cellIndex: CellIndex) =>
  Math.floor(cellIndex / 27) * 3 + Math.floor(columnIndexOf(cellIndex) / 3);
export const cellIndexAt = (rowIndex: number, columnIndex: number): CellIndex =>
  rowIndex * gridSideLength + columnIndex;

export const peerIndexesByCellIndex: CellIndex[][] = Array.from({ length: gridCellCount }, (_, cellIndex) => {
  const peerIndexes: CellIndex[] = [];
  for (let otherIndex = 0; otherIndex < gridCellCount; otherIndex++) {
    const isSameUnit =
      rowIndexOf(otherIndex) === rowIndexOf(cellIndex) ||
      columnIndexOf(otherIndex) === columnIndexOf(cellIndex) ||
      boxIndexOf(otherIndex) === boxIndexOf(cellIndex);
    if (otherIndex !== cellIndex && isSameUnit) peerIndexes.push(otherIndex);
  }
  return peerIndexes;
});

export function createEmptyGrid(): Grid {
  return new Array<CellValue>(gridCellCount).fill(emptyCellValue);
}

const serializedGridPattern = /^[0-9]{81}$/;

export function parseGrid(serializedGrid: SerializedGrid): Grid {
  if (!serializedGridPattern.test(serializedGrid)) {
    throw new Error(`a serialized grid is 81 digits, got "${serializedGrid}"`);
  }
  return serializedGrid.split("").map(Number);
}

export function serializeGrid(grid: Grid): SerializedGrid {
  return grid.join("");
}

const lastLineIndex = gridSideLength - 1;

export function adjacentCellIndex(cellIndex: CellIndex, direction: MoveDirection): CellIndex {
  const rowIndex = rowIndexOf(cellIndex);
  const columnIndex = columnIndexOf(cellIndex);
  switch (direction) {
    case "up":
      return cellIndexAt(Math.max(rowIndex - 1, 0), columnIndex);
    case "down":
      return cellIndexAt(Math.min(rowIndex + 1, lastLineIndex), columnIndex);
    case "left":
      return cellIndexAt(rowIndex, Math.max(columnIndex - 1, 0));
    case "right":
      return cellIndexAt(rowIndex, Math.min(columnIndex + 1, lastLineIndex));
  }
}

import { GRID_HEIGHT, GRID_WIDTH, PIECES, PieceType, RotationState } from "./tetrominoes";

export type Grid = (string | null)[][];

export interface CurrentPiece {
  type: PieceType;
  shape: number[][];
  position: { x: number; y: number };
  rotation: RotationState;
  color: string;
}

export const createEmptyGrid = (): Grid => Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));

export const createPiece = (type: PieceType): CurrentPiece => {
  const p = PIECES[type];
  return {
    type,
    shape: p.shape,
    position: { x: Math.floor(GRID_WIDTH / 2) - Math.floor(p.shape[0].length / 2), y: 0 },
    rotation: "0",
    color: p.color,
  };
};

export const isValidPosition = (grid: Grid, piece: CurrentPiece, newX: number, newY: number, newShape?: number[][]): boolean => {
  const shape = newShape || piece.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = newX + c;
      const y = newY + r;
      if (x < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return false;
      if (y >= 0 && grid[y][x]) return false;
    }
  }
  return true;
};

export const rotateShape = (shape: number[][], clockwise: boolean = true): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (clockwise) rotated[c][rows - 1 - r] = shape[r][c];
      else rotated[cols - 1 - c][r] = shape[r][c];
    }
  }
  return rotated;
};

export const nextRotationState = (current: RotationState): RotationState => {
  const states: RotationState[] = ["0","R","2","L"]; const i = states.indexOf(current); return states[(i + 1) % states.length];
};

export const trySRSRotation = (grid: Grid, piece: CurrentPiece, newShape: number[][], newRotation: RotationState): { x: number; y: number } | null => {
  const srsKey = `${piece.rotation}-${newRotation}` as keyof typeof PIECES[typeof piece.type]["srs"];
  const srsData = PIECES[piece.type].srs[srsKey as any] as Array<{x:number;y:number}> | undefined;
  if (!srsData) {
    return isValidPosition(grid, piece, piece.position.x, piece.position.y, newShape) ? piece.position : null;
  }
  for (const off of srsData) {
    const nx = piece.position.x + off.x; const ny = piece.position.y + off.y;
    if (isValidPosition(grid, piece, nx, ny, newShape)) return { x: nx, y: ny };
  }
  return null;
};

export const placePiece = (grid: Grid, piece: CurrentPiece): Grid => {
  const newGrid = grid.map(r => [...r]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const x = piece.position.x + c; const y = piece.position.y + r;
      if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) newGrid[y][x] = piece.color;
    }
  }
  return newGrid;
};

export const clearLines = (grid: Grid): { newGrid: Grid; linesCleared: number; clearedRows: number[] } => {
  const newGrid: Grid = [] as any; let linesCleared = 0; const clearedRows: number[] = [];
  for (let r = 0; r < GRID_HEIGHT; r++) {
    if (grid[r].every(cell => cell !== null)) { linesCleared++; clearedRows.push(r); } else newGrid.push([...grid[r]]);
  }
  while (newGrid.length < GRID_HEIGHT) newGrid.unshift(Array(GRID_WIDTH).fill(null));
  return { newGrid, linesCleared, clearedRows };
};

export const calculateScore = (linesCleared: number, level: number): number => {
  const base = [0, 40, 100, 300, 1200]; return base[linesCleared] * (level + 1);
};

export const ghostDropY = (grid: Grid, piece: CurrentPiece): number => {
  let y = piece.position.y; while (isValidPosition(grid, piece, piece.position.x, y + 1)) y++; return y;
};

export const computeDropDistance = (grid: Grid, piece: CurrentPiece): number => {
  const gy = ghostDropY(grid, piece); return Math.max(0, gy - piece.position.y);
};

export const CHAR_ASPECT = 0.6; // average mono char width / fontSize

type SimplePiece = {
  shape: number[][];
  position: { x: number; y: number };
  color: string;
};

const COLOR_TO_CHAR: Record<string, string> = {
  "#00FFFF": "=", // I
  "#0000FF": "#", // J
  "#FFA500": "+", // L
  "#FFFF00": "*", // O
  "#00FF00": "█", // S
  "#800080": "%", // T
  "#FF0000": "@", // Z
};

const charForColor = (color?: string | null) => {
  if (!color) return " ";
  return COLOR_TO_CHAR[color] || "#";
};

export const composeAsciiGrid = (
  grid: (string | null)[][],
  currentPiece: SimplePiece | null
): string => {
  const h = grid.length;
  const w = grid[0]?.length || 0;
  const chars: string[][] = Array.from({ length: h }, () => Array(w).fill(" "));

  // base grid
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x]) chars[y][x] = charForColor(grid[y][x]);
    }
  }

  // overlay current piece
  if (currentPiece) {
    const { shape, position, color } = currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const y = position.y + r;
          const x = position.x + c;
          if (y >= 0 && y < h && x >= 0 && x < w) {
            chars[y][x] = charForColor(color);
          }
        }
      }
    }
  }

  return chars.map((row) => row.join("")).join("\n");
};

export const composeAsciiPiece = (shape: number[][], color: string): string => {
  const h = shape.length;
  const w = shape[0]?.length || 0;
  const chars: string[][] = Array.from({ length: h }, () => Array(w).fill(" "));
  const ch = charForColor(color);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (shape[r][c]) chars[r][c] = ch;
    }
  }
  return chars.map((row) => row.join("")).join("\n");
};

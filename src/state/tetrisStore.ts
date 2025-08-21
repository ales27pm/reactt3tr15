import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

const PIECES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00FFFF',
    srs: {
      '0-R': [{x: 0, y: 0}, {x: -2, y: 0}, {x: 1, y: 0}, {x: -2, y: -1}, {x: 1, y: 2}],
      'R-0': [{x: 0, y: 0}, {x: 2, y: 0}, {x: -1, y: 0}, {x: 2, y: 1}, {x: -1, y: -2}],
      'R-2': [{x: 0, y: 0}, {x: -1, y: 0}, {x: 2, y: 0}, {x: -1, y: 2}, {x: 2, y: -1}],
      '2-R': [{x: 0, y: 0}, {x: 1, y: 0}, {x: -2, y: 0}, {x: 1, y: -2}, {x: -2, y: 1}],
      '2-L': [{x: 0, y: 0}, {x: 2, y: 0}, {x: -1, y: 0}, {x: 2, y: 1}, {x: -1, y: -2}],
      'L-2': [{x: 0, y: 0}, {x: -2, y: 0}, {x: 1, y: 0}, {x: -2, y: -1}, {x: 1, y: 2}],
      'L-0': [{x: 0, y: 0}, {x: 1, y: 0}, {x: -2, y: 0}, {x: 1, y: -2}, {x: -2, y: 1}],
      '0-L': [{x: 0, y: 0}, {x: -1, y: 0}, {x: 2, y: 0}, {x: -1, y: 2}, {x: 2, y: -1}]
    }
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000FF',
    srs: {
      '0-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      'R-0': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      'R-2': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      '2-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      '2-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}],
      'L-2': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      'L-0': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      '0-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}]
    }
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#FFA500',
    srs: {
      '0-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      'R-0': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      'R-2': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      '2-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      '2-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}],
      'L-2': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      'L-0': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      '0-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}]
    }
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00',
    srs: {}
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00FF00',
    srs: {
      '0-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      'R-0': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      'R-2': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      '2-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      '2-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}],
      'L-2': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      'L-0': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      '0-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}]
    }
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#800080',
    srs: {
      '0-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      'R-0': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      'R-2': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      '2-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      '2-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}],
      'L-2': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      'L-0': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      '0-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}]
    }
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF0000',
    srs: {
      '0-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      'R-0': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      'R-2': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}],
      '2-R': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}],
      '2-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}],
      'L-2': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      'L-0': [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}],
      '0-L': [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}]
    }
  }
};

const PIECE_TYPES = Object.keys(PIECES) as (keyof typeof PIECES)[];

type PieceType = keyof typeof PIECES;
type RotationState = '0' | 'R' | '2' | 'L';

interface CurrentPiece {
  type: PieceType;
  shape: number[][];
  position: { x: number; y: number };
  rotation: RotationState;
  color: string;
}

interface TetrisState {
  grid: (string | null)[][];
  currentPiece: CurrentPiece | null;
  nextPiece: PieceType | null;
  holdPiece: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
  highScore: number;
  asciiMode: boolean;
}

interface TetrisActions {
  initializeGame: () => void;
  movePiece: (direction: 'left' | 'right') => void;
  rotatePiece: () => void;
  dropPiece: () => void;
  hardDrop: () => void;
  holdSwap: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  toggleAsciiMode: () => void;
}

const createEmptyGrid = (): (string | null)[][] => {
  return Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
};

const getRandomPiece = (): PieceType => {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
};

const createPiece = (type: PieceType): CurrentPiece => {
  const piece = PIECES[type];
  return {
    type,
    shape: piece.shape,
    position: { x: Math.floor(GRID_WIDTH / 2) - Math.floor(piece.shape[0].length / 2), y: 0 },
    rotation: '0',
    color: piece.color,
  };
};

const isValidPosition = (
  grid: (string | null)[][],
  piece: CurrentPiece,
  newX: number,
  newY: number,
  newShape?: number[][]
): boolean => {
  const shape = newShape || piece.shape;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const x = newX + col;
        const y = newY + row;
        
        if (x < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) {
          return false;
        }
        
        if (y >= 0 && grid[y][x]) {
          return false;
        }
      }
    }
  }
  
  return true;
};

const rotatePieceShape = (shape: number[][], clockwise: boolean = true): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (clockwise) {
        rotated[col][rows - 1 - row] = shape[row][col];
      } else {
        rotated[cols - 1 - col][row] = shape[row][col];
      }
    }
  }
  
  return rotated;
};

const getNextRotationState = (current: RotationState): RotationState => {
  const states: RotationState[] = ['0', 'R', '2', 'L'];
  const currentIndex = states.indexOf(current);
  return states[(currentIndex + 1) % states.length];
};

const trySRSRotation = (
  grid: (string | null)[][],
  piece: CurrentPiece,
  newShape: number[][],
  newRotation: RotationState
): { x: number; y: number } | null => {
  const srsKey = `${piece.rotation}-${newRotation}` as keyof typeof PIECES[typeof piece.type]['srs'];
  const srsData = PIECES[piece.type].srs[srsKey];
  
  if (!srsData) {
    // For O piece or invalid rotation
    if (isValidPosition(grid, piece, piece.position.x, piece.position.y, newShape)) {
      return piece.position;
    }
    return null;
  }
  
  for (const offset of srsData as Array<{x: number; y: number}>) {
    const newX = piece.position.x + offset.x;
    const newY = piece.position.y + offset.y;
    
    if (isValidPosition(grid, piece, newX, newY, newShape)) {
      return { x: newX, y: newY };
    }
  }
  
  return null;
};

const placePiece = (
  grid: (string | null)[][],
  piece: CurrentPiece
): (string | null)[][] => {
  const newGrid = grid.map(row => [...row]);
  
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const x = piece.position.x + col;
        const y = piece.position.y + row;
        
        if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
          newGrid[y][x] = piece.color;
        }
      }
    }
  }
  
  return newGrid;
};

const clearLines = (grid: (string | null)[][]): { newGrid: (string | null)[][]; linesCleared: number } => {
  const newGrid = [];
  let linesCleared = 0;
  
  for (let row = 0; row < GRID_HEIGHT; row++) {
    if (grid[row].every(cell => cell !== null)) {
      linesCleared++;
    } else {
      newGrid.push([...grid[row]]);
    }
  }
  
  // Add empty rows at the top
  while (newGrid.length < GRID_HEIGHT) {
    newGrid.unshift(Array(GRID_WIDTH).fill(null));
  }
  
  return { newGrid, linesCleared };
};

const calculateScore = (linesCleared: number, level: number): number => {
  const baseScores = [0, 40, 100, 300, 1200];
  return baseScores[linesCleared] * (level + 1);
};

export const useTetrisStore = create<TetrisState & TetrisActions>()(
  persist(
    (set, get) => ({
      grid: createEmptyGrid(),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      level: 0,
      lines: 0,
      gameOver: false,
      paused: false,
      highScore: 0,
      asciiMode: true,
      holdPiece: null,
      canHold: true,

      initializeGame: () => {
        const nextPiece = getRandomPiece();
        const currentPiece = createPiece(getRandomPiece());
        
        set({
          grid: createEmptyGrid(),
          currentPiece,
          nextPiece,
          holdPiece: null,
          canHold: true,
          score: 0,
          level: 0,
          lines: 0,
          gameOver: false,
          paused: false,
        });
      },

      movePiece: (direction: 'left' | 'right') => {
        const { grid, currentPiece, gameOver, paused } = get();
        
        if (!currentPiece || gameOver || paused) return;
        
        const deltaX = direction === 'left' ? -1 : 1;
        const newX = currentPiece.position.x + deltaX;
        
        if (isValidPosition(grid, currentPiece, newX, currentPiece.position.y)) {
          set({
            currentPiece: {
              ...currentPiece,
              position: { ...currentPiece.position, x: newX }
            }
          });
        }
      },

      rotatePiece: () => {
        const { grid, currentPiece, gameOver, paused } = get();
        
        if (!currentPiece || gameOver || paused || currentPiece.type === 'O') return;
        
        const newShape = rotatePieceShape(currentPiece.shape);
        const newRotation = getNextRotationState(currentPiece.rotation);
        const newPosition = trySRSRotation(grid, currentPiece, newShape, newRotation);
        
        if (newPosition) {
          set({
            currentPiece: {
              ...currentPiece,
              shape: newShape,
              position: newPosition,
              rotation: newRotation,
            }
          });
        }
      },

      dropPiece: () => {
        const { grid, currentPiece, nextPiece, score, level, lines, highScore } = get();
        
        if (!currentPiece || get().gameOver || get().paused) return;
        
        const newY = currentPiece.position.y + 1;
        
        if (isValidPosition(grid, currentPiece, currentPiece.position.x, newY)) {
          set({
            currentPiece: {
              ...currentPiece,
              position: { ...currentPiece.position, y: newY }
            }
          });
        } else {
          // Piece has landed
          const newGrid = placePiece(grid, currentPiece);
          const { newGrid: clearedGrid, linesCleared } = clearLines(newGrid);
          
          const newLines = lines + linesCleared;
          const newLevel = Math.floor(newLines / 10);
          const newScore = score + calculateScore(linesCleared, level);
          const newHighScore = Math.max(highScore, newScore);
          
           const newCurrentPiece = nextPiece ? createPiece(nextPiece) : null;
           const newNextPiece = getRandomPiece();
           const canHold = true;
           
           // Check for game over
           const gameOver = newCurrentPiece ? 
             !isValidPosition(clearedGrid, newCurrentPiece, newCurrentPiece.position.x, newCurrentPiece.position.y) : 
             true;
           
           set({
             grid: clearedGrid,
             currentPiece: gameOver ? null : newCurrentPiece,
             nextPiece: gameOver ? null : newNextPiece,
             score: newScore,
             level: newLevel,
             lines: newLines,
             gameOver,
             highScore: newHighScore,
             canHold,
           });
        }
      },

      hardDrop: () => {
        const { grid, currentPiece } = get();
        if (!currentPiece || get().gameOver || get().paused) return;
        let newY = currentPiece.position.y;
        while (isValidPosition(grid, currentPiece, currentPiece.position.x, newY + 1)) newY++;
        set({ currentPiece: { ...currentPiece, position: { ...currentPiece.position, y: newY } } });
        setTimeout(() => get().dropPiece(), 0);
      },

      holdSwap: () => {
        const { currentPiece, holdPiece, canHold, nextPiece, grid } = get();
        if (!currentPiece || !canHold) return;
        let incoming: PieceType | null = null;
        if (holdPiece) {
          incoming = holdPiece;
        } else if (nextPiece) {
          incoming = nextPiece;
        } else {
          incoming = getRandomPiece();
        }
        const newHold = currentPiece.type;
        const newCurrent = incoming ? createPiece(incoming) : null;
        const newNext = incoming === nextPiece ? getRandomPiece() : nextPiece;
        if (newCurrent && !isValidPosition(grid, newCurrent, newCurrent.position.x, newCurrent.position.y)) {
          // cannot swap into a valid spawn -> game over
          set({ gameOver: true });
          return;
        }
        set({ currentPiece: newCurrent, holdPiece: newHold, canHold: false, nextPiece: newNext || getRandomPiece() });
      },

      pauseGame: () => {
        set(state => ({ paused: !state.paused }));
      },

      resetGame: () => {
        get().initializeGame();
      },

      toggleAsciiMode: () => {
        set(state => ({ asciiMode: !state.asciiMode }));
      },
    }),
    {
      name: 'tetris-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ highScore: state.highScore, asciiMode: state.asciiMode }),
    }
  )
);
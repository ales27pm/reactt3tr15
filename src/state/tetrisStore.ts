import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PIECE_TYPES, PieceType } from "./tetrominoes";
import {
  CurrentPiece,
  calculateScore,
  clearLines,
  computeDropDistance,
  createEmptyGrid,
  createPiece,
  isValidPosition,
  nextRotationState,
  placePiece,
  rotateShape,
  trySRSRotation,
} from "./engine";

const LOCK_DELAY_MS = 500;

const generateBag = (): PieceType[] => {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

const ensureQueue = (queue: PieceType[], minLen: number = 7): PieceType[] => {
  const q = [...queue];
  while (q.length < minLen) q.push(...generateBag());
  return q;
};

interface _TetrisState {
  grid: (string | null)[][];
  currentPiece: CurrentPiece | null;
  nextQueue: PieceType[]; // head is next piece
  holdPiece: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
  highScore: number;
  asciiMode: boolean;
  combo: number; // successive line clears
  backToBack: boolean; // last clear was Tetris
  lockExpireAt: number | null;
  lastClearedRows: number[] | null;
  lastLockAt: number | null;
  // settings
  toggleGridLines: () => void;
  toggleGhost: () => void;
  toggleHaptics: () => void;
  toggleSfx: () => void;
  toggleSlashTrail: () => void;
  toggleMatrixRain: () => void;
  toggleGlitchFx: () => void;
  setDas: (ms: number) => void;
  setArr: (ms: number) => void;
  hideHints: () => void;
}

export const useTetrisStore = create<any>()(
  persist(
    (set, get) => ({
      grid: createEmptyGrid(),
      currentPiece: null,
      nextQueue: [],
      score: 0,
      level: 0,
      lines: 0,
      gameOver: false,
      paused: false,
      highScore: 0,
      asciiMode: true,
      holdPiece: null,
      canHold: true,
      combo: 0,
      backToBack: false,
      lockExpireAt: null,
      lastClearedRows: null,
      lastLockAt: null,
      // settings defaults
      showGridLines: true,
      showGhost: true,
      enableHaptics: true,
      enableSfx: false,
      slashTrailEnabled: true,
      showHints: true,
      matrixRainEnabled: true,
      glitchFxEnabled: true,
      dasMs: 160,
      arrMs: 40,

      initializeGame: () => {
        const nextQueue = ensureQueue([], 14);
        const first = nextQueue.shift()!;
        const currentPiece = createPiece(first);
        set({
          grid: createEmptyGrid(),
          currentPiece,
          nextQueue,
          holdPiece: null,
          canHold: true,
          score: 0,
          level: 0,
          lines: 0,
          gameOver: false,
          paused: false,
          combo: 0,
          backToBack: false,
          lockExpireAt: null,
          lastClearedRows: null,
          lastLockAt: null,
          matrixRainEnabled: true,
          glitchFxEnabled: true,
          dasMs: 160,
          arrMs: 40,
        });
      },

      movePiece: (direction: "left" | "right") => {
        const { grid, currentPiece, gameOver, paused } = get();
        if (!currentPiece || gameOver || paused) return;
        const dx = direction === "left" ? -1 : 1;
        const nx = currentPiece.position.x + dx;
        if (isValidPosition(grid, currentPiece, nx, currentPiece.position.y)) {
          const np = { ...currentPiece, position: { ...currentPiece.position, x: nx } };
          const onGround = !isValidPosition(grid, np, np.position.x, np.position.y + 1);
          set({ currentPiece: np, lockExpireAt: onGround ? Date.now() + LOCK_DELAY_MS : null });
        }
      },

      rotatePiece: () => {
        const { grid, currentPiece, gameOver, paused } = get();
        if (!currentPiece || gameOver || paused || currentPiece.type === "O") return;
        const newShape = rotateShape(currentPiece.shape);
        const newRot = nextRotationState(currentPiece.rotation);
        const newPos = trySRSRotation(grid, currentPiece, newShape, newRot);
        if (newPos) {
          const np: CurrentPiece = { ...currentPiece, shape: newShape, position: newPos, rotation: newRot };
          const onGround = !isValidPosition(grid, np, np.position.x, np.position.y + 1);
          set({ currentPiece: np, lockExpireAt: onGround ? Date.now() + LOCK_DELAY_MS : null });
        }
      },

      gravityStep: () => {
        const { grid, currentPiece, gameOver, paused, lockExpireAt } = get();
        if (!currentPiece || gameOver || paused) return;
        const ny = currentPiece.position.y + 1;
        if (isValidPosition(grid, currentPiece, currentPiece.position.x, ny)) {
          set({ currentPiece: { ...currentPiece, position: { ...currentPiece.position, y: ny } }, lockExpireAt: null });
        } else {
          if (lockExpireAt == null) {
            set({ lockExpireAt: Date.now() + LOCK_DELAY_MS });
          } else if (Date.now() >= lockExpireAt) {
            // lock and spawn
            lockAndSpawn();
          }
        }
      },

      dropPiece: () => {
        const { grid, currentPiece, gameOver, paused } = get();
        if (!currentPiece || gameOver || paused) return;
        const ny = currentPiece.position.y + 1;
        if (isValidPosition(grid, currentPiece, currentPiece.position.x, ny)) {
          // soft drop bonus +1
          set((s: any) => ({
            currentPiece: { ...currentPiece, position: { ...currentPiece.position, y: ny } },
            score: s.score + 1,
            lockExpireAt: null,
          }));
        } else {
          if (get().lockExpireAt == null) set({ lockExpireAt: Date.now() + LOCK_DELAY_MS });
        }
      },

      hardDrop: () => {
        const { grid, currentPiece, gameOver, paused } = get();
        if (!currentPiece || gameOver || paused) return;
        const dist = computeDropDistance(grid, currentPiece);
        const gy = currentPiece.position.y + dist;
        set((s: any) => ({
          currentPiece: { ...currentPiece, position: { ...currentPiece.position, y: gy } },
          score: s.score + dist * 2,
        }));
        lockAndSpawn();
      },

      holdSwap: () => {
        const { currentPiece, holdPiece, canHold, grid } = get();
        if (!currentPiece || !canHold) return;
        let incoming: PieceType | null = null;
        if (holdPiece) incoming = holdPiece;
        else {
          const q = ensureQueue(get().nextQueue, 7);
          const head = q.shift()!;
          set({ nextQueue: q });
          incoming = head;
        }
        const newHold = currentPiece.type;
        const newCurrent = createPiece(incoming as PieceType);
        if (!isValidPosition(grid, newCurrent, newCurrent.position.x, newCurrent.position.y)) {
          set({ gameOver: true });
          return;
        }
        set({ currentPiece: newCurrent, holdPiece: newHold, canHold: false, lockExpireAt: null });
      },

      pauseGame: () => set((s: any) => ({ paused: !s.paused })),

      resetGame: () => get().initializeGame(),

      toggleAsciiMode: () => set((s: any) => ({ asciiMode: !s.asciiMode })),

      // settings
      toggleGridLines: () => set((s: any) => ({ showGridLines: !s.showGridLines })),
      toggleGhost: () => set((s: any) => ({ showGhost: !s.showGhost })),
      toggleHaptics: () => set((s: any) => ({ enableHaptics: !s.enableHaptics })),
      toggleSfx: () => set((s: any) => ({ enableSfx: !s.enableSfx })),
      toggleSlashTrail: () => set((s: any) => ({ slashTrailEnabled: !s.slashTrailEnabled })),
      toggleMatrixRain: () => set((s: any) => ({ matrixRainEnabled: !s.matrixRainEnabled })),
      toggleGlitchFx: () => set((s: any) => ({ glitchFxEnabled: !s.glitchFxEnabled })),
      setDas: (ms: number) => set(() => ({ dasMs: Math.max(50, Math.min(ms, 300)) })),
      setArr: (ms: number) => set(() => ({ arrMs: Math.max(10, Math.min(ms, 200)) })),
      hideHints: () => set(() => ({ showHints: false })),
    }),
    {
      name: "tetris-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        highScore: state.highScore,
        asciiMode: state.asciiMode,
        showGridLines: state.showGridLines,
        showGhost: state.showGhost,
        enableHaptics: state.enableHaptics,
        enableSfx: state.enableSfx,
        slashTrailEnabled: state.slashTrailEnabled,
        showHints: state.showHints,
        matrixRainEnabled: state.matrixRainEnabled,
        glitchFxEnabled: state.glitchFxEnabled,
        dasMs: state.dasMs,
        arrMs: state.arrMs,
      }),
    },
  ),
);

// Internal helper that reads/writes store state directly
function lockAndSpawn() {
  const { grid, currentPiece, lines, level, score, highScore, nextQueue } = useTetrisStore.getState();
  if (!currentPiece) return;
  const placed = placePiece(grid, currentPiece);
  const { newGrid, linesCleared, clearedRows } = clearLines(placed);

  // scoring
  let add = calculateScore(linesCleared, level);
  let combo = useTetrisStore.getState().combo;
  let b2b = useTetrisStore.getState().backToBack;
  if (linesCleared > 0) {
    combo = combo + 1;
    if (combo > 1) add += (combo - 1) * 50;
    if (linesCleared === 4) {
      if (b2b) add += Math.floor(add * 0.5);
      b2b = true;
    } else {
      b2b = false;
    }
  } else {
    combo = 0;
  }

  const newLines = lines + linesCleared;
  const newLevel = Math.floor(newLines / 10);
  let q = ensureQueue(nextQueue, 7);
  const head = q.shift()!;
  const newCurrent = createPiece(head);
  const over = !isValidPosition(newGrid, newCurrent, newCurrent.position.x, newCurrent.position.y);

  useTetrisStore.setState({
    grid: newGrid,
    currentPiece: over ? null : newCurrent,
    nextQueue: q,
    lines: newLines,
    level: newLevel,
    score: score + add,
    highScore: Math.max(highScore, score + add),
    canHold: true,
    lockExpireAt: null,
    lastClearedRows: linesCleared > 0 ? clearedRows : null,
    lastLockAt: Date.now(),
    combo,
    backToBack: b2b,
    gameOver: over,
  });
}

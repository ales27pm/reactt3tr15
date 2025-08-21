import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PIECE_TYPES, PieceType, ALT_COLORS } from "./tetrominoes";
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
  isTSpin,
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

interface TetrisState {
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
  backToBack: boolean; // last clear was Tetris or T‑Spin
  lockExpireAt: number | null;
  lastAction: "move" | "rotate";
  // settings
  showGridLines: boolean;
  showGhost: boolean;
  enableHaptics: boolean;
  slashTrailEnabled: boolean;
  showHints: boolean;
  dasMs: number;
  arrMs: number;
  colorblindPalette: boolean;
}

interface TetrisActions {
  initializeGame: () => void;
  movePiece: (direction: "left" | "right") => void;
  rotatePiece: () => void;
  gravityStep: () => void;
  dropPiece: () => void; // soft drop one cell (user)
  hardDrop: () => void;
  holdSwap: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  toggleAsciiMode: () => void;
  // settings toggles
  toggleGridLines: () => void;
  toggleGhost: () => void;
  toggleHaptics: () => void;
  toggleSlashTrail: () => void;
  hideHints: () => void;
  toggleColorblind: () => void;
  incDas: () => void;
  decDas: () => void;
  incArr: () => void;
  decArr: () => void;
}

export const useTetrisStore = create<TetrisState & TetrisActions>()(
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
      lastAction: "move",
      // settings defaults
      showGridLines: true,
      showGhost: true,
      enableHaptics: true,
      slashTrailEnabled: true,
      showHints: true,
      dasMs: 170,
      arrMs: 30,
      colorblindPalette: false,

      initializeGame: () => {
        const nextQueue = ensureQueue([], 14);
        const first = nextQueue.shift()!;
        let currentPiece = createPiece(first);
        if (get().colorblindPalette) currentPiece = { ...currentPiece, color: ALT_COLORS[currentPiece.type] };
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
          set({ currentPiece: np, lockExpireAt: onGround ? Date.now() + LOCK_DELAY_MS : null, lastAction: "move" });
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
          set({ currentPiece: np, lockExpireAt: onGround ? Date.now() + LOCK_DELAY_MS : null, lastAction: "move" });
        }
      },

      gravityStep: () => {
        const { grid, currentPiece, gameOver, paused, lockExpireAt } = get();
        if (!currentPiece || gameOver || paused) return;
        const ny = currentPiece.position.y + 1;
        if (isValidPosition(grid, currentPiece, currentPiece.position.x, ny)) {
          set({ currentPiece: { ...currentPiece, position: { ...currentPiece.position, y: ny } }, lockExpireAt: null, lastAction: "move" });
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
          set((state) => ({
            currentPiece: { ...currentPiece, position: { ...currentPiece.position, y: ny } },
            score: state.score + 1,
            lockExpireAt: null,
            lastAction: "move",
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
        set((state) => ({
          currentPiece: { ...currentPiece, position: { ...currentPiece.position, y: gy } },
          score: state.score + dist * 2,
          lastAction: "move",
        }));
        lockAndSpawn();
      },

      holdSwap: () => {
        const { currentPiece, holdPiece, canHold, grid } = get();
        if (!currentPiece || !canHold) return;
        let incoming: PieceType | null = null;
        if (holdPiece) incoming = holdPiece; else {
          const q = ensureQueue(get().nextQueue, 7);
          const head = q.shift()!;
          set({ nextQueue: q });
          incoming = head;
        }
        const newHold = currentPiece.type;
        let newCurrent = createPiece(incoming);
        if (get().colorblindPalette) newCurrent = { ...newCurrent, color: ALT_COLORS[newCurrent.type] };
        if (!isValidPosition(grid, newCurrent, newCurrent.position.x, newCurrent.position.y)) {
          set({ gameOver: true });
          return;
        }
        set({ currentPiece: newCurrent, holdPiece: newHold, canHold: false, lockExpireAt: null });
      },

      pauseGame: () => set((s) => ({ paused: !s.paused })),

      resetGame: () => get().initializeGame(),

      toggleAsciiMode: () => set((s) => ({ asciiMode: !s.asciiMode })),

      // settings
      toggleGridLines: () => set((s) => ({ showGridLines: !s.showGridLines })),
      toggleGhost: () => set((s) => ({ showGhost: !s.showGhost })),
      toggleHaptics: () => set((s) => ({ enableHaptics: !s.enableHaptics })),
      toggleSlashTrail: () => set((s) => ({ slashTrailEnabled: !s.slashTrailEnabled })),
      hideHints: () => set(() => ({ showHints: false })),
      toggleColorblind: () => set((s) => ({ colorblindPalette: !s.colorblindPalette })),
      incDas: () => set((s) => ({ dasMs: Math.min(500, s.dasMs + 10) })),
      decDas: () => set((s) => ({ dasMs: Math.max(50, s.dasMs - 10) })),
      incArr: () => set((s) => ({ arrMs: Math.min(200, s.arrMs + 5) })),
      decArr: () => set((s) => ({ arrMs: Math.max(10, s.arrMs - 5) })),
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
        slashTrailEnabled: state.slashTrailEnabled,
        showHints: state.showHints,
        dasMs: state.dasMs,
        arrMs: state.arrMs,
        colorblindPalette: state.colorblindPalette,
      }),
    }
  )
);

// Internal helper that reads/writes store state directly
function lockAndSpawn() {
  const { grid, currentPiece, lines, level, score, highScore, nextQueue, lastAction } = useTetrisStore.getState();
  if (!currentPiece) return;
  // T‑Spin detection before locking
  const didTSpin = currentPiece.type === "T" && lastAction === "rotate" && isTSpin(grid, currentPiece);

  const placed = placePiece(grid, currentPiece);
  const { newGrid, linesCleared } = clearLines(placed);

  // scoring
  let combo = useTetrisStore.getState().combo;
  let b2b = useTetrisStore.getState().backToBack;
  let add = 0;
  if (linesCleared > 0) {
    combo = combo + 1;
    if (didTSpin) {
      const tSpinBase: Record<number, number> = { 1: 800, 2: 1200, 3: 1600 };
      add += (tSpinBase[linesCleared] || 0) * (level + 1);
      if (b2b) add += Math.floor(add * 0.5);
      b2b = true;
    } else {
      add += calculateScore(linesCleared, level);
      if (linesCleared === 4) {
        if (b2b) add += Math.floor(add * 0.5);
        b2b = true;
      } else {
        b2b = false;
      }
    }
    if (combo > 1) add += (combo - 1) * 50;
  } else {
    combo = 0;
    // T‑Spin no lines could optionally score; skipping to keep simple
  }

  const newLines = lines + linesCleared;
  const newLevel = Math.floor(newLines / 10);
  let q = ensureQueue(nextQueue, 7);
  const head = q.shift()!;
  let newCurrent = createPiece(head);
  if (useTetrisStore.getState().colorblindPalette) newCurrent = { ...newCurrent, color: ALT_COLORS[newCurrent.type] };
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
    combo,
    backToBack: b2b,
    gameOver: over,
  });
}

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logWarn } from "../utils/logger";
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

export const LOCK_DELAY_MS = 500;

export type DifficultyTier = "Chill" | "Steady" | "Intense" | "Overdrive";

const MAX_LEVEL = 29;
const LEVEL_POINTS_PER_LEVEL = 12;
const LINE_CLEAR_WEIGHTS = [0, 2, 5, 8, 12];
const COMBO_WEIGHT = 1.25;
const SURVIVAL_BONUS = 0.25;

/**
 * Difficulty tier thresholds.
 * Update these values to change tier definitions globally.
 */
export const DIFFICULTY_TIER_THRESHOLDS = {
  overdrive: 12,
  intense: 7,
  steady: 3,
} as const;

export const MAX_COMBO_COUNT = 40;
const MIN_LOCK_DURATION_MS = 0;
export const MAX_LOCK_DURATION_MS = LOCK_DELAY_MS * 6;

export interface DifficultyProgressInput {
  readonly previousProgress: number;
  readonly linesCleared: number;
  readonly comboCount: number;
  readonly lockDurationMs: number;
}

export interface DifficultyProgressSnapshot {
  readonly progress: number;
  readonly level: number;
  readonly delta: number;
  readonly tier: DifficultyTier;
}

export const resolveDifficultyTier = (level: number): DifficultyTier => {
  if (level >= DIFFICULTY_TIER_THRESHOLDS.overdrive) return "Overdrive";
  if (level >= DIFFICULTY_TIER_THRESHOLDS.intense) return "Intense";
  if (level >= DIFFICULTY_TIER_THRESHOLDS.steady) return "Steady";
  return "Chill";
};

export const calculateDifficultyProgress = ({
  previousProgress,
  linesCleared,
  comboCount,
  lockDurationMs,
}: DifficultyProgressInput): DifficultyProgressSnapshot => {
  const clampedLines = Math.max(0, Math.min(linesCleared, LINE_CLEAR_WEIGHTS.length - 1));
  const safeComboCount = Math.min(Math.max(comboCount, 0), MAX_COMBO_COUNT);
  const normalizedLockDuration = Math.min(Math.max(lockDurationMs, MIN_LOCK_DURATION_MS), MAX_LOCK_DURATION_MS);
  const base = LINE_CLEAR_WEIGHTS[clampedLines];
  const comboBonus = clampedLines > 0 ? Math.max(safeComboCount - 1, 0) * COMBO_WEIGHT : 0;
  let lockBonus = 0;
  if (normalizedLockDuration <= LOCK_DELAY_MS) lockBonus = 1.5;
  else if (normalizedLockDuration <= LOCK_DELAY_MS * 2) lockBonus = 1;
  else if (normalizedLockDuration <= LOCK_DELAY_MS * 3) lockBonus = 0.5;
  const survivalBonus = clampedLines === 0 ? SURVIVAL_BONUS : 0;
  const delta = base + comboBonus + lockBonus + survivalBonus;
  const progress = previousProgress + delta;
  const level = Math.min(MAX_LEVEL, Math.floor(progress / LEVEL_POINTS_PER_LEVEL));
  const tier = resolveDifficultyTier(level);
  return { progress, level, delta, tier };
};

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
  difficultyProgress: number;
  activePieceSpawnedAt: number | null;
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
      difficultyProgress: 0,
      activePieceSpawnedAt: null,
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
        const now = Date.now();
        set({
          grid: createEmptyGrid(),
          currentPiece,
          nextQueue,
          holdPiece: null,
          canHold: true,
          score: 0,
          level: 0,
          lines: 0,
          difficultyProgress: 0,
          activePieceSpawnedAt: now,
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
        set({
          currentPiece: newCurrent,
          holdPiece: newHold,
          canHold: false,
          lockExpireAt: null,
          activePieceSpawnedAt: Date.now(),
        });
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
  const { grid, currentPiece, lines, level, score, highScore, nextQueue, difficultyProgress, activePieceSpawnedAt } =
    useTetrisStore.getState();
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
  const now = Date.now();
  let spawnAt: number;
  if (activePieceSpawnedAt == null) {
    const fallback = now - LOCK_DELAY_MS * 4;
    if (process.env.NODE_ENV !== "production") {
      logWarn(
        "activePieceSpawnedAt was not set, using fallback value.",
        { context: "Tetris" },
        {
          now,
          fallback,
        },
      );
    }
    spawnAt = fallback;
  } else {
    spawnAt = activePieceSpawnedAt;
  }
  const lockDuration = Math.max(0, now - spawnAt);
  const difficultySnapshot = calculateDifficultyProgress({
    previousProgress: difficultyProgress,
    linesCleared,
    comboCount: combo,
    lockDurationMs: lockDuration,
  });
  let q = ensureQueue(nextQueue, 7);
  const head = q.shift()!;
  const newCurrent = createPiece(head);
  const over = !isValidPosition(newGrid, newCurrent, newCurrent.position.x, newCurrent.position.y);

  useTetrisStore.setState({
    grid: newGrid,
    currentPiece: over ? null : newCurrent,
    nextQueue: q,
    lines: newLines,
    level: difficultySnapshot.level,
    difficultyProgress: difficultySnapshot.progress,
    score: score + add,
    highScore: Math.max(highScore, score + add),
    canHold: true,
    lockExpireAt: null,
    lastClearedRows: linesCleared > 0 ? clearedRows : null,
    lastLockAt: now,
    combo,
    backToBack: b2b,
    activePieceSpawnedAt: over ? null : now,
    gameOver: over,
  });
}

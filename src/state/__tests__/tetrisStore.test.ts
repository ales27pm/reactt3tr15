import {
  LOCK_DELAY_MS,
  MAX_COMBO_COUNT,
  MAX_LOCK_DURATION_MS,
  calculateDifficultyProgress,
  resolveDifficultyTier,
  useTetrisStore,
} from "../tetrisStore";
import * as logger from "../../utils/logger";

describe("calculateDifficultyProgress", () => {
  it("rewards aggressive clears and combos", () => {
    const result = calculateDifficultyProgress({
      previousProgress: 0,
      linesCleared: 2,
      comboCount: 3,
      lockDurationMs: 200,
    });

    expect(result.delta).toBeCloseTo(9);
    expect(result.progress).toBeCloseTo(9);
    expect(result.level).toBe(0);
    expect(result.tier).toBe("Chill");
  });

  it("crosses level thresholds when progress accumulates", () => {
    const result = calculateDifficultyProgress({
      previousProgress: 11,
      linesCleared: 1,
      comboCount: 2,
      lockDurationMs: 400,
    });

    expect(result.level).toBe(1);
    expect(result.progress).toBeCloseTo(15.75);
    expect(result.tier).toBe(resolveDifficultyTier(1));
  });

  it("clamps invalid combo and lock inputs", () => {
    const largeValues = calculateDifficultyProgress({
      previousProgress: 0,
      linesCleared: 3,
      comboCount: MAX_COMBO_COUNT + 50,
      lockDurationMs: MAX_LOCK_DURATION_MS * 3,
    });

    const expected = calculateDifficultyProgress({
      previousProgress: 0,
      linesCleared: 3,
      comboCount: MAX_COMBO_COUNT,
      lockDurationMs: MAX_LOCK_DURATION_MS,
    });

    expect(largeValues.delta).toBeCloseTo(expected.delta);
  });

  it("ignores negative combo and lock values", () => {
    const sanitized = calculateDifficultyProgress({
      previousProgress: 0,
      linesCleared: 1,
      comboCount: -5,
      lockDurationMs: -250,
    });

    const baseline = calculateDifficultyProgress({
      previousProgress: 0,
      linesCleared: 1,
      comboCount: 0,
      lockDurationMs: 0,
    });

    expect(sanitized.delta).toBeCloseTo(baseline.delta);
  });
});

describe("tetris store difficulty integration", () => {
  let now = 0;
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    now = 0;
    nowSpy = jest.spyOn(Date, "now").mockImplementation(() => now);
    useTetrisStore.getState().initializeGame();
  });

  afterEach(() => {
    now = 0;
    useTetrisStore.getState().initializeGame();
    nowSpy.mockRestore();
  });

  it("awards more progress for fast locks than slow locks", () => {
    now = LOCK_DELAY_MS - 100;
    useTetrisStore.getState().hardDrop();
    const fastProgress = useTetrisStore.getState().difficultyProgress;

    now = 0;
    useTetrisStore.getState().initializeGame();
    now = LOCK_DELAY_MS * 4;
    useTetrisStore.getState().hardDrop();
    const slowProgress = useTetrisStore.getState().difficultyProgress;

    expect(fastProgress).toBeCloseTo(1.75);
    expect(slowProgress).toBeCloseTo(0.25);
    expect(fastProgress).toBeGreaterThan(slowProgress);
  });

  it("warns when falling back to a synthetic spawn timestamp", () => {
    const warnSpy = jest.spyOn(logger, "logWarn").mockImplementation(() => {});
    try {
      useTetrisStore.setState({ activePieceSpawnedAt: null });

      now = LOCK_DELAY_MS * 2;
      useTetrisStore.getState().hardDrop();

      expect(warnSpy).toHaveBeenCalledWith(
        "activePieceSpawnedAt was not set, using fallback value.",
        { context: "Tetris" },
        { now, fallback: now - LOCK_DELAY_MS * 4 },
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});

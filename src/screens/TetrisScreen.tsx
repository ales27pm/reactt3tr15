import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Vibration,
  Platform,
  PixelRatio,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector, Directions } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyleProp,
} from "react-native-reanimated";
import { resolveDifficultyTier, useTetrisStore } from "../state/tetrisStore";
import { PIECES, GRID_WIDTH, GRID_HEIGHT } from "../state/tetrominoes";
import { ghostDropY } from "../state/engine";
import { getGlyphForColor } from "../utils/ascii";
import MinimalModal from "../components/MinimalModal";
import SlashTrail, { Point as SlashPoint } from "../components/SlashTrail";
import { playSfx, setSfxEnabled } from "../utils/sfx";
import MatrixRain from "../components/MatrixRain";
import { useMainLoop } from "../mainLoop/useMainLoop";

const { width } = Dimensions.get("window");
const BLOCK_SIZE = Math.min(width * 0.05, 20);
const CELL = PixelRatio.roundToNearestPixel(BLOCK_SIZE);
const PLAY_WIDTH = CELL * GRID_WIDTH;
const PLAY_HEIGHT = CELL * GRID_HEIGHT;

// Terminal colors
const TERMINAL_GREEN = "#00FF00";
const TERMINAL_DARK_GREEN = "#00AA00";
const TERMINAL_BG = "#000";

export default function TetrisScreen() {
  const insets = useSafeAreaInsets();
  const [demoErrorVisible, setDemoErrorVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Selectors (narrow to reduce re-renders)
  const grid = useTetrisStore((s) => s.grid);
  const currentPiece = useTetrisStore((s) => s.currentPiece);
  const nextQueue = useTetrisStore((s) => s.nextQueue);
  const holdPiece = useTetrisStore((s) => s.holdPiece);
  const canHold = useTetrisStore((s) => s.canHold);
  const score = useTetrisStore((s) => s.score);
  const level = useTetrisStore((s) => s.level);
  const difficultyTier = useTetrisStore((s) => resolveDifficultyTier(s.level));
  const lines = useTetrisStore((s) => s.lines);
  const gameOver = useTetrisStore((s) => s.gameOver);
  const paused = useTetrisStore((s) => s.paused);
  const asciiMode = useTetrisStore((s) => s.asciiMode);
  const showGridLines = useTetrisStore((s) => s.showGridLines);
  const showGhost = useTetrisStore((s) => s.showGhost);
  const enableHaptics = useTetrisStore((s) => s.enableHaptics);
  const slashTrailEnabled = useTetrisStore((s) => s.slashTrailEnabled);
  const showHints = useTetrisStore((s) => s.showHints);
  const lastClearedRows = useTetrisStore((s) => s.lastClearedRows);
  const lastLockAt = useTetrisStore((s) => s.lastLockAt);
  const enableSfx = useTetrisStore((s) => s.enableSfx);
  const matrixRainEnabled = useTetrisStore((s) => s.matrixRainEnabled);
  const glitchFxEnabled = useTetrisStore((s) => s.glitchFxEnabled);

  const initializeGame = useTetrisStore((s) => s.initializeGame);
  const movePiece = useTetrisStore((s) => s.movePiece);
  const rotatePiece = useTetrisStore((s) => s.rotatePiece);
  const gravityStep = useTetrisStore((s) => s.gravityStep);
  const dropPiece = useTetrisStore((s) => s.dropPiece);
  const hardDrop = useTetrisStore((s) => s.hardDrop);
  const holdSwap = useTetrisStore((s) => s.holdSwap);
  const pauseGame = useTetrisStore((s) => s.pauseGame);
  const resetGame = useTetrisStore((s) => s.resetGame);
  const toggleAsciiMode = useTetrisStore((s) => s.toggleAsciiMode);
  const toggleGridLines = useTetrisStore((s) => s.toggleGridLines);
  const toggleGhost = useTetrisStore((s) => s.toggleGhost);
  const toggleHaptics = useTetrisStore((s) => s.toggleHaptics);
  const toggleSlashTrail = useTetrisStore((s) => s.toggleSlashTrail);
  const toggleSfx = useTetrisStore((s) => s.toggleSfx);
  const toggleMatrixRain = useTetrisStore((s) => s.toggleMatrixRain);
  const toggleGlitchFx = useTetrisStore((s) => s.toggleGlitchFx);
  const setDas = useTetrisStore((s) => s.setDas);
  const setArr = useTetrisStore((s) => s.setArr);
  const hideHints = useTetrisStore((s) => s.hideHints);
  const { sessionCount, streak } = useMainLoop();

  // Start
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // RAF gravity loop with lock delay in store
  const rafId = useRef<number | null>(null);
  const lastTs = useRef<number>(0);
  const acc = useRef<number>(0);
  const intervalRef = useRef<number>(1000);

  useEffect(() => {
    intervalRef.current = Math.max(50, 1000 - level * 50);
  }, [level]);

  useEffect(() => {
    const loop = (ts: number) => {
      if (rafId.current == null) return; // stopped
      if (gameOver || paused) {
        rafId.current = requestAnimationFrame(loop);
        lastTs.current = ts;
        return;
      }
      if (lastTs.current === 0) lastTs.current = ts;
      const dt = ts - lastTs.current;
      lastTs.current = ts;
      acc.current += dt;
      while (acc.current >= intervalRef.current) {
        gravityStep();
        acc.current -= intervalRef.current;
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
      lastTs.current = 0;
      acc.current = 0;
    };
  }, [gravityStep, gameOver, paused]);

  const handleMove = useCallback(
    (direction: "left" | "right") => {
      if (!gameOver && !paused) {
        movePiece(direction);
        if (Platform.OS === "ios") Vibration.vibrate(10);
        if (enableSfx) playSfx("move");
      }
    },
    [gameOver, paused, movePiece, enableSfx],
  );

  const handleRotate = useCallback(() => {
    if (!gameOver && !paused) {
      rotatePiece();
      if (Platform.OS === "ios") Vibration.vibrate(10);
      if (enableSfx) playSfx("rotate");
    }
  }, [gameOver, paused, rotatePiece, enableSfx]);

  const handleDrop = useCallback(() => {
    if (!gameOver && !paused) {
      dropPiece();
      if (enableSfx) playSfx("soft");
    }
  }, [gameOver, paused, dropPiece, enableSfx]);

  const handleHardDrop = useCallback(() => {
    if (!gameOver && !paused) {
      hardDrop();
      if (Platform.OS === "ios") Vibration.vibrate(50);
      if (enableSfx) playSfx("hard");
    }
  }, [gameOver, paused, hardDrop, enableSfx]);

  // Haptics helpers (called from JS via runOnJS)
  const hapticLight = () => {
    if (enableHaptics && Platform.OS === "ios") Vibration.vibrate(8);
  };
  const hapticMedium = () => {
    if (enableHaptics && Platform.OS === "ios") Vibration.vibrate(10);
  };
  const hapticStrong = () => {
    if (enableHaptics && Platform.OS === "ios") Vibration.vibrate(50);
  };

  // Shared flags to avoid worklet reading React state directly
  const pausedSV = useSharedValue(paused ? 1 : 0);
  const gameOverSV = useSharedValue(gameOver ? 1 : 0);
  const slashActiveSV = useSharedValue(0);
  const lineFlash = useSharedValue(0);
  const borderPulse = useSharedValue(0);
  const glitchSV = useSharedValue(0);
  const scanY = useSharedValue(-20);
  const headerBlink = useSharedValue(0);
  useEffect(() => {
    headerBlink.value = withTiming(1, { duration: 600, easing: Easing.linear }, () => {
      headerBlink.value = 0;
    });
  }, [headerBlink]);
  useEffect(() => {
    pausedSV.value = paused ? 1 : 0;
  }, [paused, pausedSV]);
  useEffect(() => {
    gameOverSV.value = gameOver ? 1 : 0;
  }, [gameOver, gameOverSV]);
  useEffect(() => {
    setSfxEnabled(enableSfx);
  }, [enableSfx]);
  useEffect(() => {
    if (lastClearedRows && lastClearedRows.length > 0) {
      lineFlash.value = 1;
      glitchSV.value = 1;
      lineFlash.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
      glitchSV.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
      if (enableSfx) playSfx("line");
    }
  }, [lastClearedRows, enableSfx, glitchSV, lineFlash]);
  useEffect(() => {
    if (lastLockAt) {
      borderPulse.value = 1;
      borderPulse.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
      scanY.value = -20;
      scanY.value = withTiming(PLAY_HEIGHT + 40, { duration: 220, easing: Easing.out(Easing.cubic) });
      if (enableSfx) playSfx("lock");
    }
  }, [lastLockAt, enableSfx, borderPulse, scanY]);
  useEffect(() => {
    if (gameOver && enableSfx) playSfx("gameover");
  }, [gameOver, enableSfx]);

  // Slash trail state and registration
  const [isSlashActive, setIsSlashActive] = useState(false);
  const slashInitialPoint = useRef<SlashPoint | null>(null);
  const addSlashPointRef = useRef<((p: SlashPoint) => void) | null>(null);
  const registerAddPoint = useCallback((fn: (p: SlashPoint) => void) => {
    addSlashPointRef.current = fn;
  }, []);
  const startSlash = useCallback((p: SlashPoint) => {
    setIsSlashActive(true);
    slashInitialPoint.current = p;
  }, []);
  const stopSlash = useCallback(() => {
    setIsSlashActive(false);
    slashInitialPoint.current = null;
  }, []);
  const addSlashPointJS = useCallback((p: SlashPoint) => {
    addSlashPointRef.current?.(p);
  }, []);

  // Gestures
  const accX = useSharedValue(0);
  const accY = useSharedValue(0);
  const lastTX = useSharedValue(0);
  const lastTY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin((e) => {
      slashActiveSV.value = 1;
      const p = { x: e.x, y: e.y, timestamp: Date.now() };
      runOnJS(startSlash)(p);
      runOnJS(addSlashPointJS)(p);
      accX.value = 0;
      accY.value = 0;
      lastTX.value = 0;
      lastTY.value = 0;
    })
    .onUpdate((e) => {
      if (pausedSV.value || gameOverSV.value) return;
      // slash trail
      runOnJS(addSlashPointJS)({ x: e.x, y: e.y, timestamp: Date.now() });
      // movement
      const dx = e.translationX - lastTX.value;
      const dy = e.translationY - lastTY.value;
      lastTX.value = e.translationX;
      lastTY.value = e.translationY;
      accX.value += dx;
      while (accX.value >= CELL) {
        runOnJS(movePiece)("right");
        accX.value -= CELL;
        runOnJS(hapticLight)();
        runOnJS(playSfx)("move");
      }
      while (accX.value <= -CELL) {
        runOnJS(movePiece)("left");
        accX.value += CELL;
        runOnJS(hapticLight)();
        runOnJS(playSfx)("move");
      }
      accY.value += dy;
      while (accY.value >= CELL) {
        runOnJS(dropPiece)();
        runOnJS(hapticLight)();
        runOnJS(playSfx)("soft");
        accY.value -= CELL;
      }
    })
    .onEnd(() => {
      accX.value = 0;
      accY.value = 0;
      lastTX.value = 0;
      lastTY.value = 0;
      slashActiveSV.value = 0;
      runOnJS(stopSlash)();
    });

  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd(() => {
      if (pausedSV.value || gameOverSV.value || slashActiveSV.value) return;
      runOnJS(rotatePiece)();
      runOnJS(hapticMedium)();
      runOnJS(playSfx)("rotate");
    });
  const flingUp = Gesture.Fling()
    .direction(Directions.UP)
    .onEnd(() => {
      if (pausedSV.value || gameOverSV.value) return;
      runOnJS(hardDrop)();
      runOnJS(hapticStrong)();
    });
  const flingDown = Gesture.Fling()
    .direction(Directions.DOWN)
    .onEnd(() => {
      if (pausedSV.value || gameOverSV.value) return;
      runOnJS(dropPiece)();
      runOnJS(hapticLight)();
    });

  tap.requireExternalGestureToFail(pan, flingUp, flingDown);

  const composedGesture = Gesture.Exclusive(pan, flingUp, flingDown, tap);

  const gridAnimatedStyle = useAnimatedStyle(() => {
    return {
      shadowRadius: 8 + borderPulse.value * 12,
      shadowOpacity: 0.3 + borderPulse.value * 0.4,
    } as const;
  });

  const lineFlashStyle = useAnimatedStyle(() => ({ opacity: lineFlash.value * 0.7 }));

  const scanlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: 0.25,
  }));

  const renderAsciiGhost = () => {
    if (!currentPiece) return null;
    const gy = ghostDropY(grid, currentPiece);
    if (gy <= currentPiece.position.y) return null;
    const items: any[] = [];
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          items.push(
            <Text
              key={`g-${r}-${c}`}
              style={[
                styles.asciiGlyph,
                {
                  left: (currentPiece.position.x + c) * CELL,
                  top: (gy + r) * CELL,
                  width: CELL,
                  height: CELL,
                  lineHeight: CELL,
                  fontSize: Math.floor(CELL * 0.9),
                  opacity: 0.25,
                },
              ]}
              allowFontScaling={false}
            >
              {getGlyphForColor(currentPiece.color, currentPiece.position.x + c, gy + r)}
            </Text>,
          );
        }
      }
    }
    return items;
  };

  const renderGhostClassic = () => {
    if (!currentPiece) return null;
    const gy = ghostDropY(grid, currentPiece);
    if (gy <= currentPiece.position.y) return null;
    const items: any[] = [];
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          items.push(
            <View
              key={`gc-${r}-${c}`}
              style={{
                position: "absolute",
                left: (currentPiece.position.x + c) * CELL,
                top: (gy + r) * CELL,
                width: CELL,
                height: CELL,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: TERMINAL_DARK_GREEN,
                opacity: 0.4,
              }}
            />,
          );
        }
      }
    }
    return items;
  };

  const renderGrid = () => {
    const cells: any[] = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const cellValue = grid[row]?.[col] || 0;
        const isCurrentPiece =
          currentPiece &&
          row >= currentPiece.position.y &&
          row < currentPiece.position.y + currentPiece.shape.length &&
          col >= currentPiece.position.x &&
          col < currentPiece.position.x + currentPiece.shape[0].length &&
          currentPiece.shape[row - currentPiece.position.y]?.[col - currentPiece.position.x];
        cells.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.cell,
              {
                backgroundColor: isCurrentPiece ? currentPiece.color : cellValue ? cellValue : TERMINAL_BG,
              },
            ]}
          />,
        );
      }
    }
    return cells;
  };

  type GlitchRowOverlayProps = {
    row: number;
    glitchSV: Animated.SharedValue<number>;
    lineFlashStyle: AnimatedStyleProp<ViewStyle>;
    glitchFxEnabled: boolean;
  };

  const GlitchRowOverlay = ({ row, glitchSV, lineFlashStyle, glitchFxEnabled }: GlitchRowOverlayProps) => {
    const rowStyle = useAnimatedStyle(
      () => ({
        transform: [{ translateX: glitchSV.value * (((row * 13) % 5) - 2) }],
      }),
      [glitchSV, row],
    );

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: 0,
            top: row * CELL,
            width: PLAY_WIDTH,
            height: CELL,
            backgroundColor: TERMINAL_GREEN,
          },
          lineFlashStyle,
          glitchFxEnabled ? rowStyle : null,
        ]}
      />
    );
  };

  const renderAsciiBoard = () => {
    const items: any[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        let glyphColor: string | null = grid[y]?.[x] || null;
        if (
          currentPiece &&
          y >= currentPiece.position.y &&
          y < currentPiece.position.y + currentPiece.shape.length &&
          x >= currentPiece.position.x &&
          x < currentPiece.position.x + currentPiece.shape[0].length &&
          currentPiece.shape[y - currentPiece.position.y]?.[x - currentPiece.position.x]
        ) {
          glyphColor = currentPiece.color;
        }
        if (glyphColor) {
          items.push(
            <Text
              key={`a-${y}-${x}`}
              style={[
                styles.asciiGlyph,
                {
                  left: x * CELL,
                  top: y * CELL,
                  width: CELL,
                  height: CELL,
                  lineHeight: CELL,
                  fontSize: Math.floor(CELL * 0.9),
                },
              ]}
              allowFontScaling={false}
            >
              {getGlyphForColor(glyphColor, x, y)}
            </Text>,
          );
        }
      }
    }
    return items;
  };

  const renderGridLines = () => {
    const linesV = Array.from({ length: GRID_WIDTH - 1 }).map((_, i) => (
      <View key={`v-${i + 1}`} style={[styles.gridLineV, { left: (i + 1) * CELL, height: PLAY_HEIGHT }]} />
    ));
    const linesH = Array.from({ length: GRID_HEIGHT - 1 }).map((_, j) => (
      <View key={`h-${j + 1}`} style={[styles.gridLineH, { top: (j + 1) * CELL, width: PLAY_WIDTH }]} />
    ));
    return (
      <>
        {linesV}
        {linesH}
      </>
    );
  };

  const renderMiniPiece = (type: keyof typeof PIECES, scale = 0.6) => {
    const shape = PIECES[type].shape;
    if (asciiMode) {
      const mini = Math.round(BLOCK_SIZE * scale);
      const glyph = getGlyphForColor(PIECES[type].color);
      const items: any[] = [];
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            items.push(
              <Text
                key={`mini-${type}-${r}-${c}`}
                style={[
                  styles.asciiGlyph,
                  {
                    left: c * mini,
                    top: r * mini,
                    width: mini,
                    height: mini,
                    lineHeight: mini,
                    fontSize: Math.floor(mini * 0.9),
                  },
                ]}
                allowFontScaling={false}
              >
                {glyph}
              </Text>,
            );
          }
        }
      }
      return items;
    }
    const cells: any[] = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          cells.push(
            <View
              key={`mini-${type}-${r}-${c}`}
              style={[
                styles.nextCell,
                { backgroundColor: PIECES[type].color, left: c * (BLOCK_SIZE * scale), top: r * (BLOCK_SIZE * scale) },
              ]}
            />,
          );
        }
      }
    }
    return cells;
  };

  const renderNextQueue = () => {
    const show = nextQueue.slice(0, 5);
    return (
      <View style={{ gap: 10 }}>
        <Text style={styles.nextTitle}>NEXT</Text>
        {show.map((t: keyof typeof PIECES, idx: number) => (
          <View key={`q-${idx}-${t}`} style={[styles.nextPieceBox, { height: BLOCK_SIZE * 4 * 0.6 }]}>
            {renderMiniPiece(t)}
          </View>
        ))}
      </View>
    );
  };

  const renderHold = () => {
    return (
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={styles.nextTitle}>HOLD</Text>
        <View style={styles.nextPieceBox}>{holdPiece ? renderMiniPiece(holdPiece) : null}</View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>TETRIS</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>Score: {score}</Text>
          <Text style={styles.statText}>Level: {level}</Text>
          <Text style={styles.statText}>Difficulty: {difficultyTier}</Text>
          <Text style={styles.statText}>Lines: {lines}</Text>
          <Text style={styles.statText}>Sessions: {sessionCount}</Text>
          <Text style={styles.statText}>Streak: {streak}</Text>
        </View>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.leftPanel}>
          {renderHold()}
          {renderNextQueue()}
        </View>

        <View style={styles.playArea}>
          {matrixRainEnabled && <MatrixRain />}
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.grid, gridAnimatedStyle, { width: PLAY_WIDTH, height: PLAY_HEIGHT }]}>
              {asciiMode ? (
                <>
                  {showGhost && renderAsciiGhost()}
                  {renderAsciiBoard()}
                  <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                    {showGridLines && renderGridLines()}
                  </View>
                </>
              ) : (
                <>
                  {renderGrid()}
                  <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                    {showGhost && renderGhostClassic()}
                    {showGridLines && renderGridLines()}
                  </View>
                </>
              )}
              {lastClearedRows?.map((row: number) => (
                <GlitchRowOverlay
                  key={`clr-${row}`}
                  row={row}
                  glitchSV={glitchSV}
                  lineFlashStyle={lineFlashStyle}
                  glitchFxEnabled={glitchFxEnabled}
                />
              ))}
              <Animated.View
                pointerEvents="none"
                style={[
                  { position: "absolute", left: 0, width: PLAY_WIDTH, height: 18, backgroundColor: TERMINAL_GREEN },
                  scanlineStyle,
                ]}
              />
              {slashTrailEnabled && (
                <SlashTrail
                  isActive={isSlashActive}
                  initialPoint={slashInitialPoint.current ?? undefined}
                  registerAddPoint={registerAddPoint}
                />
              )}
            </Animated.View>
          </GestureDetector>
        </View>

        <View style={styles.rightPanel}>
          <Pressable style={({ pressed }) => [styles.controlButton, pressed && { opacity: 0.85 }]} onPress={pauseGame}>
            <Text style={styles.buttonText}>{paused ? "RESUME" : "PAUSE"}</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.controlButton, pressed && { opacity: 0.85 }]} onPress={resetGame}>
            <Text style={styles.buttonText}>RESET</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && { opacity: 0.85 }]}
            onPress={toggleAsciiMode}
          >
            <Text style={styles.buttonText}>{asciiMode ? "ASCII ON" : "ASCII OFF"}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              { opacity: canHold ? 1 : 0.5 },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => {
              holdSwap();
              if (enableSfx) playSfx("hold");
            }}
            disabled={!canHold}
          >
            <Text style={styles.buttonText}>HOLD</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && { opacity: 0.85 }]}
            onPress={() => setSettingsVisible(true)}
          >
            <Text style={styles.buttonText}>SETTINGS</Text>
          </Pressable>
        </View>
      </View>

      {showHints && (
        <View style={styles.hintsOverlay}>
          <Text style={styles.hintText}>Tap = Rotate ↑ fling = Hard drop ↓ fling = Soft Pan = Move</Text>
          <Pressable onPress={hideHints} style={styles.hintDismiss}>
            <Text style={styles.hintDismissText}>×</Text>
          </Pressable>
        </View>
      )}

      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.finalScore}>Final Score: {score}</Text>
          <Pressable style={styles.restartButton} onPress={resetGame}>
            <Text style={styles.buttonText}>RESTART</Text>
          </Pressable>
        </View>
      )}

      {settingsVisible && (
        <View style={styles.settingsBackdrop}>
          <View style={styles.settingsPanel}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <Pressable style={styles.settingRow} onPress={toggleGridLines}>
              <Text style={styles.settingText}>Grid lines: {showGridLines ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable style={styles.settingRow} onPress={toggleGhost}>
              <Text style={styles.settingText}>Ghost: {showGhost ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable style={styles.settingRow} onPress={toggleHaptics}>
              <Text style={styles.settingText}>Haptics: {enableHaptics ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable style={styles.settingRow} onPress={toggleSlashTrail}>
              <Text style={styles.settingText}>Slash trail: {slashTrailEnabled ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable style={styles.settingRow} onPress={toggleSfx}>
              <Text style={styles.settingText}>SFX: {enableSfx ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable style={styles.settingRow} onPress={toggleMatrixRain}>
              <Text style={styles.settingText}>Matrix rain: {matrixRainEnabled ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable style={styles.settingRow} onPress={toggleGlitchFx}>
              <Text style={styles.settingText}>Glitch FX: {glitchFxEnabled ? "On" : "Off"}</Text>
            </Pressable>
            <View
              style={[
                styles.settingRow,
                { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
              ]}
            >
              <Text style={styles.settingText}>DAS: {useTetrisStore.getState().dasMs} ms</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={styles.controlButton} onPress={() => setDas(useTetrisStore.getState().dasMs - 10)}>
                  <Text style={styles.buttonText}>-</Text>
                </Pressable>
                <Pressable style={styles.controlButton} onPress={() => setDas(useTetrisStore.getState().dasMs + 10)}>
                  <Text style={styles.buttonText}>+</Text>
                </Pressable>
              </View>
            </View>
            <View
              style={[
                styles.settingRow,
                { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
              ]}
            >
              <Text style={styles.settingText}>ARR: {useTetrisStore.getState().arrMs} ms</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={styles.controlButton} onPress={() => setArr(useTetrisStore.getState().arrMs - 5)}>
                  <Text style={styles.buttonText}>-</Text>
                </Pressable>
                <Pressable style={styles.controlButton} onPress={() => setArr(useTetrisStore.getState().arrMs + 5)}>
                  <Text style={styles.buttonText}>+</Text>
                </Pressable>
              </View>
            </View>
            <Pressable style={[styles.dropButton, { marginTop: 12 }]} onPress={() => setSettingsVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}

      <MinimalModal
        visible={demoErrorVisible}
        title="Service unavailable"
        message="Service is currently unavailable. Please try again later."
        primaryActionLabel="Try again"
        onPrimaryAction={() => setDemoErrorVisible(false)}
        secondaryActionLabel="Dismiss"
        onSecondaryAction={() => setDemoErrorVisible(false)}
        onDismiss={() => setDemoErrorVisible(false)}
      />

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Pressable
            style={({ pressed }) => [styles.moveButton, pressed && { opacity: 0.85 }]}
            onPress={() => handleMove("left")}
          >
            <Text style={styles.buttonText}>←</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.moveButton, pressed && { opacity: 0.85 }]} onPress={handleRotate}>
            <Text style={styles.buttonText}>↻</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.moveButton, pressed && { opacity: 0.85 }]}
            onPress={() => handleMove("right")}
          >
            <Text style={styles.buttonText}>→</Text>
          </Pressable>
        </View>
        <View style={styles.controlRow}>
          <Pressable style={({ pressed }) => [styles.dropButton, pressed && { opacity: 0.85 }]} onPress={handleDrop}>
            <Text style={styles.buttonText}>SOFT DROP</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.dropButton, pressed && { opacity: 0.85 }]}
            onPress={handleHardDrop}
          >
            <Text style={styles.buttonText}>HARD DROP</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TERMINAL_BG, alignItems: "center" },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 32, fontWeight: "bold", color: TERMINAL_GREEN, marginBottom: 10 },
  stats: { flexDirection: "row", gap: 20 },
  statText: { color: TERMINAL_GREEN, fontSize: 16, fontWeight: "bold" },
  gameArea: { flexDirection: "row", alignItems: "flex-start", gap: 20 },
  leftPanel: { alignItems: "center" },
  nextPieceContainer: { alignItems: "center" },
  nextTitle: { color: TERMINAL_GREEN, fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  nextPieceBox: {
    width: BLOCK_SIZE * 4 * 0.6,
    height: BLOCK_SIZE * 4 * 0.6,
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  nextCell: {
    position: "absolute",
    width: BLOCK_SIZE * 0.6,
    height: BLOCK_SIZE * 0.6,
    borderWidth: 1,
    borderColor: TERMINAL_DARK_GREEN,
  },
  playArea: { alignItems: "center" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
    position: "relative",
    overflow: "hidden",
    shadowColor: TERMINAL_GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  cell: { width: CELL, height: CELL },
  rightPanel: { gap: 10 },
  controlButton: {
    backgroundColor: TERMINAL_DARK_GREEN,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: TERMINAL_GREEN,
  },
  controls: { position: "absolute", bottom: 50, gap: 15 },
  controlRow: { flexDirection: "row", gap: 15, justifyContent: "center" },
  moveButton: {
    backgroundColor: TERMINAL_DARK_GREEN,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
  },
  dropButton: {
    backgroundColor: TERMINAL_DARK_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
  },
  buttonText: { color: TERMINAL_GREEN, fontSize: 16, fontWeight: "bold" },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  gameOverText: { color: TERMINAL_GREEN, fontSize: 48, fontWeight: "bold" },
  finalScore: { color: TERMINAL_GREEN, fontSize: 24 },
  restartButton: {
    backgroundColor: TERMINAL_DARK_GREEN,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
  },
  asciiText: {
    color: "#79F28A",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    textShadowColor: "#00FF00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  asciiTextSmall: {
    color: "#79F28A",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: Math.floor(BLOCK_SIZE * 0.6),
    lineHeight: Math.floor(BLOCK_SIZE * 0.6 * 1.05),
    textShadowColor: "#00FF00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    textAlign: "center",
  },
  asciiGlyph: {
    position: "absolute",
    color: "#79F28A",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    textShadowColor: "#00FF00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    textAlign: "center",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: TERMINAL_DARK_GREEN,
    opacity: 0.6,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: TERMINAL_DARK_GREEN,
    opacity: 0.6,
  },

  // UX additions
  hintsOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TERMINAL_GREEN,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: { color: TERMINAL_GREEN, fontSize: 12 },
  hintDismiss: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: TERMINAL_GREEN,
    borderRadius: 6,
  },
  hintDismissText: { color: TERMINAL_GREEN, fontSize: 14 },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsPanel: {
    width: 280,
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  settingsTitle: { color: TERMINAL_GREEN, fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  settingRow: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TERMINAL_DARK_GREEN,
    borderRadius: 8,
  },
  settingText: { color: TERMINAL_GREEN, fontSize: 14 },
});

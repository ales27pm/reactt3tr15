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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector, Directions } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { useTetrisStore } from "../state/tetrisStore";
import { PIECES, GRID_WIDTH, GRID_HEIGHT } from "../state/tetrominoes";
import { ghostDropY } from "../state/engine";
import { getGlyphForColor } from "../utils/ascii";
import MinimalModal from "../components/MinimalModal";
import SlashTrail, { Point as SlashPoint } from "../components/SlashTrail";

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

  // Selectors (narrow to reduce re-renders)
  const grid = useTetrisStore((s) => s.grid);
  const currentPiece = useTetrisStore((s) => s.currentPiece);
  const nextQueue = useTetrisStore((s) => s.nextQueue);
  const holdPiece = useTetrisStore((s) => s.holdPiece);
  const canHold = useTetrisStore((s) => s.canHold);
  const score = useTetrisStore((s) => s.score);
  const level = useTetrisStore((s) => s.level);
  const lines = useTetrisStore((s) => s.lines);
  const gameOver = useTetrisStore((s) => s.gameOver);
  const paused = useTetrisStore((s) => s.paused);
  const asciiMode = useTetrisStore((s) => s.asciiMode);

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
      }
    },
    [gameOver, paused, movePiece]
  );

  const handleRotate = useCallback(() => {
    if (!gameOver && !paused) {
      rotatePiece();
      if (Platform.OS === "ios") Vibration.vibrate(10);
    }
  }, [gameOver, paused, rotatePiece]);

  const handleDrop = useCallback(() => {
    if (!gameOver && !paused) dropPiece();
  }, [gameOver, paused, dropPiece]);

  const handleHardDrop = useCallback(() => {
    if (!gameOver && !paused) {
      hardDrop();
      if (Platform.OS === "ios") Vibration.vibrate(50);
    }
  }, [gameOver, paused, hardDrop]);

  // Haptics helpers (called from JS via runOnJS)
  const hapticLight = () => { if (Platform.OS === "ios") Vibration.vibrate(8); };
  const hapticMedium = () => { if (Platform.OS === "ios") Vibration.vibrate(10); };
  const hapticStrong = () => { if (Platform.OS === "ios") Vibration.vibrate(50); };

  // Shared flags to avoid worklet reading React state directly
  const pausedSV = useSharedValue(paused ? 1 : 0);
  const gameOverSV = useSharedValue(gameOver ? 1 : 0);
  useEffect(() => { pausedSV.value = paused ? 1 : 0; }, [paused]);
  useEffect(() => { gameOverSV.value = gameOver ? 1 : 0; }, [gameOver]);

  // Slash trail state and registration
  const [isSlashActive, setIsSlashActive] = useState(false);
  const slashInitialPoint = useRef<SlashPoint | null>(null);
  const addSlashPointRef = useRef<((p: SlashPoint) => void) | null>(null);
  const registerAddPoint = useCallback((fn: (p: SlashPoint) => void) => { addSlashPointRef.current = fn; }, []);
  const startSlash = useCallback((p: SlashPoint) => { setIsSlashActive(true); slashInitialPoint.current = p; }, []);
  const stopSlash = useCallback(() => { setIsSlashActive(false); slashInitialPoint.current = null; }, []);
  const addSlashPointJS = useCallback((p: SlashPoint) => { addSlashPointRef.current?.(p); }, []);

  // Gestures
  const accX = useSharedValue(0);
  const accY = useSharedValue(0);
  const lastTX = useSharedValue(0);
  const lastTY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin((e) => {
      slashActiveSV.value = 1;
      runOnJS(startSlash)({ x: e.x, y: e.y, timestamp: Date.now() });
      accX.value = 0; accY.value = 0; lastTX.value = 0; lastTY.value = 0;
    })
    .onUpdate((e) => {
      if (pausedSV.value || gameOverSV.value) return;
      // slash trail
      runOnJS(addSlashPointJS)({ x: e.x, y: e.y, timestamp: Date.now() });
      // movement
      const dx = e.translationX - lastTX.value;
      const dy = e.translationY - lastTY.value;
      lastTX.value = e.translationX; lastTY.value = e.translationY;
      accX.value += dx;
      while (accX.value >= CELL) { runOnJS(movePiece)("right"); accX.value -= CELL; runOnJS(hapticLight)(); }
      while (accX.value <= -CELL) { runOnJS(movePiece)("left"); accX.value += CELL; runOnJS(hapticLight)(); }
      accY.value += dy;
      while (accY.value >= CELL) { runOnJS(dropPiece)(); runOnJS(hapticLight)(); accY.value -= CELL; }
    })
    .onEnd(() => { accX.value = 0; accY.value = 0; lastTX.value = 0; lastTY.value = 0; slashActiveSV.value = 0; runOnJS(stopSlash)(); });

  const slashActiveSV = useSharedValue(0);

  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd(() => {
      if (pausedSV.value || gameOverSV.value || slashActiveSV.value) return; runOnJS(rotatePiece)(); runOnJS(hapticMedium)();
    });
  const flingUp = Gesture.Fling().direction(Directions.UP).onEnd(() => {
    if (pausedSV.value || gameOverSV.value) return; runOnJS(hardDrop)(); runOnJS(hapticStrong)();
  });
  const flingDown = Gesture.Fling().direction(Directions.DOWN).onEnd(() => {
    if (pausedSV.value || gameOverSV.value) return; runOnJS(dropPiece)(); runOnJS(hapticLight)();
  });

  tap.requireExternalGestureToFail(pan, flingUp, flingDown);

  const composedGesture = Gesture.Exclusive(pan, flingUp, flingDown, tap);

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
              style={[styles.asciiGlyph, { left: (currentPiece.position.x + c) * CELL, top: (gy + r) * CELL, width: CELL, height: CELL, lineHeight: CELL, fontSize: Math.floor(CELL * 0.9), opacity: 0.25 }]}
              allowFontScaling={false}
            >
              {getGlyphForColor(currentPiece.color)}
            </Text>
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
            <View key={`gc-${r}-${c}`} style={{ position: "absolute", left: (currentPiece.position.x + c) * CELL, top: (gy + r) * CELL, width: CELL, height: CELL, borderWidth: StyleSheet.hairlineWidth, borderColor: TERMINAL_DARK_GREEN, opacity: 0.4 }} />
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
          currentPiece.shape[row - currentPiece.position.y]?.[
            col - currentPiece.position.x
          ];
        cells.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.cell,
              {
                backgroundColor: isCurrentPiece
                  ? currentPiece.color
                  : cellValue
                  ? cellValue
                  : TERMINAL_BG,
              },
            ]}
          />
        );
      }
    }
    return cells;
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
                { left: x * CELL, top: y * CELL, width: CELL, height: CELL, lineHeight: CELL, fontSize: Math.floor(CELL * 0.9) },
              ]}
              allowFontScaling={false}
            >
              {getGlyphForColor(glyphColor)}
            </Text>
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
              <Text key={`mini-${type}-${r}-${c}`} style={[styles.asciiGlyph, { left: c * mini, top: r * mini, width: mini, height: mini, lineHeight: mini, fontSize: Math.floor(mini * 0.9) }]} allowFontScaling={false}>
                {glyph}
              </Text>
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
            <View key={`mini-${type}-${r}-${c}`} style={[styles.nextCell, { backgroundColor: PIECES[type].color, left: c * (BLOCK_SIZE * scale), top: r * (BLOCK_SIZE * scale) }]} />
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
        {show.map((t, idx) => (
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
    <View style={[styles.container, { paddingTop: insets.top }] }>
      <View style={styles.header}>
        <Text style={styles.title}>TETRIS</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>Score: {score}</Text>
          <Text style={styles.statText}>Level: {level}</Text>
          <Text style={styles.statText}>Lines: {lines}</Text>
        </View>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.leftPanel}>
          {renderHold()}
          {renderNextQueue()}
        </View>

        <View style={styles.playArea}>
          <GestureDetector gesture={composedGesture}>
            <View style={[styles.grid, { width: PLAY_WIDTH, height: PLAY_HEIGHT }]}>
              {asciiMode ? (
                <>
                  {renderAsciiGhost()}
                  {renderAsciiBoard()}
                  <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                    {renderGridLines()}
                  </View>
                </>
              ) : (
                <>
                  {renderGrid()}
                  <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                    {renderGhostClassic()}
                    {renderGridLines()}
                  </View>
                </>
              )}
              <SlashTrail
                isActive={isSlashActive}
                initialPoint={slashInitialPoint.current ?? undefined}
                registerAddPoint={registerAddPoint}
              />
            </View>
          </GestureDetector>
        </View>

        <View style={styles.rightPanel}>
          <Pressable style={styles.controlButton} onPress={pauseGame}>
            <Text style={styles.buttonText}>{paused ? "RESUME" : "PAUSE"}</Text>
          </Pressable>

          <Pressable style={styles.controlButton} onPress={resetGame}>
            <Text style={styles.buttonText}>RESET</Text>
          </Pressable>

          <Pressable style={styles.controlButton} onPress={toggleAsciiMode}>
            <Text style={styles.buttonText}>{asciiMode ? "ASCII ON" : "ASCII OFF"}</Text>
          </Pressable>

          <Pressable style={[styles.controlButton, { opacity: canHold ? 1 : 0.5 }]} onPress={holdSwap} disabled={!canHold}>
            <Text style={styles.buttonText}>HOLD</Text>
          </Pressable>
        </View>
      </View>

      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.finalScore}>Final Score: {score}</Text>
          <Pressable style={styles.restartButton} onPress={resetGame}>
            <Text style={styles.buttonText}>RESTART</Text>
          </Pressable>
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
          <Pressable style={styles.moveButton} onPress={() => handleMove("left")}>
            <Text style={styles.buttonText}>←</Text>
          </Pressable>
          <Pressable style={styles.moveButton} onPress={handleRotate}>
            <Text style={styles.buttonText}>↻</Text>
          </Pressable>
          <Pressable style={styles.moveButton} onPress={() => handleMove("right")}>
            <Text style={styles.buttonText}>→</Text>
          </Pressable>
        </View>
        <View style={styles.controlRow}>
          <Pressable style={styles.dropButton} onPress={handleDrop}>
            <Text style={styles.buttonText}>SOFT DROP</Text>
          </Pressable>
          <Pressable style={styles.dropButton} onPress={handleHardDrop}>
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
  nextPieceBox: { width: BLOCK_SIZE * 4 * 0.6, height: BLOCK_SIZE * 4 * 0.6, borderWidth: 2, borderColor: TERMINAL_GREEN, position: "relative", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  nextCell: { position: "absolute", width: BLOCK_SIZE * 0.6, height: BLOCK_SIZE * 0.6, borderWidth: 1, borderColor: TERMINAL_DARK_GREEN },
  playArea: { alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", borderWidth: 2, borderColor: TERMINAL_GREEN, position: "relative", overflow: "hidden" },
  cell: { width: CELL, height: CELL },
  rightPanel: { gap: 10 },
  controlButton: { backgroundColor: TERMINAL_DARK_GREEN, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 5, borderWidth: 1, borderColor: TERMINAL_GREEN },
  controls: { position: "absolute", bottom: 50, gap: 15 },
  controlRow: { flexDirection: "row", gap: 15, justifyContent: "center" },
  moveButton: { backgroundColor: TERMINAL_DARK_GREEN, width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: TERMINAL_GREEN },
  dropButton: { backgroundColor: TERMINAL_DARK_GREEN, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 10, borderWidth: 2, borderColor: TERMINAL_GREEN },
  buttonText: { color: TERMINAL_GREEN, fontSize: 16, fontWeight: "bold" },
  gameOverOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.8)", justifyContent: "center", alignItems: "center", gap: 20 },
  gameOverText: { color: TERMINAL_GREEN, fontSize: 48, fontWeight: "bold" },
  finalScore: { color: TERMINAL_GREEN, fontSize: 24 },
  restartButton: { backgroundColor: TERMINAL_DARK_GREEN, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10, borderWidth: 2, borderColor: TERMINAL_GREEN },
  asciiText: { color: "#79F28A", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), textShadowColor: "#00FF00", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  asciiTextSmall: { color: "#79F28A", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: Math.floor(BLOCK_SIZE * 0.6), lineHeight: Math.floor(BLOCK_SIZE * 0.6 * 1.05), textShadowColor: "#00FF00", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4, textAlign: "center" },
  asciiGlyph: { position: "absolute", color: "#79F28A", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), textShadowColor: "#00FF00", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6, textAlign: "center" },
  gridLineV: { position: "absolute", top: 0, width: StyleSheet.hairlineWidth, backgroundColor: TERMINAL_DARK_GREEN, opacity: 0.6 },
  gridLineH: { position: "absolute", left: 0, height: StyleSheet.hairlineWidth, backgroundColor: TERMINAL_DARK_GREEN, opacity: 0.6 },
});

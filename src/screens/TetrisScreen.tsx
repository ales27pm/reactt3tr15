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
import { composeAsciiGrid, composeAsciiPiece, CHAR_ASPECT } from "../utils/ascii";
import MinimalModal from "../components/MinimalModal";

const { width } = Dimensions.get("window");
const BLOCK_SIZE = Math.min(width * 0.05, 20);
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL = PixelRatio.roundToNearestPixel(BLOCK_SIZE);
const PLAY_WIDTH = CELL * GRID_WIDTH;
const PLAY_HEIGHT = CELL * GRID_HEIGHT;

// Terminal colors
const TERMINAL_GREEN = "#00FF00";
const TERMINAL_DARK_GREEN = "#00AA00";
const TERMINAL_BG = "#000";

// Piece definitions with proper SRS data
const PIECES: any = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00FFFF",
    srs: {
      "0-R": [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: -1 }, { x: 1, y: 2 }],
      "R-0": [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 1 }, { x: -1, y: -2 }],
      "R-2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
      "2-R": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: -2 }, { x: -2, y: 1 }],
      "2-L": [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 1 }, { x: -1, y: -2 }],
      "L-2": [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: -1 }, { x: 1, y: 2 }],
      "L-0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: -2 }, { x: -2, y: 1 }],
      "0-L": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
    },
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#0000FF",
    srs: {
      "0-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "R-0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "R-2": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "2-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "2-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
      "L-2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "L-0": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "0-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
    },
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#FFA500",
    srs: {
      "0-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "R-0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "R-2": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "2-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "2-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
      "L-2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "L-0": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "0-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
    },
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#FFFF00",
    srs: {},
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#00FF00",
    srs: {
      "0-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "R-0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "R-2": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "2-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "2-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
      "L-2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "L-0": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "0-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
    },
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#800080",
    srs: {
      "0-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "R-0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "R-2": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "2-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "2-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
      "L-2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "L-0": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "0-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
    },
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#FF0000",
    srs: {
      "0-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "R-0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "R-2": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      "2-R": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
      "2-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
      "L-2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "L-0": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
      "0-L": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
    },
  },
};

export default function TetrisScreen() {
  const insets = useSafeAreaInsets();
  const [demoErrorVisible, setDemoErrorVisible] = useState(false);

  const {
    grid,
    currentPiece,
    nextPiece,
    score,
    level,
    lines,
    gameOver,
    paused,
    asciiMode,
    initializeGame,
    movePiece,
    rotatePiece,
    dropPiece,
    hardDrop,
    pauseGame,
    resetGame,
    toggleAsciiMode,
  } = useTetrisStore();

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const dropIntervalRef = useRef(1000);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (!gameOver && !paused) {
      gameLoopRef.current = setInterval(() => {
        dropPiece();
      }, dropIntervalRef.current);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, paused, dropPiece]);

  useEffect(() => {
    dropIntervalRef.current = Math.max(50, 1000 - level * 50);
  }, [level]);

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

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    const shape = PIECES[nextPiece].shape;
    if (asciiMode) {
      const text = composeAsciiPiece(shape, PIECES[nextPiece].color);
      return <Text style={styles.asciiTextSmall}>{text}</Text>;
    }
    const cells: any[] = [];
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          cells.push(
            <View
              key={`next-${row}-${col}`}
              style={[
                styles.nextCell,
                {
                  backgroundColor: PIECES[nextPiece].color,
                  left: col * (BLOCK_SIZE * 0.6),
                  top: row * (BLOCK_SIZE * 0.6),
                },
              ]}
            />
          );
        }
      }
    }
    return cells;
  };

  // Haptics helpers (called from JS via runOnJS)
  const hapticLight = () => { if (Platform.OS === "ios") Vibration.vibrate(8); };
  const hapticMedium = () => { if (Platform.OS === "ios") Vibration.vibrate(10); };
  const hapticStrong = () => { if (Platform.OS === "ios") Vibration.vibrate(50); };

  // Shared flags to avoid worklet reading React state directly
  const pausedSV = useSharedValue(paused ? 1 : 0);
  const gameOverSV = useSharedValue(gameOver ? 1 : 0);
  useEffect(() => { pausedSV.value = paused ? 1 : 0; }, [paused]);
  useEffect(() => { gameOverSV.value = gameOver ? 1 : 0; }, [gameOver]);

  // Gestures
  const accX = useSharedValue(0);
  const accY = useSharedValue(0);
  const lastTX = useSharedValue(0);
  const lastTY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      accX.value = 0;
      accY.value = 0;
      lastTX.value = 0;
      lastTY.value = 0;
    })
    .onUpdate((e) => {
      if (pausedSV.value || gameOverSV.value) return;
      const dx = e.translationX - lastTX.value;
      const dy = e.translationY - lastTY.value;
      lastTX.value = e.translationX;
      lastTY.value = e.translationY;
      accX.value += dx;
      while (accX.value >= CELL) {
        runOnJS(movePiece)("right");
        accX.value -= CELL;
        runOnJS(hapticLight)();
      }
      while (accX.value <= -CELL) {
        runOnJS(movePiece)("left");
        accX.value += CELL;
        runOnJS(hapticLight)();
      }
      accY.value += dy;
      while (accY.value >= CELL) {
        runOnJS(dropPiece)();
        runOnJS(hapticLight)();
        accY.value -= CELL;
      }
    })
    .onEnd(() => {
      accX.value = 0;
      accY.value = 0;
      lastTX.value = 0;
      lastTY.value = 0;
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (pausedSV.value || gameOverSV.value) return;
    runOnJS(rotatePiece)();
    runOnJS(hapticMedium)();
  });
  const flingUp = Gesture.Fling().direction(Directions.UP).onEnd(() => {
    if (pausedSV.value || gameOverSV.value) return;
    runOnJS(hardDrop)();
    runOnJS(hapticStrong)();
  });
  const flingDown = Gesture.Fling().direction(Directions.DOWN).onEnd(() => {
    if (pausedSV.value || gameOverSV.value) return;
    runOnJS(dropPiece)();
    runOnJS(hapticLight)();
  });
  const composedGesture = Gesture.Simultaneous(pan, tap, flingUp, flingDown);

  const asciiFontSize = Math.floor(PLAY_WIDTH / (GRID_WIDTH * CHAR_ASPECT));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          <View style={styles.nextPieceContainer}>
            <Text style={styles.nextTitle}>NEXT</Text>
            <View style={styles.nextPieceBox}>{renderNextPiece()}</View>
          </View>
        </View>

        <View style={styles.playArea}>
          <GestureDetector gesture={composedGesture}>
            <View style={[styles.grid, { width: PLAY_WIDTH, height: PLAY_HEIGHT }]}>
              {asciiMode ? (
                <Text
                  style={[
                    styles.asciiText,
                    {
                      fontSize: asciiFontSize,
                      lineHeight: Math.floor(asciiFontSize * 1.05),
                    },
                  ]}
                  allowFontScaling={false}
                  numberOfLines={GRID_HEIGHT}
                >
                  {composeAsciiGrid(grid as any, currentPiece as any)}
                </Text>
              ) : (
                <>
                  {renderGrid()}
                  <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                    {renderGridLines()}
                  </View>
                </>
              )}
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
  container: {
    flex: 1,
    backgroundColor: TERMINAL_BG,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: TERMINAL_GREEN,
    marginBottom: 10,
  },
  stats: {
    flexDirection: "row",
    gap: 20,
  },
  statText: {
    color: TERMINAL_GREEN,
    fontSize: 16,
    fontWeight: "bold",
  },
  gameArea: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  leftPanel: {
    alignItems: "center",
  },
  nextPieceContainer: {
    alignItems: "center",
  },
  nextTitle: {
    color: TERMINAL_GREEN,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  nextPieceBox: {
    width: BLOCK_SIZE * 4 * 0.6,
    height: BLOCK_SIZE * 4 * 0.6,
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  nextCell: {
    position: "absolute",
    width: BLOCK_SIZE * 0.6,
    height: BLOCK_SIZE * 0.6,
    borderWidth: 1,
    borderColor: TERMINAL_DARK_GREEN,
  },
  playArea: {
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
    position: "relative",
  },
  cell: {
    width: CELL,
    height: CELL,
  },
  rightPanel: {
    gap: 10,
  },
  controlButton: {
    backgroundColor: TERMINAL_DARK_GREEN,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: TERMINAL_GREEN,
  },
  controls: {
    position: "absolute",
    bottom: 50,
    gap: 15,
  },
  controlRow: {
    flexDirection: "row",
    gap: 15,
    justifyContent: "center",
  },
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
  buttonText: {
    color: TERMINAL_GREEN,
    fontSize: 16,
    fontWeight: "bold",
  },
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
  gameOverText: {
    color: TERMINAL_GREEN,
    fontSize: 48,
    fontWeight: "bold",
  },
  finalScore: {
    color: TERMINAL_GREEN,
    fontSize: 24,
  },
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
});
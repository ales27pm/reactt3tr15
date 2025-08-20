import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Vibration,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTetrisStore } from '../state/tetrisStore';

const { width } = Dimensions.get('window');
const BLOCK_SIZE = Math.min(width * 0.05, 20);
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const PLAY_WIDTH = BLOCK_SIZE * GRID_WIDTH;
const PLAY_HEIGHT = BLOCK_SIZE * GRID_HEIGHT;

// Terminal colors
const TERMINAL_GREEN = '#00FF00';
const TERMINAL_DARK_GREEN = '#00AA00';
const TERMINAL_BG = '#000';

// Piece definitions with proper SRS data
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
    srs: {} // O piece doesn't rotate
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



export default function TetrisScreen() {
  const insets = useSafeAreaInsets();
  const {
    grid,
    currentPiece,
    nextPiece,
    score,
    level,
    lines,
    gameOver,
    paused,
    initializeGame,
    movePiece,
    rotatePiece,
    dropPiece,
    hardDrop,
    pauseGame,
    resetGame
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
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameOver, paused, dropPiece]);

  // Update drop speed based on level
  useEffect(() => {
    dropIntervalRef.current = Math.max(50, 1000 - (level * 50));
  }, [level]);

  const handleMove = useCallback((direction: 'left' | 'right') => {
    if (!gameOver && !paused) {
      movePiece(direction);
      if (Platform.OS === 'ios') {
        Vibration.vibrate(10);
      }
    }
  }, [gameOver, paused, movePiece]);

  const handleRotate = useCallback(() => {
    if (!gameOver && !paused) {
      rotatePiece();
      if (Platform.OS === 'ios') {
        Vibration.vibrate(10);
      }
    }
  }, [gameOver, paused, rotatePiece]);

  const handleDrop = useCallback(() => {
    if (!gameOver && !paused) {
      dropPiece();
    }
  }, [gameOver, paused, dropPiece]);

  const handleHardDrop = useCallback(() => {
    if (!gameOver && !paused) {
      hardDrop();
      if (Platform.OS === 'ios') {
        Vibration.vibrate(50);
      }
    }
  }, [gameOver, paused, hardDrop]);

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const cellValue = grid[row]?.[col] || 0;
        const isCurrentPiece = currentPiece && 
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
                backgroundColor: isCurrentPiece 
                  ? currentPiece.color 
                  : cellValue 
                    ? cellValue 
                    : TERMINAL_BG,
                borderColor: TERMINAL_DARK_GREEN,
              }
            ]}
          />
        );
      }
    }
    return cells;
  };

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    
    const cells = [];
    const shape = PIECES[nextPiece].shape;
    
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
                }
              ]}
            />
          );
        }
      }
    }
    return cells;
  };

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
            <View style={styles.nextPieceBox}>
              {renderNextPiece()}
            </View>
          </View>
        </View>

        <View style={styles.playArea}>
          <View style={[styles.grid, { width: PLAY_WIDTH, height: PLAY_HEIGHT }]}>
            {renderGrid()}
          </View>
        </View>

        <View style={styles.rightPanel}>
          <Pressable
            style={styles.controlButton}
            onPress={pauseGame}
          >
            <Text style={styles.buttonText}>{paused ? "RESUME" : "PAUSE"}</Text>
          </Pressable>
          
          <Pressable
            style={styles.controlButton}
            onPress={resetGame}
          >
            <Text style={styles.buttonText}>RESET</Text>
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

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Pressable
            style={styles.moveButton}
            onPress={() => handleMove('left')}
          >
            <Text style={styles.buttonText}>←</Text>
          </Pressable>
          
          <Pressable
            style={styles.moveButton}
            onPress={handleRotate}
          >
            <Text style={styles.buttonText}>↻</Text>
          </Pressable>
          
          <Pressable
            style={styles.moveButton}
            onPress={() => handleMove('right')}
          >
            <Text style={styles.buttonText}>→</Text>
          </Pressable>
        </View>
        
        <View style={styles.controlRow}>
          <Pressable
            style={styles.dropButton}
            onPress={handleDrop}
          >
            <Text style={styles.buttonText}>SOFT DROP</Text>
          </Pressable>
          
          <Pressable
            style={styles.dropButton}
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
  container: {
    flex: 1,
    backgroundColor: TERMINAL_BG,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: TERMINAL_GREEN,
    marginBottom: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  statText: {
    color: TERMINAL_GREEN,
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  leftPanel: {
    alignItems: 'center',
  },
  nextPieceContainer: {
    alignItems: 'center',
  },
  nextTitle: {
    color: TERMINAL_GREEN,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  nextPieceBox: {
    width: BLOCK_SIZE * 4 * 0.6,
    height: BLOCK_SIZE * 4 * 0.6,
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
    position: 'relative',
  },
  nextCell: {
    position: 'absolute',
    width: BLOCK_SIZE * 0.6,
    height: BLOCK_SIZE * 0.6,
    borderWidth: 1,
    borderColor: TERMINAL_DARK_GREEN,
  },
  playArea: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: TERMINAL_GREEN,
  },
  cell: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
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
    position: 'absolute',
    bottom: 50,
    gap: 15,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
  },
  moveButton: {
    backgroundColor: TERMINAL_DARK_GREEN,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  gameOverText: {
    color: TERMINAL_GREEN,
    fontSize: 48,
    fontWeight: 'bold',
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
});
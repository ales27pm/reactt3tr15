import { createEmptyGrid, clearLines, createPiece, isValidPosition, computeDropDistance } from "../../state/engine";
import { GRID_WIDTH, GRID_HEIGHT } from "../../state/tetrominoes";

describe("engine.clearLines", () => {
  it("clears single full line and reports index", () => {
    const g = createEmptyGrid();
    const row = GRID_HEIGHT - 1;
    for (let x = 0; x < GRID_WIDTH; x++) g[row][x] = "#00FF00";
    const { newGrid, linesCleared, clearedRows } = clearLines(g);
    expect(linesCleared).toBe(1);
    expect(clearedRows).toEqual([row]);
    expect(newGrid[0].every((c) => c === null)).toBe(true);
  });

  it("clears multiple lines and keeps order", () => {
    const g = createEmptyGrid();
    const rowA = GRID_HEIGHT - 1;
    const rowB = GRID_HEIGHT - 3;
    for (let x = 0; x < GRID_WIDTH; x++) { g[rowA][x] = "#00FF00"; g[rowB][x] = "#00FF00"; }
    const { linesCleared, clearedRows } = clearLines(g);
    expect(linesCleared).toBe(2);
    expect(clearedRows).toEqual([rowB, rowA]);
  });
});

describe("engine.validity and drop distance", () => {
  it("piece at top is valid and drop distance is finite", () => {
    const g = createEmptyGrid();
    const p = createPiece("I");
    expect(isValidPosition(g, p, p.position.x, p.position.y)).toBe(true);
    const dist = computeDropDistance(g, p);
    expect(dist).toBeGreaterThan(0);
  });
});

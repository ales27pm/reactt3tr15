import { describe, it, expect } from "bun:test";
import { createEmptyGrid, createPiece, isValidPosition, rotateShape, ghostDropY, clearLines, trySRSRotation } from "../../state/engine";
import { GRID_WIDTH, GRID_HEIGHT } from "../../state/tetrominoes";

describe("engine basics", () => {
  it("creates empty grid", () => {
    const g = createEmptyGrid();
    expect(g.length).toBe(GRID_HEIGHT);
    expect(g[0].length).toBe(GRID_WIDTH);
  });

  it("rotate shape 3x3", () => {
    const s = [ [1,0,0],[1,1,1],[0,0,0] ];
    const r = rotateShape(s);
    expect(r.length).toBe(3);
  });

  it("valid position inside bounds", () => {
    const g = createEmptyGrid();
    const p = createPiece("T");
    expect(isValidPosition(g, p, p.position.x, p.position.y)).toBeTrue();
  });

  it("ghost drop reaches floor", () => {
    const g = createEmptyGrid();
    const p = createPiece("I");
    const gy = ghostDropY(g, p);
    expect(gy >= p.position.y).toBeTrue();
  });

  it("clearLines removes full rows", () => {
    const g = createEmptyGrid();
    // fill last row
    g[GRID_HEIGHT-1] = Array(GRID_WIDTH).fill("#fff");
    const { newGrid, linesCleared } = clearLines(g);
    expect(linesCleared).toBe(1);
    expect(newGrid.length).toBe(GRID_HEIGHT);
  });
});

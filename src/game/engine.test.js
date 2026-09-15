import { describe, it, expect } from 'vitest';
import {
  slideRowLeft,
  moveGrid,
  canMove,
  hasWon,
  applyMove,
  spawnRandomTile,
  createEmptyGrid,
} from './engine.js';
import { DIRECTIONS, WIN_TILE } from './constants.js';

function rowFromValues(values) {
  let id = 1;
  return values.map((value) => (value === 0 ? null : { id: id++, value }));
}

function gridFromValues(rows) {
  let id = 1;
  return rows.map((row) => row.map((value) => (value === 0 ? null : { id: id++, value })));
}

function valuesFromGrid(grid) {
  return grid.map((row) => row.map((cell) => (cell ? cell.value : 0)));
}

describe('slideRowLeft', () => {
  it('merges a single adjacent pair and slides left', () => {
    const { row, scoreDelta, moved } = slideRowLeft(rowFromValues([2, 2, 0, 0]), 100);
    expect(row.map((c) => (c ? c.value : 0))).toEqual([4, 0, 0, 0]);
    expect(scoreDelta).toBe(4);
    expect(moved).toBe(true);
  });

  it('does not chain-merge a tile twice in one move', () => {
    const { row, scoreDelta } = slideRowLeft(rowFromValues([4, 2, 2, 0]), 100);
    expect(row.map((c) => (c ? c.value : 0))).toEqual([4, 4, 0, 0]);
    expect(scoreDelta).toBe(4);
  });

  it('merges only the first pair when three equal tiles are in a row', () => {
    const { row, scoreDelta } = slideRowLeft(rowFromValues([2, 2, 2, 0]), 100);
    expect(row.map((c) => (c ? c.value : 0))).toEqual([4, 2, 0, 0]);
    expect(scoreDelta).toBe(4);
  });

  it('reports moved=false when the row is already fully slid with no merges', () => {
    const { moved } = slideRowLeft(rowFromValues([4, 2, 0, 0]), 100);
    expect(moved).toBe(false);
  });

  it('reports moved=true when tiles shift left even without a merge', () => {
    const { row, moved } = slideRowLeft(rowFromValues([0, 4, 0, 2]), 100);
    expect(row.map((c) => (c ? c.value : 0))).toEqual([4, 2, 0, 0]);
    expect(moved).toBe(true);
  });
});

describe('moveGrid direction handling', () => {
  const grid = gridFromValues([
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);

  it('LEFT slides rows toward column 0', () => {
    const { grid: result, scoreDelta, moved } = moveGrid(grid, DIRECTIONS.LEFT, 100);
    expect(valuesFromGrid(result)).toEqual([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(moved).toBe(false);
    expect(scoreDelta).toBe(0);
  });

  it('RIGHT slides rows toward the last column', () => {
    const { grid: result } = moveGrid(grid, DIRECTIONS.RIGHT, 100);
    expect(valuesFromGrid(result)).toEqual([
      [0, 0, 0, 2],
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  it('UP merges the two stacked tiles into row 0', () => {
    const { grid: result, scoreDelta, moved } = moveGrid(grid, DIRECTIONS.UP, 100);
    expect(valuesFromGrid(result)).toEqual([
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(scoreDelta).toBe(4);
    expect(moved).toBe(true);
  });

  it('DOWN slides the column toward the last row', () => {
    const single = gridFromValues([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const { grid: result } = moveGrid(single, DIRECTIONS.DOWN, 100);
    expect(valuesFromGrid(result)).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ]);
  });

  it('DOWN merges two stacked tiles into the last row', () => {
    const { grid: result, scoreDelta } = moveGrid(grid, DIRECTIONS.DOWN, 100);
    expect(valuesFromGrid(result)).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 0, 0, 0],
    ]);
    expect(scoreDelta).toBe(4);
  });
});

describe('canMove', () => {
  it('is true when there is an empty cell', () => {
    expect(canMove(createEmptyGrid(4))).toBe(true);
  });

  it('is true when two equal tiles are adjacent', () => {
    const grid = gridFromValues([
      [2, 4, 8, 16],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 4],
    ]);
    expect(canMove(grid)).toBe(true);
  });

  it('is false when the grid is full with no adjacent equal values', () => {
    const grid = gridFromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(canMove(grid)).toBe(false);
  });
});

describe('hasWon', () => {
  it('detects a 2048 tile', () => {
    const grid = gridFromValues([
      [WIN_TILE, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(hasWon(grid)).toBe(true);
  });

  it('is false otherwise', () => {
    const grid = gridFromValues([
      [1024, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(hasWon(grid)).toBe(false);
  });
});

describe('spawnRandomTile', () => {
  it('places a 2 when the random draw is below the four-probability threshold', () => {
    const grid = createEmptyGrid(2);
    const queue = [0, 0.99]; // pick cell 0, then value roll >= threshold => a "2"
    const random = () => queue.shift();
    const { grid: result, nextId } = spawnRandomTile(grid, 1, random);
    expect(valuesFromGrid(result).flat().filter((v) => v !== 0)).toEqual([2]);
    expect(nextId).toBe(2);
  });

  it('is a no-op on a full grid', () => {
    const grid = gridFromValues([
      [2, 2],
      [2, 2],
    ]);
    const result = spawnRandomTile(grid, 5, () => 0);
    expect(result.nextId).toBe(5);
    expect(valuesFromGrid(result.grid)).toEqual([
      [2, 2],
      [2, 2],
    ]);
  });
});

describe('applyMove', () => {
  it('returns the same state when the move does nothing', () => {
    const state = {
      grid: gridFromValues([
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      score: 0,
      status: 'playing',
      nextId: 10,
    };
    const next = applyMove(state, DIRECTIONS.LEFT, { random: () => 0 });
    expect(next).toBe(state);
  });

  it('increases score, spawns a tile, and advances nextId on a real move', () => {
    const state = {
      grid: gridFromValues([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      score: 0,
      status: 'playing',
      nextId: 10,
    };
    const next = applyMove(state, DIRECTIONS.LEFT, { random: () => 0 });
    expect(next.score).toBe(4);
    expect(next.status).toBe('playing');
    expect(next.nextId).toBeGreaterThan(state.nextId);
    const nonEmpty = valuesFromGrid(next.grid).flat().filter((v) => v !== 0);
    expect(nonEmpty).toHaveLength(2); // merged 4-tile + freshly spawned tile
  });

  it('sets status to lost once no move is possible after spawning', () => {
    const state = {
      grid: gridFromValues([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 0, 2, 4],
      ]),
      score: 0,
      status: 'playing',
      nextId: 10,
    };
    // Sliding LEFT closes the one gap (no merge) leaving a single empty cell
    // at (3,3); we control the spawn to land a "2" there, which keeps every
    // neighbor mismatched, so the board is completely stuck afterward.
    const queue = [0, 0.5];
    const next = applyMove(state, DIRECTIONS.LEFT, { random: () => queue.shift() });
    expect(valuesFromGrid(next.grid)).toEqual([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(next.status).toBe('lost');
  });

  it('never mutates the input state object', () => {
    const state = {
      grid: gridFromValues([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      score: 0,
      status: 'playing',
      nextId: 10,
    };
    const snapshot = JSON.stringify(state);
    applyMove(state, DIRECTIONS.LEFT, { random: () => 0 });
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

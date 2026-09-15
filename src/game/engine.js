import { GRID_SIZE, WIN_TILE, SPAWN_FOUR_PROBABILITY, DIRECTIONS } from './constants.js';

// Grid cells are `{ id, value } | null`. Keeping a stable `id` per tile lets the
// UI layer animate slides/merges by tracking DOM nodes across renders instead
// of tearing everything down on every move.

export function createEmptyGrid(size = GRID_SIZE) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

export function spawnRandomTile(grid, nextId, random = Math.random) {
  const emptyCells = [];
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (grid[r][c] === null) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) {
    return { grid, nextId };
  }
  const [r, c] = emptyCells[Math.floor(random() * emptyCells.length)];
  const value = random() < SPAWN_FOUR_PROBABILITY ? 4 : 2;
  const newGrid = grid.map((row) => row.slice());
  newGrid[r][c] = { id: nextId, value };
  return { grid: newGrid, nextId: nextId + 1 };
}

export function createInitialState({ size = GRID_SIZE, random = Math.random } = {}) {
  let grid = createEmptyGrid(size);
  let nextId = 1;
  ({ grid, nextId } = spawnRandomTile(grid, nextId, random));
  ({ grid, nextId } = spawnRandomTile(grid, nextId, random));
  return { grid, score: 0, status: 'playing', nextId };
}

function rotateOnceClockwise(grid) {
  const n = grid.length;
  const result = [];
  for (let r = 0; r < n; r += 1) {
    const row = [];
    for (let c = 0; c < n; c += 1) {
      row.push(grid[n - 1 - c][r]);
    }
    result.push(row);
  }
  return result;
}

export function rotateGrid(grid, times) {
  const normalizedTimes = ((times % 4) + 4) % 4;
  let result = grid;
  for (let i = 0; i < normalizedTimes; i += 1) {
    result = rotateOnceClockwise(result);
  }
  return result;
}

// Slides one row toward index 0, merging equal adjacent tiles once per move
// (classic 2048 rule: a tile born from a merge never merges again this move).
export function slideRowLeft(row, nextId) {
  const tiles = row.filter((cell) => cell !== null);
  const resultTiles = [];
  let scoreDelta = 0;
  let currentId = nextId;
  let i = 0;
  while (i < tiles.length) {
    const current = tiles[i];
    const next = tiles[i + 1];
    if (next && current.value === next.value) {
      const mergedValue = current.value * 2;
      resultTiles.push({ id: currentId, value: mergedValue });
      currentId += 1;
      scoreDelta += mergedValue;
      i += 2;
    } else {
      resultTiles.push(current);
      i += 1;
    }
  }

  const newRow = resultTiles.slice();
  while (newRow.length < row.length) newRow.push(null);

  const moved = row.some((cell, idx) => {
    const newCell = newRow[idx];
    if (cell === null && newCell === null) return false;
    if (cell === null || newCell === null) return true;
    return cell.id !== newCell.id || cell.value !== newCell.value;
  });

  return { row: newRow, scoreDelta, moved, nextId: currentId };
}

// Every direction reduces to "slide left": rotate the grid so that direction
// points left, run the single row primitive, then rotate back.
const ROTATION_BY_DIRECTION = {
  [DIRECTIONS.LEFT]: 0,
  [DIRECTIONS.RIGHT]: 2,
  [DIRECTIONS.UP]: 3,
  [DIRECTIONS.DOWN]: 1,
};

export function moveGrid(grid, direction, nextId) {
  const forwardRotation = ROTATION_BY_DIRECTION[direction];
  if (forwardRotation === undefined) {
    throw new Error(`Unknown direction: ${direction}`);
  }
  const rotated = rotateGrid(grid, forwardRotation);

  let currentId = nextId;
  let scoreDelta = 0;
  let moved = false;
  const slidRows = rotated.map((row) => {
    const result = slideRowLeft(row, currentId);
    currentId = result.nextId;
    scoreDelta += result.scoreDelta;
    if (result.moved) moved = true;
    return result.row;
  });

  const inverseRotation = (4 - forwardRotation) % 4;
  const finalGrid = rotateGrid(slidRows, inverseRotation);
  return { grid: finalGrid, scoreDelta, moved, nextId: currentId };
}

export function canMove(grid) {
  const n = grid.length;
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const cell = grid[r][c];
      if (cell === null) return true;
      const right = c + 1 < n ? grid[r][c + 1] : null;
      const down = r + 1 < n ? grid[r + 1][c] : null;
      if (right && right.value === cell.value) return true;
      if (down && down.value === cell.value) return true;
    }
  }
  return false;
}

export function hasWon(grid, target = WIN_TILE) {
  return grid.some((row) => row.some((cell) => cell && cell.value >= target));
}

// Applies one arrow-key press: slide+merge, spawn a new tile if anything
// actually moved, and recompute status. Status flips to 'won' the moment a
// winning tile appears (the UI decides whether it already showed the
// celebration once) and stays 'playing' until the board truly has no moves
// left, at which point it becomes 'lost'.
export function applyMove(state, direction, { random = Math.random } = {}) {
  if (state.status === 'lost') return state;

  const { grid: movedGrid, scoreDelta, moved, nextId: idAfterMove } = moveGrid(
    state.grid,
    direction,
    state.nextId,
  );

  if (!moved) {
    return state;
  }

  const { grid: spawnedGrid, nextId: idAfterSpawn } = spawnRandomTile(movedGrid, idAfterMove, random);
  const score = state.score + scoreDelta;

  let status = 'playing';
  if (hasWon(spawnedGrid)) {
    status = 'won';
  } else if (!canMove(spawnedGrid)) {
    status = 'lost';
  }

  return { grid: spawnedGrid, score, status, nextId: idAfterSpawn };
}

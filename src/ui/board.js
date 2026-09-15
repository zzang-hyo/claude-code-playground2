import { GRID_SIZE } from '../game/constants.js';

const GAP_PERCENT = 3.5;
const CELL_PERCENT = (100 - GAP_PERCENT * (GRID_SIZE - 1)) / GRID_SIZE;

function tileClassForValue(value) {
  return value <= 2048 ? `tile-v${value}` : 'tile-vbig';
}

function cellPosition(row, col) {
  return {
    left: `${col * (CELL_PERCENT + GAP_PERCENT)}%`,
    top: `${row * (CELL_PERCENT + GAP_PERCENT)}%`,
    width: `${CELL_PERCENT}%`,
    height: `${CELL_PERCENT}%`,
  };
}

// Renders the grid by diffing tile ids against the previous render, so
// unchanged tiles just get a new left/top (which CSS transitions into a
// slide) instead of being torn down and recreated every move.
export function initBoard(boardWrapEl) {
  const gridEl = boardWrapEl.querySelector('.board-grid');
  const tilesLayer = boardWrapEl.querySelector('.tiles-layer');

  gridEl.innerHTML = '';
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i += 1) {
    const cellBg = document.createElement('div');
    cellBg.className = 'cell-bg';
    gridEl.appendChild(cellBg);
  }

  const tileElements = new Map();

  function render(state) {
    const seenIds = new Set();

    state.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        seenIds.add(cell.id);

        let el = tileElements.get(cell.id);
        const isNew = !el;
        if (isNew) {
          el = document.createElement('div');
          tilesLayer.appendChild(el);
          tileElements.set(cell.id, el);
        }

        el.className = `tile ${tileClassForValue(cell.value)}${isNew ? ' spawning' : ''}`;
        el.textContent = String(cell.value);
        Object.assign(el.style, cellPosition(r, c));

        if (isNew) {
          el.addEventListener('animationend', () => el.classList.remove('spawning'), { once: true });
        }
      });
    });

    tileElements.forEach((el, id) => {
      if (!seenIds.has(id)) {
        el.remove();
        tileElements.delete(id);
      }
    });
  }

  function reset() {
    tileElements.forEach((el) => el.remove());
    tileElements.clear();
  }

  return { render, reset };
}

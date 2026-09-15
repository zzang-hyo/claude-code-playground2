import './style.css';
import { createInitialState, applyMove } from './game/engine.js';
import { initBoard } from './ui/board.js';
import { attachInput } from './ui/input.js';
import { initScoreBar } from './ui/scoreBar.js';
import { initGameOverModal } from './ui/gameOverModal.js';
import { addScore } from './firebase/leaderboard.js';
import { initLeaderboardView } from './leaderboard/leaderboardView.js';

const MOVE_LOCK_MS = 130; // roughly matches the CSS slide transition duration

const boardWrapEl = document.getElementById('board-wrap');
const winBannerEl = document.getElementById('win-banner');
const newGameBtn = document.getElementById('new-game-btn');

const board = initBoard(boardWrapEl);
const scoreBar = initScoreBar({
  scoreEl: document.getElementById('current-score'),
  bestEl: document.getElementById('best-score'),
});
const gameOverModal = initGameOverModal(
  {
    overlayEl: document.getElementById('game-over-overlay'),
    finalScoreEl: document.getElementById('final-score'),
    formEl: document.getElementById('name-form'),
    nameInputEl: document.getElementById('name-input'),
    playAgainBtn: document.getElementById('play-again-btn'),
  },
  {
    onSubmit: async (name) => {
      try {
        await addScore({ name, score: state.score });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[2048] could not save score to the leaderboard', error);
      }
      startNewGame();
    },
    onPlayAgain: () => startNewGame(),
  },
);

initLeaderboardView({
  listEl: document.getElementById('leaderboard-list'),
  statusEl: document.getElementById('leaderboard-status'),
});

let state = createInitialState();
let locked = false;
let hasShownWinBanner = false;

function handleMove(direction) {
  if (locked) return;
  const next = applyMove(state, direction);
  if (next === state) return; // no tiles moved, ignore

  state = next;
  board.render(state);
  scoreBar.update(state.score);

  locked = true;
  setTimeout(() => {
    locked = false;
  }, MOVE_LOCK_MS);

  if (state.status === 'won' && !hasShownWinBanner) {
    hasShownWinBanner = true;
    winBannerEl.hidden = false;
  }

  if (state.status === 'lost') {
    gameOverModal.show(state.score);
  }
}

function startNewGame() {
  state = createInitialState();
  hasShownWinBanner = false;
  winBannerEl.hidden = true;
  board.reset();
  board.render(state);
  scoreBar.reset();
  scoreBar.update(state.score);
  gameOverModal.hide();
}

attachInput(boardWrapEl, { onMove: handleMove, isLocked: () => locked });
newGameBtn.addEventListener('click', startNewGame);

board.render(state);
scoreBar.update(state.score);

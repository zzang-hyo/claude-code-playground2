const BEST_SCORE_KEY = 'game2048.bestScore';

function readStoredBest() {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0; // localStorage can throw in private/blocked storage contexts
  }
}

function writeStoredBest(value) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(value));
  } catch {
    // best-effort only; a missing localStorage shouldn't break the game
  }
}

export function initScoreBar({ scoreEl, bestEl }) {
  let best = readStoredBest();
  bestEl.textContent = String(best);

  function update(score) {
    scoreEl.textContent = String(score);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      writeStoredBest(best);
    }
  }

  function reset() {
    scoreEl.textContent = '0';
  }

  return { update, reset };
}

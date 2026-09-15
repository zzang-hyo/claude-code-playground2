import { DIRECTIONS } from '../game/constants.js';

const KEY_DIRECTIONS = {
  ArrowLeft: DIRECTIONS.LEFT,
  ArrowRight: DIRECTIONS.RIGHT,
  ArrowUp: DIRECTIONS.UP,
  ArrowDown: DIRECTIONS.DOWN,
  a: DIRECTIONS.LEFT,
  d: DIRECTIONS.RIGHT,
  w: DIRECTIONS.UP,
  s: DIRECTIONS.DOWN,
};

const MIN_SWIPE_DISTANCE_PX = 24;

// Wires arrow-key presses and touch swipes on `target` to a single
// onMove(direction) callback. `isLocked` lets the caller ignore input while a
// move animation is still settling, so fast key-mashing can't desync state.
export function attachInput(target, { onMove, isLocked }) {
  function locked() {
    return Boolean(isLocked && isLocked());
  }

  function handleKeydown(event) {
    const direction = KEY_DIRECTIONS[event.key] || KEY_DIRECTIONS[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault();
    if (locked()) return;
    onMove(direction);
  }

  let touchStartX = 0;
  let touchStartY = 0;
  let tracking = false;

  function handleTouchStart(event) {
    if (event.touches.length !== 1) return;
    tracking = true;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (tracking) event.preventDefault();
  }

  function handleTouchEnd(event) {
    if (!tracking) return;
    tracking = false;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < MIN_SWIPE_DISTANCE_PX) return;

    const direction = absDx > absDy
      ? (dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT)
      : (dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);

    if (locked()) return;
    onMove(direction);
  }

  document.addEventListener('keydown', handleKeydown);
  target.addEventListener('touchstart', handleTouchStart, { passive: true });
  target.addEventListener('touchmove', handleTouchMove, { passive: false });
  target.addEventListener('touchend', handleTouchEnd);

  return function detach() {
    document.removeEventListener('keydown', handleKeydown);
    target.removeEventListener('touchstart', handleTouchStart);
    target.removeEventListener('touchmove', handleTouchMove);
    target.removeEventListener('touchend', handleTouchEnd);
  };
}

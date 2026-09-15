export function initGameOverModal(elements, { onSubmit, onPlayAgain }) {
  const { overlayEl, finalScoreEl, formEl, nameInputEl, playAgainBtn } = elements;

  function show(score) {
    finalScoreEl.textContent = String(score);
    nameInputEl.value = '';
    overlayEl.hidden = false;
    nameInputEl.focus();
  }

  function hide() {
    overlayEl.hidden = true;
  }

  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInputEl.value.trim() || 'Anonymous';
    hide();
    onSubmit(name);
  });

  playAgainBtn.addEventListener('click', () => {
    hide();
    onPlayAgain();
  });

  return { show, hide };
}

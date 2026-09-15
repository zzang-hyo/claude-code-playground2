import { subscribeToLeaderboard } from '../firebase/leaderboard.js';

function formatEntry(entry, rank) {
  const li = document.createElement('li');
  li.innerHTML = `
    <span class="rank">${rank}</span>
    <span class="name"></span>
    <span class="score">${entry.score}</span>
  `;
  li.querySelector('.name').textContent = entry.name || 'Anonymous';
  return li;
}

export function initLeaderboardView({ listEl, statusEl }) {
  subscribeToLeaderboard(
    (entries) => {
      listEl.innerHTML = '';
      if (entries.length === 0) {
        statusEl.textContent = '아직 등록된 점수가 없어요. 첫 기록을 남겨보세요!';
        statusEl.hidden = false;
        return;
      }
      statusEl.hidden = true;
      entries.forEach((entry, index) => {
        listEl.appendChild(formatEntry(entry, index + 1));
      });
    },
    () => {
      statusEl.textContent = '실시간 랭킹을 불러올 수 없어요. Firebase 설정을 확인해주세요 (SETUP.md 참고).';
      statusEl.hidden = false;
    },
  );
}

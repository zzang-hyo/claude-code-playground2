import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig.js';

let db = null;

if (isFirebaseConfigured()) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '[2048] Firebase is not configured yet — the leaderboard will stay empty. ' +
      'Copy .env.example to .env and fill in your Firebase project values (see SETUP.md).',
  );
}

export function getDb() {
  return db;
}

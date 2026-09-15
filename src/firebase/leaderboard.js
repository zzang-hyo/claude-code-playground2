import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from './firebaseClient.js';

const SCORES_COLLECTION = 'scores';
const TOP_N = 50;

export async function addScore({ name, score }) {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase is not configured — see SETUP.md to connect your own project.');
  }
  await addDoc(collection(db, SCORES_COLLECTION), {
    name: String(name).slice(0, 20),
    score: Math.max(0, Math.floor(score)),
    timestamp: serverTimestamp(),
  });
}

// Subscribes to the top scores in real time. Calls onUpdate(entries) on the
// initial snapshot and again whenever any client's score is added, giving
// every open leaderboard a live view with no polling. Returns an unsubscribe
// function; if Firebase isn't configured, calls onError once and returns a
// no-op unsubscribe so callers don't need to branch on setup state.
export function subscribeToLeaderboard(onUpdate, onError) {
  const db = getDb();
  if (!db) {
    if (onError) onError(new Error('firebase-not-configured'));
    return () => {};
  }

  const q = query(collection(db, SCORES_COLLECTION), orderBy('score', 'desc'), limit(TOP_N));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(entries);
    },
    (error) => {
      if (onError) onError(error);
    },
  );
}

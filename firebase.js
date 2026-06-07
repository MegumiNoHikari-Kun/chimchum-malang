// firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ── FIREBASE CONFIG ─────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAGnCd4162tVEu_ADZBXN5CNE_7C_muCXA",
  authDomain: "chimchum-malang.firebaseapp.com",
  projectId: "chimchum-malang",
  storageBucket: "chimchum-malang.firebasestorage.app",
  messagingSenderId: "224277456881",
  appId: "1:224277456881:web:4583b5897ba1c23df68650"
};
// ────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// anonymous login
signInAnonymously(auth).catch((err) => {
  console.error('Anonymous sign-in gagal:', err.message);
});

// auth listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Auth OK UID:', user.uid, '| anonymous:', user.isAnonymous);
  } else {
    console.warn('User belum login');
  }
});

// ✅ EXPORT SEMUA YANG DIPAKAI FRONTEND
export {
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
};

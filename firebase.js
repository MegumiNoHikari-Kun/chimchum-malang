// firebase.js — ChimChum Malang
// Digunakan oleh: index.html & admin.html

import { initializeApp }      from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, where
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ── GANTI DENGAN CONFIG FIREBASE PROJECT KAMU ───────────────
const firebaseConfig = {
  apiKey            : 'GANTI_API_KEY',
  authDomain        : 'GANTI_PROJECT_ID.firebaseapp.com',
  projectId         : 'GANTI_PROJECT_ID',
  storageBucket     : 'GANTI_PROJECT_ID.appspot.com',
  messagingSenderId : 'GANTI_MESSAGING_SENDER_ID',
  appId             : 'GANTI_APP_ID',
};
// ────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// Auto anonymous sign-in untuk index.html (pelanggan)
// Admin menggunakan signInWithEmailAndPassword secara terpisah
signInAnonymously(auth).catch((err) => {
  // Diabaikan jika sudah ada sesi login admin
  if (err.code !== 'auth/operation-not-allowed') {
    console.warn('Anonymous sign-in:', err.message);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Auth OK —', user.isAnonymous ? 'Anonymous' : user.email);
  }
});

export {
  db, auth,
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, where,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
};

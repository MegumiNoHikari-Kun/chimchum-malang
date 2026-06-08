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
  apiKey: "AIzaSyAGnCd4162tVEu_ADZBXN5CNE_7C_muCXA",
  authDomain: "chimchum-malang.firebaseapp.com",
  projectId: "chimchum-malang",
  storageBucket: "chimchum-malang.firebasestorage.app",
  messagingSenderId: "224277456881",
  appId: "1:224277456881:web:4583b5897ba1c23df68650"
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

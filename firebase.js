// firebase.js — ChimChum Malang
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

const firebaseConfig = {
  apiKey            : "AIzaSyAGnCd4162tVEu_ADZBXN5CNE_7C_muCXA",
  authDomain        : "chimchum-malang.firebaseapp.com",
  projectId         : "chimchum-malang",
  storageBucket     : "chimchum-malang.firebasestorage.app",
  messagingSenderId : "224277456881",
  appId             : "1:224277456881:web:4583b5897ba1c23df68650"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// Tunggu auth siap sebelum halaman bisa query Firestore.
// onAuthStateChanged akan trigger setelah signInAnonymously selesai.
export const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('Auth OK —', user.isAnonymous ? 'Anonymous' : user.email);
      resolve(user);
    } else {
      // Belum ada sesi → login anonymous
      signInAnonymously(auth).catch((err) => {
        console.error('Anonymous sign-in gagal:', err.message);
        resolve(null); // tetap resolve agar app tidak hang
      });
    }
  });
});

export {
  db, auth,
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, where,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
};

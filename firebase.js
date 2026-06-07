// firebase.js
import { initializeApp }           from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection,
         getDocs, addDoc,
         serverTimestamp }          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth, signInAnonymously,
         onAuthStateChanged }       from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

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

// Auto anonymous sign-in — wajib karena Firestore rules butuh request.auth != null
signInAnonymously(auth).catch((err) => {
  console.error('Anonymous sign-in gagal:', err.message);
});

// Optional: pantau status auth
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Auth OK — UID:', user.uid, '| anonymous:', user.isAnonymous);
  } else {
    console.warn('User belum login');
  }
});

export { db, collection, getDocs, addDoc, serverTimestamp };

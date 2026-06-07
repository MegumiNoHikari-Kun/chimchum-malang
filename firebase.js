import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "chimchum-malang.firebaseapp.com",
  projectId: "chimchum-malang",
  storageBucket: "chimchum-malang.firebasestorage.app",
  messagingSenderId: "224277456881",
  appId: "1:224277456881:web:4583b5897ba1c23df68650"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {
  db,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
};

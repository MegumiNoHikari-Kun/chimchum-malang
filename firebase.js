import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGnCd4162tVEu_ADZBXN5CNE_7C_muCXA",
  authDomain: "chimchum-malang.firebaseapp.com",
  projectId: "chimchum-malang",
  storageBucket: "chimchum-malang.firebasestorage.app",
  messagingSenderId: "224277456881",
  appId: "1:224277456881:web:4583b5897ba1c23df68650"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db, collection, getDocs };

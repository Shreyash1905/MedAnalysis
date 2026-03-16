import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCiibwpIJHw5u4Q2QD_i3TkpTC7q4s4NMc",
  authDomain: "shreyas190.firebaseapp.com",
  projectId: "shreyas190",
  storageBucket: "shreyas190.firebasestorage.app",
  messagingSenderId: "360064788850",
  appId: "1:360064788850:web:8cc3b1b17b61261f0e95eb",
  measurementId: "G-G34R2L2J2P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, analytics };

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtX_JxwZSejE7lfFUowUnAUZPUCgPgubg",
  authDomain: "ahmad-web-5db03.firebaseapp.com",
  projectId: "ahmad-web-5db03",
  storageBucket: "ahmad-web-5db03.firebasestorage.app",
  messagingSenderId: "814055418138",
  appId: "1:814055418138:web:eb57afaa0192b4bb1ce4a3",
  measurementId: "G-C50Y9F0K2H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
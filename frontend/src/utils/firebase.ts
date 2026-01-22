import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvi0lyLHcjEXM2rvnXu9lVyr7Rjjz9jls",
  authDomain: "leetcode-clone-3ac0a.firebaseapp.com",
  projectId: "leetcode-clone-3ac0a",
  storageBucket: "leetcode-clone-3ac0a.firebasestorage.app",
  messagingSenderId: "624735688161",
  appId: "1:624735688161:web:dc397856c9212f50c96ea0",
  measurementId: "G-6LS7BF303Z"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
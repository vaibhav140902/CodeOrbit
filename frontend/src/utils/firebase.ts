import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjjsbl9eSDWSmfrWpFPap2uGuwONZ2N4g",
  authDomain: "leetcode-clone-c39eb.firebaseapp.com",
  projectId: "leetcode-clone-c39eb",
  storageBucket: "leetcode-clone-c39eb.appspot.com",
  messagingSenderId: "66814187798",
  appId: "1:66814187798:web:a6b3702e191448722dd837"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
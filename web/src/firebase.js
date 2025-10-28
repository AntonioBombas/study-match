import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCqIjWt57Z3t5BN1pcdz1wSBA9YrdHo1ss",  // Certifica-te que esta chave é a correta
  authDomain: "study-match-mvp.firebaseapp.com",
  projectId: "study-match-mvp",
  storageBucket: "study-match-mvp.firebasestorage.app",
  messagingSenderId: "10661284937",
  appId: "1:10661284937:web:0a99f9c9bbb157aa1d0398",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;


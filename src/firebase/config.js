import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDt_B5qojMuC5tk_1zWOG3ge33V82GLB9Q",
  authDomain: "faltah-enterprice-project.firebaseapp.com",
  projectId: "faltah-enterprice-project",
  storageBucket: "faltah-enterprice-project.firebasestorage.app",
  messagingSenderId: "706919345750",
  appId: "1:706919345750:web:284aefeb8f4f4ad48955f7",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
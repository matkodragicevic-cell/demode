import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "OVDJE_TVOJ_API_KEY",
  authDomain: "demode-evidencija-gostiju.firebaseapp.com",
  projectId: "demode-evidencija-gostiju",
  storageBucket: "OVDJE_TVOJ_STORAGE",
  messagingSenderId: "OVDJE_TVOJ_SENDER_ID",
  appId: "OVDJE_TVOJ_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

signInAnonymously(auth).catch((error) => {
  console.error("Anonimna prijava neuspješna:", error);
});

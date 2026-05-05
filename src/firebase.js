import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2L4MZfrZbgV_XZdhpmMmh3_EJfUUfrHM",
  authDomain: "demode-evidencija-gostiju.firebaseapp.com",
  projectId: "demode-evidencija-gostiju",
  storageBucket: "demode-evidencija-gostiju.firebasestorage.app",
  messagingSenderId: "575181335280",
  appId: "1:575181335280:web:53530ab9ad29c5b655f035"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These are placeholders. In a real production environment, 
// these would be populated from environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyAs-Placeholder-Key",
  authDomain: "ecowatch-cs.firebaseapp.com",
  projectId: "ecowatch-cs",
  storageBucket: "ecowatch-cs.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);

// Fix: Use parameterless getAuth and getFirestore to avoid TypeScript type mismatch between modular and compat FirebaseApp interfaces
export const auth = getAuth();
export const firestore = getFirestore();

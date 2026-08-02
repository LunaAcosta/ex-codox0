import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAp7r8x4HDsVv1BskwF5RoPFNOaygxcydo",
  authDomain: "expense-tracker-ai-54228.firebaseapp.com",
  projectId: "expense-tracker-ai-54228",
  storageBucket: "expense-tracker-ai-54228.firebasestorage.app",
  messagingSenderId: "3303957851",
  appId: "1:3303957851:web:f492db4bbd8576a21a667e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firebase = getFirestore(app);

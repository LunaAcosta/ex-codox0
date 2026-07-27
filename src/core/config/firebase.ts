// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAp7r8x4HDsVv1BskwF5RoPFNOaygxcydo",
  authDomain: "expense-tracker-ai-54228.firebaseapp.com",
  projectId: "expense-tracker-ai-54228",
  storageBucket: "expense-tracker-ai-54228.firebasestorage.app",
  messagingSenderId: "3303957851",
  appId: "1:3303957851:web:f492db4bbd8576a21a667e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// auth 
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// db
export const firebase = getFirestore(app);
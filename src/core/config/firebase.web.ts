import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseOptions } from "./firebaseOptions";

const app = getApps().length ? getApp() : initializeApp(firebaseOptions);

export const auth = getAuth(app);
export const firebase = getFirestore(app);
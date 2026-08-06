import type { FirebaseOptions } from "firebase/app";

export const firebaseOptions: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredFirebaseValues = [
  ["EXPO_PUBLIC_FIREBASE_API_KEY", firebaseOptions.apiKey],
  ["EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", firebaseOptions.authDomain],
  ["EXPO_PUBLIC_FIREBASE_PROJECT_ID", firebaseOptions.projectId],
  ["EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", firebaseOptions.storageBucket],
  ["EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", firebaseOptions.messagingSenderId],
  ["EXPO_PUBLIC_FIREBASE_APP_ID", firebaseOptions.appId],
] as const;

const invalidFirebaseValues = requiredFirebaseValues
  .filter(([, value]) => !value || value.toLowerCase().includes("your_"))
  .map(([name]) => name);

if (invalidFirebaseValues.length > 0) {
  throw new Error(
    `Configura correctamente estas variables de Firebase en .env: ${invalidFirebaseValues.join(", ")}`,
  );
}

if (!/^AIza[0-9A-Za-z_-]{30,}$/.test(firebaseOptions.apiKey!)) {
  throw new Error("EXPO_PUBLIC_FIREBASE_API_KEY no tiene un formato válido.");
}

if (!/^1:\d+:(web|android|ios):[0-9A-Za-z]+$/.test(firebaseOptions.appId!)) {
  throw new Error("EXPO_PUBLIC_FIREBASE_APP_ID no tiene un formato válido.");
}
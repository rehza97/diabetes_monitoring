// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnSRfx07sXzSaCpHe1QSHcePubrZcbrws",
  authDomain: "diabetes-monitoring-app-8e131.firebaseapp.com",
  projectId: "diabetes-monitoring-app-8e131",
  storageBucket: "diabetes-monitoring-app-8e131.firebasestorage.app",
  messagingSenderId: "451244213129",
  appId: "1:451244213129:web:d10f0e58129198c4b4d758"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;

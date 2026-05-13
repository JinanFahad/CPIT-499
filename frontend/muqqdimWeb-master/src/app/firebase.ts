// =====================================================================
// firebase.ts — Firebase setup (used only for authentication)
// =====================================================================
// We use Firebase Authentication to handle user signup/login/logout.
// Firestore and Realtime Database are NOT used here —
// all application data (projects, reports, etc.) lives in the SQLite
// database served by the Python (Flask) backend.
//
// The exported `auth` object is what the rest of the app imports to call:
//   - signInWithEmailAndPassword
//   - createUserWithEmailAndPassword
//   - signOut
//   - onAuthStateChanged
// =====================================================================

// initializeApp creates a Firebase app instance from a config object.
// getAuth returns the Authentication service tied to that app.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase project configuration for "muqaddim-499".
// These values are public and safe to expose — Firebase secures access via
// security rules + the authDomain whitelist, not by hiding these keys.
const firebaseConfig = {
  apiKey: "AIzaSyBWDeaULBoFjFyC32JaflTTjLwjbssdnqY",
  authDomain: "muqaddim-499.firebaseapp.com",
  projectId: "muqaddim-499",
  storageBucket: "muqaddim-499.firebasestorage.app",
  messagingSenderId: "196672352751",
  appId: "1:196672352751:web:76601b0338ddcbccaac61a",
};

// Initialize the Firebase app once (Firebase caches it internally)
const app = initializeApp(firebaseConfig);

// `auth` is the singleton used everywhere we touch authentication.
// Example usage in another file:
//   import { auth } from "../firebase";
//   await signInWithEmailAndPassword(auth, email, password);
export const auth = getAuth(app);
export default app;

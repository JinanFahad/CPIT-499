import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase config values are intentionally public.
// Access is protected by Firebase Security Rules and auth settings.
const firebaseConfig = {
  apiKey: "AIzaSyBWDeaULBoFjFyC32JaflTTjLwjbssdnqY",
  authDomain: "muqaddim-499.firebaseapp.com",
  projectId: "muqaddim-499",
  storageBucket: "muqaddim-499.firebasestorage.app",
  messagingSenderId: "196672352751",
  appId: "1:196672352751:web:76601b0338ddcbccaac61a",
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export default app;

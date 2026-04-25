// =====================================================================
// firebase.ts — إعداد Firebase للمصادقة (تسجيل دخول/خروج)
// نستخدم Firebase Authentication فقط لإدارة المستخدمين
// (مو Firestore أو Realtime Database — البيانات في SQLite عند الباك اند)
// =====================================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// إعدادات Firebase الخاصة بمشروع muqaddim-499
const firebaseConfig = {
  apiKey: "AIzaSyBWDeaULBoFjFyC32JaflTTjLwjbssdnqY",
  authDomain: "muqaddim-499.firebaseapp.com",
  projectId: "muqaddim-499",
  storageBucket: "muqaddim-499.firebasestorage.app",
  messagingSenderId: "196672352751",
  appId: "1:196672352751:web:76601b0338ddcbccaac61a",
};

const app = initializeApp(firebaseConfig);

// auth = الكائن اللي نستخدمه في كل التطبيق للمصادقة
// مثل: signInWithEmailAndPassword, signOut, onAuthStateChanged
export const auth = getAuth(app);
export default app;
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

const KEYS = {
  isAuthenticated: "isAuthenticated",
  userEmail: "userEmail",
  userName: "userName",
  userId: "userId",
  user: "user",
} as const;


const GOV_SESSION_KEY = "gov_session_id";


export function getUserId(): string {
  return auth.currentUser?.uid || localStorage.getItem(KEYS.userId) || "";
}


export function getUserName(fallback = ""): string {
  return localStorage.getItem(KEYS.userName) || fallback;
}


export function setAuthUser(opts: { email?: string | null; name?: string }): void {
  localStorage.setItem(KEYS.isAuthenticated, "true");
  if (opts.email !== undefined) {
    localStorage.setItem(KEYS.userEmail, opts.email ?? "");
  }
  if (opts.name) {
    localStorage.setItem(KEYS.userName, opts.name);
  }
}


export function setUserName(name: string): void {
  localStorage.setItem(KEYS.userName, name);
}


export function clearAuthData(): void {
  localStorage.removeItem(KEYS.user);
  localStorage.removeItem(KEYS.userId);
  localStorage.removeItem(KEYS.userName);
  localStorage.removeItem(KEYS.userEmail);
  localStorage.removeItem(KEYS.isAuthenticated);
  sessionStorage.removeItem(GOV_SESSION_KEY);
}


export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Sign out failed", e);
  }
  clearAuthData();
}

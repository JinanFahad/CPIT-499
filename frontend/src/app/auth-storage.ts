// Centralized helpers for reading/writing the authenticated user's data
// in localStorage. Every page that used to call `localStorage.getItem("userId")`
// or scatter the same magic strings around should import from here instead.
//
// Why this file exists:
//   - Firebase is the source of truth for the signed-in user, but we mirror
//     a few fields (uid, email, displayName) to localStorage so the UI can
//     render them synchronously on first paint, before Firebase resolves.
//   - Keeping the keys in one place avoids the silent-bug class where one
//     page writes "userId" and another reads "userID".
//   - Logout has to clear ALL of these keys atomically — that's why it's a
//     single function instead of being copy-pasted in every caller.
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

// The exact localStorage key names. Treat these as opaque — never inline
// the string literal anywhere else in the codebase.
const KEYS = {
  isAuthenticated: "isAuthenticated",
  userEmail: "userEmail",
  userName: "userName",
  userId: "userId",
  // Legacy key, no longer written but still cleared on logout for users who
  // signed up before the migration.
  user: "user",
} as const;

// The session-storage key used by the government chat to preserve a session
// across page reloads within the same tab. Cleared on logout so the next
// user doesn't inherit the previous user's chat.
const GOV_SESSION_KEY = "gov_session_id";

/**
 * Returns the current user's ID. Prefers the live Firebase value (always
 * up to date), falling back to the cached localStorage value (useful before
 * Firebase's auth listener has fired), and finally an empty string.
 */
export function getUserId(): string {
  return auth.currentUser?.uid || localStorage.getItem(KEYS.userId) || "";
}

/**
 * Returns the cached display name, or `fallback` if no name is stored.
 * Pages typically pass a localized "User" / "المستخدم" string as the fallback.
 */
export function getUserName(fallback = ""): string {
  return localStorage.getItem(KEYS.userName) || fallback;
}

/**
 * Records that a user just signed in or signed up. Called from the auth
 * page after Firebase confirms the credentials.
 *
 * `name` is optional because the sign-in flow doesn't know the name —
 * it gets pulled from Firebase later. The sign-up flow does pass it.
 */
export function setAuthUser(opts: { email?: string | null; name?: string }): void {
  localStorage.setItem(KEYS.isAuthenticated, "true");
  if (opts.email !== undefined) {
    localStorage.setItem(KEYS.userEmail, opts.email ?? "");
  }
  if (opts.name) {
    localStorage.setItem(KEYS.userName, opts.name);
  }
}

/**
 * Updates the cached display name. Called after the user edits their name
 * on the profile page so the header reflects the change immediately.
 */
export function setUserName(name: string): void {
  localStorage.setItem(KEYS.userName, name);
}

/**
 * Removes every piece of auth-related data from local + session storage.
 * Idempotent — safe to call even when the user is already logged out.
 */
export function clearAuthData(): void {
  localStorage.removeItem(KEYS.user);
  localStorage.removeItem(KEYS.userId);
  localStorage.removeItem(KEYS.userName);
  localStorage.removeItem(KEYS.userEmail);
  localStorage.removeItem(KEYS.isAuthenticated);
  sessionStorage.removeItem(GOV_SESSION_KEY);
}

/**
 * Full sign-out flow: tell Firebase to drop the session, then wipe the
 * mirrored data so the next paint matches reality. Used by the Header
 * logout button and the Profile page logout button.
 *
 * Errors from `signOut` are logged but never thrown — the user clicked
 * "log out" and we should always end up in the logged-out state.
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Sign out failed", e);
  }
  clearAuthData();
}

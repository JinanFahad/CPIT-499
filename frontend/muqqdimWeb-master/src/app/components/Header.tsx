// ── Library and utility imports ──────────────────────────────────────

// useState and useEffect: React hooks for managing state and side effects
import { useState, useEffect } from "react";

// Link and useNavigate: from react-router for SPA navigation (no full reload)
import { Link, useNavigate } from "react-router";

// Icons from lucide-react (modern icon library)
import { ChevronDown, User, FolderOpen, LogOut } from "lucide-react";

// Firebase Authentication functions:
//   - signOut: ends the user's session
//   - onAuthStateChanged: listens to login/logout state changes
import { onAuthStateChanged, signOut } from "firebase/auth";

// Logo paths (light version for dark mode, dark version for light mode)
const logoImage = "/assets/logo-header-light.png";
const logoDark = "/assets/logo-header-dark.png";

// Toggle button components (defined in separate files)
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

// Contexts: a way to share data across components without passing props manually
//   - useTheme: gives access to the current theme (light/dark)
//   - useLanguage: gives access to the current language (ar/en) and the t() helper
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

// Firebase project configuration (from firebase.ts)
import { auth } from "../firebase";

// =====================================================================
// Header component
// =====================================================================
export function Header() {
  // ── State ──────────────────────────────────────────────────────────
  // useState gives us a value + a setter function that re-renders on update

  // Whether the user dropdown menu is currently open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // The user's display name shown in the top button
  const [userName, setUserName] = useState("");

  // Programmatic navigation tool (used for redirects, e.g. after logout)
  const navigate = useNavigate();

  // Read the current theme (light/dark) from ThemeContext
  const { theme } = useTheme();

  // Read the current language and translation helper from LanguageContext
  const { t, language } = useLanguage();
  const isAr = language === "ar"; // shorthand for Arabic check

  // ── Auto-fetch the user name when Firebase auth state changes ──────
  // useEffect runs the code inside on mount and whenever its deps change.
  // onAuthStateChanged sets up a listener — every time login state changes,
  // the callback fires with the current user object (or null if signed out).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Priority order for the displayed name:
      //   1) displayName from Firebase (most accurate, always up to date)
      //   2) localStorage (fallback if Firebase hasn't saved it yet)
      //   3) Default text "المستخدم" / "User"
      const name =
        user?.displayName ||
        localStorage.getItem("userName") ||
        (isAr ? "المستخدم" : "User");
      setUserName(name);
    });

    // When this component unmounts, unsubscribe the listener (memory cleanup)
    return () => unsubscribe();
  }, [isAr]); // re-run if language changes (so the fallback text updates)

  // ── Logout function ────────────────────────────────────────────────
  // Steps in order:
  //   1) signOut from Firebase (most important — ProtectedRoute uses this)
  //   2) Clear all user data from localStorage
  //   3) Clear the government chat session (prevent leaking between users)
  //   4) Redirect to the landing page
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out failed", e);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("gov_session_id");
    navigate("/");
  };

  // ── Smooth-scroll to a section on the dashboard page ───────────────
  // When a nav link (like "Services") is clicked from any page:
  //   1) First navigate to /dashboard
  //   2) Wait 100ms for the page to render
  //   3) Then smoothly scroll to the target section
  const handleNavClick = (sectionId: string) => {
    navigate("/dashboard");
    setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ── UI (JSX) ───────────────────────────────────────────────────────
  return (
    // The header stays pinned to the top while scrolling (sticky).
    // z-50 ensures it floats above any other element.
    <header className="sticky top-0 z-50 bg-white dark:bg-[#072520]">
      {/* Main bar with bottom border and a subtle shadow */}
      <div className="border-b border-gray-200 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 py-3">
          {/* The CSS direction flips based on language so layout order is correct:
              - Arabic: user on right, logo on left
              - English: the opposite */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              direction: isAr ? "ltr" : "rtl",
            }}
          >
            {/* ════════════════ Section 1: User menu + toggle buttons ════════════════ */}
            <div className="relative flex items-center gap-2">
              {/* User name button — clicking it opens/closes the dropdown */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-white dark:bg-gray-100 rounded-md px-3 py-1.5 border border-gray-300 dark:border-gray-400 hover:border-[#08312D] hover:bg-gray-50 transition-colors"
              >
                {/* Avatar (gold square with a person icon) */}
                <div className="w-7 h-7 rounded-md bg-[#08312D] dark:bg-[#C6A75E] flex items-center justify-center">
                  <User className="w-4 h-4 text-white dark:text-[#08312D]" />
                </div>

                {/* The user's name */}
                <span className="text-[#08312D] dark:text-gray-900 text-sm font-semibold">
                  {userName}
                </span>

                {/* Chevron rotates 180° when the menu is open */}
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 dark:text-gray-700 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* ── Dropdown menu — only renders when isDropdownOpen is true ── */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#0E4A43] rounded-md shadow-xl border border-gray-200 dark:border-[#C6A75E]/30 overflow-hidden z-50">
                  {/* Profile link */}
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-3 text-[#08312D] dark:text-white hover:bg-gray-50 dark:hover:bg-[#08312D] transition-colors text-sm border-b border-gray-100 dark:border-white/10"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>{t("header.profile")}</span>
                  </Link>

                  {/* My Projects link */}
                  <Link
                    to="/dashboard/my-projects"
                    className="flex items-center gap-3 px-4 py-3 text-[#08312D] dark:text-white hover:bg-gray-50 dark:hover:bg-[#08312D] transition-colors text-sm border-b border-gray-100 dark:border-white/10"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>{t("header.myProjects")}</span>
                  </Link>

                  {/* Logout button (red to signal a destructive action) */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors w-full text-left text-sm"
                  >
                    <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      {t("header.logout")}
                    </span>
                  </button>
                </div>
              )}

              {/* Thin vertical divider between the user menu and the toggles */}
              <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

              {/* Light/dark mode toggle */}
              <ThemeToggle />

              {/* Arabic/English language toggle */}
              <LanguageToggle />
            </div>

            {/* ════════════════ Section 2: Section links + logo ════════════════ */}
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              {/* Links are only shown on medium screens and up (md:flex).
                  On mobile they are hidden to save space. */}
              <div className="hidden md:flex items-center gap-7">
                {/* "Services" link — uses scrollIntoView to jump to the services section */}
                <button
                  onClick={() => handleNavClick("services")}
                  className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-sm font-semibold"
                >
                  {t("header.services")}
                </button>

                {/* "About Us" link */}
                <button
                  onClick={() => handleNavClick("about")}
                  className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-sm font-semibold"
                >
                  {t("header.about")}
                </button>

                {/* "Home" link */}
                <button
                  onClick={() => handleNavClick("home")}
                  className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-sm font-semibold"
                >
                  {t("header.home")}
                </button>
              </div>

              {/* Vertical divider between the links and the logo (large screens only) */}
              <div className="hidden md:block w-px h-9 bg-gray-200 dark:bg-white/10" />

              {/* Logo — also a link to the dashboard.
                  Swaps based on theme: dark logo on light bg, light logo on dark bg */}
              <Link to="/dashboard" className="flex items-center">
                <img
                  src={theme === "light" ? logoDark : logoImage}
                  alt="مُقدِّم"
                  className="h-14 w-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

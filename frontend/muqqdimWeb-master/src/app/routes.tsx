// =====================================================================
// routes.tsx — Defines all routes (URLs ↔ page components) in the app
// =====================================================================
// Public routes (no login required):
//   /         → LandingPage   (the marketing page)
//   /auth     → AuthPageNew   (login + signup)
//
// Protected routes (require an active Firebase session):
//   /dashboard/...  → all the post-login pages
//
// Anything that doesn't match shows the NotFound page.
// =====================================================================


// react-router APIs:
//   - createBrowserRouter: builds the route table
//   - Navigate:            redirect component (for protecting routes)
import { createBrowserRouter, Navigate } from "react-router";

// React hooks for the auth-state listener inside ProtectedRoute
import { useEffect, useState } from "react";

// Firebase: listener that fires whenever the user logs in or out
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// All page components — one import per page
import LandingPage from "./pages/LandingPage";
import AuthPageNew from "./pages/AuthPageNew";
import MainDashboard from "./pages/MainDashboard";
import FeasibilityStudyPage from "./pages/FeasibilityStudyPage";
import EditProjectPage from "./pages/EditProjectPage";
import ConsultantPage from "./pages/ConsultantPage";
import ConsultantChatPage from "./pages/ConsultantChatPage";
import GovernmentProceduresPage from "./pages/GovernmentProceduresPage";
import PitchDeckPage from "./pages/PitchDeckPage";
import MarketAnalysisPage from "./pages/MarketAnalysisPage";
import FeasibilityReport from "./pages/FeasibilityReport";
import MyProjectsPageNew from "./pages/MyProjectsPageNew";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";


/**
 * ProtectedRoute — wraps any page that requires the user to be logged in.
 *
 * Why we use Firebase's listener instead of just reading localStorage:
 *   - Firebase is the source of truth for auth state.
 *   - If the user signs out from anywhere (even another tab), this updates.
 *   - More secure than trusting a localStorage flag the user could fake.
 *
 * Behavior:
 *   - While Firebase is checking → show a loading message
 *   - If not authenticated       → redirect to /auth
 *   - If authenticated           → render the protected children
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Two pieces of state: are we still checking? and is the user logged in?
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Subscribe to auth changes. The callback fires once on mount
    // with the current state, then again every time it changes.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user);  // !!user → true if user object exists, else false
      setLoading(false);          // we have an answer now
    });
    // Cleanup: stop listening when the component unmounts
    return () => unsubscribe();
  }, []);

  if (loading) return <div>جاري التحميل...</div>;
  if (!authenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}


// =====================================================================
// The main route table — passed to RouterProvider in App.tsx
// =====================================================================
export const router = createBrowserRouter([

  // ── Public routes ─────────────────────────────────────────────────
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/auth",
    Component: AuthPageNew,
  },

  // ── Protected routes — wrapped in <ProtectedRoute /> ──────────────
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <MainDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/feasibility-study",
    element: (
      <ProtectedRoute>
        <FeasibilityStudyPage />
      </ProtectedRoute>
    ),
  },
  {
    // :projectId is a URL parameter (read inside the page via useParams)
    path: "/dashboard/edit-project/:projectId",
    element: (
      <ProtectedRoute>
        <EditProjectPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/consultant",
    element: (
      <ProtectedRoute>
        <ConsultantPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/consultant/chat/:projectId",
    element: (
      <ProtectedRoute>
        <ConsultantChatPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/government-procedures",
    element: (
      <ProtectedRoute>
        <GovernmentProceduresPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/pitch-deck",
    element: (
      <ProtectedRoute>
        <PitchDeckPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/market-analysis",
    element: (
      <ProtectedRoute>
        <MarketAnalysisPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/report/:projectId",
    element: (
      <ProtectedRoute>
        <FeasibilityReport />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/my-projects",
    element: (
      <ProtectedRoute>
        <MyProjectsPageNew />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  // ── Catch-all (any unknown URL) → 404 page ────────────────────────
  {
    path: "*",
    Component: NotFound,
  },
]);

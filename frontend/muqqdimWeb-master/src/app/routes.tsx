// =====================================================================
// routes.tsx — تعريف كل مسارات التطبيق
// المسارات العامة: / (Landing) و /auth (تسجيل الدخول)
// المسارات المحمية (تتطلب تسجيل دخول): كل صفحات /dashboard/*
// =====================================================================

import { createBrowserRouter, Navigate } from "react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
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
 * ProtectedRoute — يلفّ الصفحات اللي تتطلب تسجيل دخول
 * يستخدم Firebase onAuthStateChanged للتحقق من حالة المصادقة الحقيقية
 * (مو localStorage عشان يكون آمن — لو سجّل خروج Firebase يعرف)
 * إذا مو مسجّل دخول → يحوّل لصفحة /auth
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // listener لتغيرات حالة المصادقة (يحدّث تلقائياً بعد signIn/signOut)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>جاري التحميل...</div>;
  if (!authenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/auth",
    Component: AuthPageNew,
  },
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
  {
    path: "*",
    Component: NotFound,
  },
]);
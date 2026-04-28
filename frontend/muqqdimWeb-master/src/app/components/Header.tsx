// =====================================================================
// Header.tsx — الشريط العلوي (يظهر في كل الصفحات بعد تسجيل الدخول)
// يحتوي على: اسم المستخدم + قائمة منسدلة (الملف الشخصي، مشاريعي، تسجيل الخروج)
//          + الشعار + روابط الأقسام + ThemeToggle + LanguageToggle
// تسجيل الخروج: يستدعي Firebase signOut + يمسح كل بيانات localStorage
// =====================================================================

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronDown, User, FolderOpen, LogOut } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
const logoImage = "/assets/logo-header-light.png";
const logoDark = "/assets/logo-header-dark.png";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  // نسمع لحالة Firebase ونحدّث اسم المستخدم تلقائياً
  // (لو غيّره من ProfilePage، يتحدّث هنا فوراً)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const name =
        user?.displayName ||                     // الأولوية لـ Firebase
        localStorage.getItem("userName") ||      // كاحتياط (مثلاً عند التسجيل لأول مرة)
        (isAr ? "المستخدم" : "User");
      setUserName(name);
    });
    return () => unsubscribe();
  }, [isAr]);

  // تسجيل خروج آمن:
  //   1) signOut من Firebase (الأهم — ProtectedRoute يعرف إنه طلع)
  //   2) مسح كل بيانات المستخدم من localStorage
  //   3) مسح session شات الإجراءات الحكومية
  //   4) توجيه لصفحة الهبوط
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

  const handleNavClick = (sectionId: string) => {
    navigate("/dashboard");
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#072520]">
      {/* شريط علوي حكومي رفيع — أخضر داكن (يشبه شارات وزارات السعودية) */}
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #08312D 0%, #0E4A43 50%, #08312D 100%)" }} />

      {/* الشريط الرئيسي */}
      <div className="border-b border-gray-200 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", direction: "ltr" }}>

            {/* اليسار — المستخدم + أزرار */}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-white dark:bg-gray-100 rounded-md px-3 py-1.5 border border-gray-300 dark:border-gray-400 hover:border-[#08312D] hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-[#08312D] dark:bg-primary-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-[#08312D] dark:text-gray-900 text-sm font-semibold">
                  {userName}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-700 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-200 rounded-md shadow-md border border-gray-200 dark:border-gray-300 overflow-hidden z-50">
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-3 text-[#08312D] dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-300 transition-colors text-sm border-b border-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>{t("header.profile")}</span>
                  </Link>
                  <Link
                    to="/dashboard/my-projects"
                    className="flex items-center gap-3 px-4 py-3 text-[#08312D] dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-300 transition-colors text-sm border-b border-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>{t("header.myProjects")}</span>
                  </Link>
                  <button
                    onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left text-sm"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-semibold">{t("header.logout")}</span>
                  </button>
                </div>
              )}

              <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />
              <ThemeToggle />
              <LanguageToggle />
            </div>

            {/* اليمين — ناف + لوقو */}
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              <div className="hidden md:flex items-center gap-7">
                <button
                  onClick={() => handleNavClick("services")}
                  className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-sm font-semibold"
                >
                  {t("header.services")}
                </button>
                <button
                  onClick={() => handleNavClick("about")}
                  className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-sm font-semibold"
                >
                  {t("header.about")}
                </button>
                <button
                  onClick={() => handleNavClick("home")}
                  className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-sm font-semibold"
                >
                  {t("header.home")}
                </button>
              </div>

              <div className="hidden md:block w-px h-9 bg-gray-200 dark:bg-white/10" />

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
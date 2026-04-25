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
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md bg-white/95 dark:bg-[#072520]/90">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", direction: "ltr" }}>

          {/* اليسار — المستخدم + أزرار */}
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-gray-50 dark:bg-gray-100 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-200 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-[#08312D] dark:bg-primary-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#08312D] dark:text-gray-900 text-sm font-medium font-[Changa]">
                {userName}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-700 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-300 overflow-hidden z-50">
                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-3 text-[#08312D] dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-300 transition-all text-sm font-[Changa]"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>{t("header.profile")}</span>
                </Link>
                <Link
                  to="/dashboard/my-projects"
                  className="flex items-center gap-3 px-4 py-3 text-[#08312D] dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-300 transition-all text-sm font-[Changa]"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{t("header.myProjects")}</span>
                </Link>
                <button
                  onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-300 transition-all w-full text-left text-sm font-[Changa]"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">{t("header.logout")}</span>
                </button>
              </div>
            )}

            <ThemeToggle />
            <LanguageToggle />
          </div>

          {/* اليمين — ناف + لوقو */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleNavClick("services")}
                className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-base font-medium font-[Changa]"
              >
                {t("header.services")}
              </button>
              <button
                onClick={() => handleNavClick("about")}
                className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-base font-medium font-[Changa]"
              >
                {t("header.about")}
              </button>
              <Link
                to="/dashboard"
                className="text-[#08312D] dark:text-gray-900 hover:text-[#C6A75E] dark:hover:text-secondary-600 transition-colors text-base font-medium font-[Changa]"
              >
                {t("header.home")}
              </Link>
            </div>

            <Link to="/dashboard" className="flex items-center pl-6">
              <img
                src={theme === "light" ? logoDark : logoImage}
                alt="MOQDDIM"
                className="h-16 w-auto drop-shadow-2xl"
              />
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
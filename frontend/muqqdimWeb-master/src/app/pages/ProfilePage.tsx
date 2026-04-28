// =====================================================================
// ProfilePage.tsx — الملف الشخصي للمستخدم
// مصدر البيانات: Firebase Authentication (الاسم + البريد فقط)
// عند التعديل:
//   - الاسم → يتحدّث في Firebase عبر updateProfile
//   - البريد → للعرض فقط (تغييره يتطلب إعادة مصادقة)
// تتضمّن أيضاً زر تسجيل خروج آمن (signOut من Firebase)
// =====================================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Edit2, Save, Loader2, LogOut, X, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { onAuthStateChanged, updateProfile, signOut, sendPasswordResetEmail } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";

export default function ProfilePage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [email, setEmail] = useState("");

  // ── حالة "تغيير كلمة المرور" ──
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSendResetEmail = async () => {
    if (!email) return;
    setResetLoading(true);
    setResetStatus(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetStatus({
        type: "success",
        msg: isAr
          ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. يرجى التحقق من بريدكم الإلكتروني.`
          : `A password reset link has been sent to ${email}. Please check your email.`,
      });
    } catch (err: any) {
      setResetStatus({
        type: "error",
        msg: isAr ? "تعذّر إرسال الرابط. يرجى المحاولة لاحقاً." : "Failed to send link. Please try again later.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setResetOpen(false);
    setResetStatus(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // الأولوية لـ Firebase displayName، ثم localStorage (لمستخدمين قبل ما نضيف updateProfile)
      const stored = localStorage.getItem("userName");
      let displayName = user.displayName || stored || "";

      // لو Firebase ما عنده الاسم لكن localStorage فيه → نزامنه مع Firebase تلقائياً
      if (!user.displayName && stored && stored.trim()) {
        try {
          await updateProfile(user, { displayName: stored });
          displayName = stored;
        } catch {
          // لو فشل، نكمل عادي (الاسم محفوظ في localStorage)
        }
      }

      if (!displayName) displayName = isAr ? "المستخدم" : "User";

      setName(displayName);
      setOriginalName(displayName);
      setEmail(user.email || "");
    });
    return () => unsubscribe();
  }, [isAr]);

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError(isAr ? "الاسم لا يمكن أن يكون فارغاً." : "Name cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      if (auth.currentUser && name !== originalName) {
        await updateProfile(auth.currentUser, { displayName: name });
        localStorage.setItem("userName", name);
        setOriginalName(name);
      }
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || (isAr ? "تعذّر حفظ التعديلات." : "Failed to save changes."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(originalName);
    setSaveError("");
    setIsEditing(false);
  };

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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-100 py-10 px-4 lg:px-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto">

          {/* ── بانر علوي رسمي ── */}
          <motion.div
            className="bg-white dark:bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* شريط أخضر علوي رفيع */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #08312D 0%, #C6A75E 50%, #08312D 100%)" }} />
            <div className="px-8 py-7 flex items-start gap-5">
              <div className="w-14 h-14 rounded-md bg-[#08312D] flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[#08312D] mb-1">
                  {isAr ? "الملف الشخصي" : "Account Profile"}
                </h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {isAr
                    ? "إدارة معلومات حسابك في منصة مُقدِّم."
                    : "Manage your Muqaddim account information."}
                </p>
              </div>
              <button
                onClick={() => setLogoutConfirm(true)}
                className="flex items-center gap-2 bg-white border border-red-300 hover:bg-red-50 hover:border-red-500 rounded-md px-4 py-2 transition-colors text-sm font-semibold text-red-700 flex-shrink-0 self-center"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{isAr ? "تسجيل الخروج" : "Sign Out"}</span>
              </button>
            </div>
          </motion.div>

          {/* ── معلومات الحساب ── */}
          <motion.div
            className="bg-white dark:bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="text-base font-bold text-[#08312D]">
                {isAr ? "معلومات الحساب" : "Account Information"}
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-white border border-gray-300 hover:border-[#08312D] hover:bg-gray-50 rounded-md px-4 py-2 transition-colors text-sm"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#C6A75E]" />
                  <span className="text-[#08312D] font-semibold">
                    {isAr ? "تعديل الاسم" : "Edit Name"}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-4 py-2 transition-colors text-sm disabled:opacity-60"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-gray-700 font-semibold">
                      {isAr ? "إلغاء" : "Cancel"}
                    </span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-[#08312D] hover:bg-[#0E4A43] rounded-md px-4 py-2 text-white transition-colors text-sm disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span className="font-semibold">
                      {isSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="px-8 py-7 space-y-5">
              {saveError && (
                <div className="px-4 py-3 bg-red-50 border-r-4 border-red-500 text-red-800 rounded-md text-sm">
                  {saveError}
                </div>
              )}

              {/* الاسم الكامل */}
              <div>
                <label className="text-xs text-gray-500 mb-2 flex items-center gap-2 font-semibold uppercase tracking-wide">
                  <User className="w-3.5 h-3.5 text-[#08312D]" />
                  {isAr ? "الاسم الكامل" : "Full Name"}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-[#08312D] focus:border-[#08312D] focus:ring-2 focus:ring-[#08312D]/10 focus:outline-none transition-all"
                    placeholder={isAr ? "أدخلي الاسم الكامل" : "Enter your full name"}
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
                    <p className="text-[#08312D] font-semibold">{name || "—"}</p>
                  </div>
                )}
              </div>

              {/* البريد الإلكتروني */}
              <div>
                <label className="text-xs text-gray-500 mb-2 flex items-center gap-2 font-semibold uppercase tracking-wide">
                  <Mail className="w-3.5 h-3.5 text-[#08312D]" />
                  {isAr ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
                  <p className="text-[#08312D] font-semibold text-sm" dir="ltr">{email || "—"}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── بطاقة الأمان ── */}
          <motion.div
            className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="px-8 py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-bold text-[#08312D]">
                {isAr ? "الأمان" : "Security"}
              </h2>
            </div>
            <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-[#FFF9F0] border border-[#C6A75E]/40 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-[#C6A75E]" />
                </div>
                <div>
                  <p className="text-[#08312D] font-semibold text-sm mb-1">
                    {isAr ? "كلمة المرور" : "Password"}
                  </p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {isAr
                      ? "سنرسل رابطاً إلى بريدكم الإلكتروني لإعادة تعيين كلمة المرور."
                      : "We will send a reset link to your email address."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-[#08312D] hover:bg-gray-50 rounded-md px-5 py-2.5 transition-colors text-sm font-semibold text-[#08312D] whitespace-nowrap"
              >
                <Lock className="w-4 h-4" />
                {isAr ? "تغيير كلمة المرور" : "Change Password"}
              </button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── نافذة تأكيد تغيير كلمة المرور ── */}
      <AnimatePresence>
        {resetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={closeResetModal}
            dir={isAr ? "rtl" : "ltr"}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-md shadow-xl border border-gray-200 max-w-md w-full overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #08312D 0%, #C6A75E 50%, #08312D 100%)" }} />
              <div className="px-7 py-7">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-md bg-[#FFF9F0] border border-[#C6A75E]/40 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-[#C6A75E]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#08312D] mb-1">
                        {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {isAr
                          ? `سنرسل رابطاً إلى بريدكم الإلكتروني (${email}) لإعادة تعيين كلمة المرور.`
                          : `We will send a reset link to your email (${email}).`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeResetModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {resetStatus && (
                  <div
                    className={`rounded-md p-4 mb-4 flex items-start gap-3 ${
                      resetStatus.type === "success"
                        ? "bg-[#FFF9F0] border border-[#C6A75E]/40"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    {resetStatus.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-[#C6A75E] flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm leading-relaxed ${resetStatus.type === "success" ? "text-[#08312D]" : "text-red-800"}`}>
                      {resetStatus.msg}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeResetModal}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 rounded-md py-2.5 text-sm font-semibold text-gray-700 transition-colors"
                  >
                    {resetStatus?.type === "success" ? (isAr ? "إغلاق" : "Close") : (isAr ? "إلغاء" : "Cancel")}
                  </button>
                  {!resetStatus && (
                    <button
                      onClick={handleSendResetEmail}
                      disabled={resetLoading}
                      className="flex-1 bg-[#08312D] hover:bg-[#0E4A43] rounded-md py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {resetLoading
                        ? (isAr ? "جاري الإرسال..." : "Sending...")
                        : (isAr ? "إرسال الرابط" : "Send Link")}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── نافذة تأكيد تسجيل الخروج ── */}
      <AnimatePresence>
        {logoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setLogoutConfirm(false)}
            dir={isAr ? "rtl" : "ltr"}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-md shadow-xl border border-gray-200 max-w-md w-full overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #08312D 0%, #C6A75E 50%, #08312D 100%)" }} />
              <div className="px-7 py-7">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-md bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#08312D] mb-1">
                      {isAr ? "تأكيد تسجيل الخروج" : "Confirm Sign Out"}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {isAr
                        ? "هل أنت متأكدة من رغبتكِ في إنهاء الجلسة؟ سيتم توجيهكِ إلى الصفحة الرئيسية."
                        : "Are you sure you want to end your session? You will be redirected to the home page."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLogoutConfirm(false)}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 rounded-md py-2.5 text-sm font-semibold text-gray-700 transition-colors"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 rounded-md py-2.5 text-sm font-semibold text-white transition-colors"
                  >
                    {isAr ? "تأكيد الخروج" : "Sign Out"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// =====================================================================
// AuthPageNew.tsx — صفحة تسجيل الدخول وإنشاء حساب
// تستخدم Firebase Authentication (signInWithEmailAndPassword + createUserWithEmailAndPassword)
// بعد النجاح: نحفظ بعض البيانات في localStorage كنسخة احتياطية + نوجّه لـ /dashboard
// =====================================================================

import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import { Mail, Lock, User, Eye, EyeOff, Loader2, X, CheckCircle2, AlertCircle, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Sparkle } from "../components/Sparkle";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth";

const logoImage = "/assets/logo-color.png";

export default function AuthPageNew() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar";
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ── حالة "نسيت كلمة المرور؟" ──
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotStatus({
        type: "success",
        msg: isAr
          ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدكم الإلكتروني. يرجى التحقق من صندوق الوارد."
          : "A password reset link has been sent to your email. Please check your inbox.",
      });
      setForgotEmail("");
    } catch (err: any) {
      const msg =
        err?.code === "auth/user-not-found"
          ? (isAr ? "لا يوجد حساب مرتبط بهذا البريد الإلكتروني." : "No account found with this email.")
          : err?.code === "auth/invalid-email"
            ? (isAr ? "البريد الإلكتروني غير صحيح." : "Invalid email address.")
            : (isAr ? "تعذّر إرسال الرابط. يرجى المحاولة لاحقاً." : "Failed to send reset link. Please try again later.");
      setForgotStatus({ type: "error", msg });
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotEmail("");
    setForgotStatus(null);
  };

  // تسجيل دخول بحساب موجود — Firebase يتحقق من البريد وكلمة المرور
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.email,
        loginData.password
      );
      const user = userCredential.user;
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", user.email || "");
      navigate("/dashboard");
    } catch (error: any) {
      setError(isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password");
    }
  };

  // إنشاء حساب جديد + حفظ الاسم في localStorage (Firebase ما يحفظه تلقائياً عند التسجيل)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );
      const user = userCredential.user;

      // نحفظ الاسم على Firebase نفسه (مو في localStorage بس)
      // كذا يطلع في الهيدر والملف الشخصي تلقائياً عبر displayName
      if (registerData.name.trim()) {
        await updateProfile(user, { displayName: registerData.name });
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userName", registerData.name);
      navigate("/dashboard");
    } catch (error: any) {
      setError((isAr ? "حدث خطأ: " : "An error occurred: ") + error.message);
    }
  };

  return (
    <div
      className="min-h-screen flex relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#062620] dark:via-[#08312D] dark:to-[#0a3d37] overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* نجوم متناثرة في الخلفية */}
      <Sparkle className="top-[8%] left-[12%]" size={20} />
      <Sparkle className="top-[20%] right-[15%]" size={14} />
      <Sparkle className="top-[45%] left-[8%]" size={22} />
      <Sparkle className="bottom-[25%] right-[10%]" size={16} />
      <Sparkle className="bottom-[12%] left-[20%]" size={18} />
      <Sparkle className="top-[65%] left-[35%]" size={12} />
      <Sparkle className="top-[15%] left-[40%]" size={10} />
      <Sparkle className="top-[35%] right-[35%]" size={13} />
      <Sparkle className="top-[75%] right-[28%]" size={17} />
      <Sparkle className="bottom-[40%] left-[55%]" size={11} />
      <Sparkle className="top-[55%] right-[55%]" size={15} />

      {/* توهج ذهبي خفيف من الأسفل */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-72 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(198, 167, 94, 0.15) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* زر تبديل اللغة — يمين فوق بالعربي، يسار فوق بالإنجليزي */}
      <button
        onClick={toggleLanguage}
        className={`fixed top-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-gray-300 shadow-md hover:shadow-lg hover:bg-white transition-all text-[#08312D] text-sm font-semibold ${
          isAr ? "right-4" : "left-4"
        }`}
        title={isAr ? "Switch to English" : "التبديل إلى العربية"}
      >
        <Globe className="w-4 h-4 text-[#C6A75E]" />
        {isAr ? "EN" : "ع"}
      </button>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-8 border border-[#C6A75E]/30 card-glow">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-gray-200 dark:bg-[#08312D]/60 dark:border dark:border-[#C6A75E]/20 p-1 rounded-full">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
                isLogin
                  ? "bg-[#08312D] dark:bg-[#C6A75E] text-white dark:text-[#08312D] shadow-lg"
                  : "text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-[#C6A75E]"
              }`}
            >
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </button>

            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
                !isLogin
                  ? "bg-[#08312D] dark:bg-[#C6A75E] text-white dark:text-[#08312D] shadow-lg"
                  : "text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-[#C6A75E]"
              }`}
            >
              {isAr ? "إنشاء حساب" : "Create Account"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm ${isAr ? "text-right" : "text-left"}`}>
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className={`mb-8 ${isAr ? "text-right" : "text-left"}`}>
                <h2 className="text-2xl font-bold text-[#08312D] dark:text-white mb-2">
                  {isAr ? "أهــلاً بــعــودتــك" : "Welcome Back"}
                </h2>
                <p className="text-gray-500 dark:text-white/60 text-sm font-[Changa]">
                  {isAr ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
                </p>
              </div>

              <div>
                <div className="relative">
                  <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isAr ? "right-4" : "left-4"}`} />
                  <Input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder={isAr ? "البريد الإلكتروني" : "Email Address"}
                    className={`w-full bg-white dark:bg-[#08312D]/60 border border-gray-300 dark:border-[#C6A75E]/30 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 rounded-xl py-4 text-base shadow-sm font-[Changa] ${isAr ? "pr-12" : "pl-12"}`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isAr ? "right-4" : "left-4"}`} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder={isAr ? "كلمة المرور" : "Password"}
                    className="w-full pr-12 pl-12 bg-white dark:bg-[#08312D]/60 border border-gray-300 dark:border-[#C6A75E]/30 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 rounded-xl py-4 text-base shadow-sm font-[Changa]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#08312D] transition-colors ${isAr ? "left-4" : "right-4"}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className={`mt-2 ${isAr ? "text-left" : "text-right"}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginData.email);
                      setForgotOpen(true);
                    }}
                    className="text-sm text-[#08312D] hover:text-[#C6A75E] font-semibold transition-colors"
                  >
                    {isAr ? "نسيتِ كلمة المرور؟" : "Forgot Password?"}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#08312D] hover:bg-[#0E4A43] text-white py-4 text-base font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg font-[Changa]"
              >
                {isAr ? "دخول" : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className={`mb-8 ${isAr ? "text-right" : "text-left"}`}>
                <h2 className="text-2xl font-bold text-[#08312D] dark:text-white mb-2">
                  {isAr ? "أهــلاً بــك" : "Welcome"}
                </h2>
                <p className="text-gray-500 dark:text-white/60 text-sm font-[Changa]">
                  {isAr ? "أنشئ حسابك للبدء" : "Create your account to get started"}
                </p>
              </div>

              <div>
                <div className="relative">
                  <User className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isAr ? "right-4" : "left-4"}`} />
                  <Input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder={isAr ? "الاسم الكامل" : "Full Name"}
                    className={`w-full bg-white dark:bg-[#08312D]/60 border border-gray-300 dark:border-[#C6A75E]/30 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 rounded-xl py-4 text-base shadow-sm font-[Changa] ${isAr ? "pr-12" : "pl-12"}`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isAr ? "right-4" : "left-4"}`} />
                  <Input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder={isAr ? "البريد الإلكتروني" : "Email Address"}
                    className={`w-full bg-white dark:bg-[#08312D]/60 border border-gray-300 dark:border-[#C6A75E]/30 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 rounded-xl py-4 text-base shadow-sm font-[Changa] ${isAr ? "pr-12" : "pl-12"}`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isAr ? "right-4" : "left-4"}`} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder={isAr ? "كلمة المرور" : "Password"}
                    className="w-full pr-12 pl-12 bg-white dark:bg-[#08312D]/60 border border-gray-300 dark:border-[#C6A75E]/30 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 rounded-xl py-4 text-base shadow-sm font-[Changa]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#08312D] transition-colors ${isAr ? "left-4" : "right-4"}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#08312D] hover:bg-[#0E4A43] text-white py-4 text-base font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg font-[Changa]"
              >
                {isAr ? "إنشاء حساب" : "Create Account"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Left Side - Logo Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center px-12">
          <div className="mb-8">
            <img src={logoImage} alt="MOQDDIM" className="h-72 w-auto mx-auto drop-shadow-2xl" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#C6A75E]/40 to-[#C6A75E]/40 rounded-full"></div>
          </div>
          <p className={`text-white/90 text-lg max-w-md mx-auto leading-relaxed ${isAr ? "font-[Changa]" : ""}`}
             style={!isAr ? { fontFamily: "'IBM Plex Sans', sans-serif" } : undefined}>
            {isAr ? (
              <>
                منصة ذكية لإنشاء دراسات الجدوى
                <br />
                ومساعدتك في الإجراءات الحكومية
              </>
            ) : (
              <>
                A smart platform for creating feasibility studies
                <br />
                and assisting with government procedures
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── نافذة "نسيت كلمة المرور؟" ── */}
      <AnimatePresence>
        {forgotOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={closeForgot}
            dir={isAr ? "rtl" : "ltr"}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-md shadow-xl border border-gray-200 max-w-md w-full overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* شريط علوي رفيع */}
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
                          ? "أدخلي بريدكِ الإلكتروني وسنرسل لكِ رابطاً لإعادة تعيين كلمة المرور."
                          : "Enter your email and we will send you a link to reset your password."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeForgot}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {forgotStatus ? (
                  /* رسالة نتيجة بعد الإرسال */
                  <div
                    className={`rounded-md p-4 mb-4 flex items-start gap-3 ${
                      forgotStatus.type === "success"
                        ? "bg-[#FFF9F0] border border-[#C6A75E]/40"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    {forgotStatus.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-[#C6A75E] flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm leading-relaxed ${forgotStatus.type === "success" ? "text-[#08312D]" : "text-red-800"}`}>
                      {forgotStatus.msg}
                    </p>
                  </div>
                ) : (
                  /* فورم الإيميل */
                  <form onSubmit={handleForgotPassword}>
                    <label className="text-xs text-gray-500 mb-2 flex items-center gap-2 font-semibold uppercase tracking-wide">
                      <Mail className="w-3.5 h-3.5 text-[#08312D]" />
                      {isAr ? "البريد الإلكتروني" : "Email Address"}
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder={isAr ? "example@domain.com" : "example@domain.com"}
                      className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-[#08312D] focus:border-[#08312D] focus:ring-2 focus:ring-[#08312D]/10 focus:outline-none transition-all mb-4"
                      required
                      autoFocus
                      dir="ltr"
                    />
                  </form>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeForgot}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 rounded-md py-2.5 text-sm font-semibold text-gray-700 transition-colors"
                  >
                    {forgotStatus?.type === "success" ? (isAr ? "إغلاق" : "Close") : (isAr ? "إلغاء" : "Cancel")}
                  </button>
                  {!forgotStatus && (
                    <button
                      onClick={handleForgotPassword}
                      disabled={forgotLoading || !forgotEmail.trim()}
                      className="flex-1 bg-[#08312D] hover:bg-[#0E4A43] rounded-md py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {forgotLoading
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
    </div>
  );
}
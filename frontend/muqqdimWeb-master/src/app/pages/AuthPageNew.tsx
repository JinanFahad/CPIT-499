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
    <div className="min-h-screen flex relative" dir={isAr ? "rtl" : "ltr"}>
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

      {/* Right Side - Form Section (Light) */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-gray-200 p-1 rounded-full">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
                isLogin
                  ? "bg-[#08312D] text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </button>

            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
                !isLogin
                  ? "bg-[#08312D] text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900"
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
                <h2 className="text-2xl font-bold text-[#08312D] mb-2">
                  {isAr ? "أهــلاً بــعــودتــك" : "Welcome Back"}
                </h2>
                <p className="text-gray-500 text-sm font-[Changa]">
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
                    className={`w-full bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa] ${isAr ? "pr-12" : "pl-12"}`}
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
                    className="w-full pr-12 pl-12 bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa]"
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
                <h2 className="text-2xl font-bold text-[#08312D] mb-2">
                  {isAr ? "أهــلاً بــك" : "Welcome"}
                </h2>
                <p className="text-gray-500 text-sm font-[Changa]">
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
                    className={`w-full bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa] ${isAr ? "pr-12" : "pl-12"}`}
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
                    className={`w-full bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa] ${isAr ? "pr-12" : "pl-12"}`}
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
                    className="w-full pr-12 pl-12 bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa]"
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

      {/* Left Side - Logo Section (Dark Green) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#08312D] via-[#0E4A43] to-[#1F2A2A] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[600px] h-[600px] rounded-full border border-white/5"></div>
          <div className="absolute w-[500px] h-[500px] rounded-full border border-white/8"></div>
          <div className="absolute w-[400px] h-[400px] rounded-full border border-white/10"></div>
        </div>

        <div className="relative z-10 text-center px-12">
          <div className="mb-8">
            <img src={logoImage} alt="MOQDDIM" className="h-48 w-auto mx-auto drop-shadow-2xl" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            {isAr ? "مُـقــــدِم" : "MUQADDIM"}
          </h1>
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
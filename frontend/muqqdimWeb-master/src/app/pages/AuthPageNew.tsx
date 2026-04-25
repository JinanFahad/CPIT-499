// =====================================================================
// AuthPageNew.tsx — صفحة تسجيل الدخول وإنشاء حساب
// تستخدم Firebase Authentication (signInWithEmailAndPassword + createUserWithEmailAndPassword)
// بعد النجاح: نحفظ بعض البيانات في localStorage كنسخة احتياطية + نوجّه لـ /dashboard
// =====================================================================

import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const logoImage = "/assets/logo-color.png";

export default function AuthPageNew() {
  const navigate = useNavigate();
  const { language } = useLanguage();
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
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
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
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userName", registerData.name);
      navigate("/dashboard");
    } catch (error: any) {
      setError("حدث خطأ: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
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
              تسجيل الدخول
            </button>

            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
                !isLogin
                  ? "bg-[#08312D] text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              إنشاء حساب
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm text-right">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-right mb-8">
                <h2 className="text-2xl font-bold text-[#08312D] mb-2">
                  {isAr ? "أهــلاً بــعــودتــك" : "Welcome Back"}
                </h2>
                <p className="text-gray-500 text-sm font-[Changa]">
                  {isAr ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
                </p>
              </div>

              <div>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="البريد الإلكتروني"
                    className="w-full pr-12 bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="كلمة المرور"
                    className="w-full pr-12 pl-12 bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#08312D] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#08312D] hover:bg-[#0E4A43] text-white py-4 text-base font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg font-[Changa]"
              >
                دخول
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="text-right mb-8">
                <h2 className="text-2xl font-bold text-[#08312D] mb-2">
                  {isAr ? "أهــلاً بــك" : "Welcome"}
                </h2>
                <p className="text-gray-500 text-sm font-[Changa]">
                  {isAr ? "أنشئ حسابك للبدء" : "Create your account to get started"}
                </p>
              </div>

              <div>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="الاسم الكامل"
                    className="w-full pr-12 bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="البريد الإلكتروني"
                    className="w-full pr-12 bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="كلمة المرور"
                    className="w-full pr-12 pl-12 bg-white border border-gray-300 focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 text-[#08312D] placeholder:text-gray-400 rounded-xl py-4 text-base shadow-sm font-[Changa]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#08312D] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#08312D] hover:bg-[#0E4A43] text-white py-4 text-base font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg font-[Changa]"
              >
                إنشاء حساب
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
          <h1 className="text-5xl font-bold text-white mb-6">مُـقــــدِم</h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#C6A75E]/40 to-[#C6A75E]/40 rounded-full"></div>
          </div>
          <p className="text-white/90 text-lg max-w-md mx-auto leading-relaxed font-[Changa]">
            منصة ذكية لإنشاء دراسات الجدوى
            <br />
            ومساعدتك في الإجراءات الحكومية
          </p>
        </div>
      </div>
    </div>
  );
}
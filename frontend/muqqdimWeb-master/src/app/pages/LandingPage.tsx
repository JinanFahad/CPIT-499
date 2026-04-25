// =====================================================================
// LandingPage.tsx — صفحة الهبوط العامة (المسار /)
// أول صفحة يشوفها أي زائر قبل تسجيل الدخول
// تحتوي على: نبذة عن المنصة + خدماتها + زر للتسجيل/الدخول
// =====================================================================

import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
const logoImage = "/assets/logo-color.png";

export default function LandingPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 lg:p-12 relative overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
      style={{
        background:
          "linear-gradient(135deg, #062620 0%, #08312D 50%, #0a3d37 100%)",
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(198,167,94,0.12) 0%, transparent 70%)",
            top: "-10%",
            right: "-5%",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(8,49,45,0.5) 0%, transparent 70%)",
            bottom: "5%",
            left: "10%",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#C6A75E]/40"
            style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [-15, 15, -15], opacity: [0.3, 0.8, 0.3] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Logo Side */}
          <motion.div
            className="flex justify-center items-center order-2 lg:order-1"
            initial={{ opacity: 0, x: isAr ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative w-[380px] h-[380px] lg:w-[460px] lg:h-[460px] flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(198,167,94,0.2)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-8 rounded-full"
                style={{ border: "1px dashed rgba(198,167,94,0.12)" }}
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(198,167,94,0.08) 0%, transparent 65%)",
                }}
              />
              <motion.img
                src={logoImage}
                alt="مُـقــــدِم"
                className="relative z-10 w-[75%] h-auto drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Text Side */}
          <div className="text-white space-y-8 order-1 lg:order-2">
            <motion.h1
              className="font-bold text-white leading-tight"
              style={{
                fontSize: "clamp(3.5rem, 8vw, 6rem)",
                fontFamily: "Changa, sans-serif",
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              مُـقـــدِم
            </motion.h1>

            <motion.p
              className="text-lg leading-relaxed font-[Changa] max-w-lg"
              style={{ color: "rgba(255,255,255,0.65)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {isAr
                ? "مساعدك الذكي لدراسات الجدوى الاحترافية واتخاذ القرارات الاستثمارية بثقة. نحوّل أفكارك إلى مشاريع ناجحة بذكاء اصطناعي متقدم."
                : "Your smart assistant for professional feasibility studies and confident investment decisions. We turn your ideas into successful projects with advanced AI."}
            </motion.p>

            <motion.div
              className="flex items-center gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Link to="/auth">
                <motion.div
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold font-[Changa] cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(135deg, #C6A75E 0%, #a88f4e 100%)",
                  }}
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 20px 40px rgba(198,167,94,0.35)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  {isAr ? "ابدأ الآن" : "Get Started"}
                  <ArrowLeft
                    className={`w-5 h-5 ${!isAr ? "rotate-180" : ""}`}
                  />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

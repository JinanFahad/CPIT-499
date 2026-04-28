// =====================================================================
// LandingPage.tsx — صفحة الهبوط العامة (المسار /)
// أول صفحة يشوفها أي زائر قبل تسجيل الدخول
// التصميم: ثنائي اللغة (عربي + English) — كلاهما يظهر معاً
// =====================================================================

import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
const logoImage = "/assets/logo-color.png";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 lg:p-12 relative overflow-hidden"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, #062620 0%, #08312D 50%, #0a3d37 100%)",
      }}
    >
      {/* الخلفية المتحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(198,167,94,0.12) 0%, transparent 70%)",
            top: "-10%",
            right: "-5%",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(8,49,45,0.5) 0%, transparent 70%)",
            bottom: "5%",
            left: "10%",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#C6A75E]/40"
            style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [-15, 15, -15], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* جانب الشعار */}
          <motion.div
            className="flex justify-center items-center order-2 lg:order-1"
            initial={{ opacity: 0, x: 60 }}
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
                style={{ background: "radial-gradient(circle, rgba(198,167,94,0.08) 0%, transparent 65%)" }}
              />
              <motion.img
                src={logoImage}
                alt="مُقدِّم — Muqaddim"
                className="relative z-10 w-[75%] h-auto drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* جانب النص — ثنائي اللغة */}
          <div className="text-white space-y-7 order-1 lg:order-2">

            {/* العلامة — عربي + إنجليزي */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <h1
                className="font-bold text-white leading-none mb-2"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 6rem)",
                  fontFamily: "Changa, sans-serif",
                }}
              >
                مُقدِّم
              </h1>
              <p
                className="text-[#C6A75E]/90 font-light"
                style={{
                  fontSize: "clamp(0.85rem, 1.4vw, 1.15rem)",
                  letterSpacing: "0.4em",
                  direction: "ltr",
                  textAlign: "right",
                }}
              >
                MUQADDIM
              </p>
            </motion.div>

            {/* فاصل ذهبي */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ transformOrigin: "right" }}
            >
              <div className="w-14 h-px bg-[#C6A75E]" />
              <div className="w-2 h-2 rounded-full bg-[#C6A75E]" />
              <div className="w-7 h-px bg-[#C6A75E]/40" />
            </motion.div>

            {/* الوصف — عربي + إنجليزي مدموج */}
            <motion.div
              className="space-y-3 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <p
                className="leading-relaxed font-[Changa]"
                style={{
                  fontSize: "clamp(1rem, 1.6vw, 1.18rem)",
                  color: "rgba(255,255,255,0.85)",
                  textAlign: "right",
                }}
              >
                مساعدك الذكي لدراسات الجدوى الاحترافية، نحوّل أفكارك إلى مشاريع ناجحة بذكاء اصطناعي متقدم.
              </p>
              <p
                className="leading-relaxed font-light"
                style={{
                  fontSize: "clamp(0.85rem, 1.2vw, 0.95rem)",
                  color: "rgba(255,255,255,0.55)",
                  direction: "ltr",
                  textAlign: "left",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Your intelligent assistant for professional feasibility studies — transforming ideas into successful projects through advanced AI.
              </p>
            </motion.div>

            {/* زر البداية — ثنائي اللغة */}
            <motion.div
              className="pt-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <Link to="/auth">
                <motion.div
                  className="inline-flex items-center gap-4 px-8 py-4 rounded-md text-white font-bold cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #C6A75E 0%, #a88f4e 100%)",
                  }}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 20px 40px rgba(198,167,94,0.35)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-right">
                    <div className="font-bold text-base font-[Changa]">ابدأ الآن</div>
                    <div
                      className="text-[10px] font-light opacity-80 mt-0.5"
                      style={{
                        direction: "ltr",
                        letterSpacing: "0.2em",
                      }}
                    >
                      GET STARTED
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5" />
                </motion.div>
              </Link>
            </motion.div>

          </div>
        </div>
      </div>

    </div>
  );
}

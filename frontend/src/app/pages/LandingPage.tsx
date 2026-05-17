import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { SparkleField } from "../components/SparkleField";

// Brand logo shown inside the rotating circles
const logoImage = "/assets/logo-color.png";

// Total time the splash stays on screen before navigating to /auth
const SPLASH_DURATION_MS = 1000;
// How long the "zoom + fade out" exit animation runs at the end of the splash
const EXIT_TRANSITION_MS = 450;

export default function LandingPage() {
  const navigate = useNavigate();
  // Flips to true a bit before the redirect, which triggers the zoom-out animation
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start the zoom-out animation EXIT_TRANSITION_MS before navigating,
    // so the animation finishes exactly when we move to /auth.
    const exitTimer = setTimeout(
      () => setIsExiting(true),
      SPLASH_DURATION_MS - EXIT_TRANSITION_MS,
    );
    const navTimer = setTimeout(() => navigate("/auth"), SPLASH_DURATION_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    // Splash is always rendered in the dark green gradient — light mode is
    // intentionally skipped here so the splash → /auth transition stays seamless.
    <div
      className="min-h-screen flex items-center justify-center p-6 lg:p-12 relative bg-gradient-to-br from-[#062620] via-[#08312D] to-[#0a3d37] overflow-hidden"
      dir="rtl"
    >
      <SparkleField variant="dense" />

      {/* Bottom gold glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-72 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(198, 167, 94, 0.15) 0%, transparent 60%)",
        }}
      />
      {/* Logo + rotating decorative rings, centered.
          Two animation states:
            - On mount: fades in and scales from 0.9 → 1
            - On exit (isExiting = true): scales up to 1.5 and fades to 0,
              creating a "zoom into the screen" feel right before /auth loads. */}
      <motion.div
        className="relative z-10 flex justify-center items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={
          isExiting
            ? { opacity: 0, scale: 1.5 }
            : { opacity: 1, scale: 1 }
        }
        transition={{
          duration: isExiting ? EXIT_TRANSITION_MS / 1000 : 0.55,
          ease: isExiting ? "easeIn" : "easeOut",
        }}
      >
        <div className="relative w-[380px] h-[380px] lg:w-[460px] lg:h-[460px] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: "1px solid rgba(198,167,94,0.35)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-8 rounded-full"
            style={{ border: "1px dashed rgba(198,167,94,0.2)" }}
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
            alt="مُقدِّم — Muqaddim"
            className="relative z-10 w-[75%] h-auto drop-shadow-2xl"
          />
        </div>
      </motion.div>
    </div>
  );
}

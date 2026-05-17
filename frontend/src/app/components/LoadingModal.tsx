// Branded full-screen loading dialog shown while a long backend operation
// is in flight (AI report generation, PDF build, pitch deck export, etc.).
//
// The dialog renders nothing when `open` is false. When open it draws a
// dimmed backdrop with a centered white card containing a gold spinner
// badge, the title + description text, and an indeterminate progress bar.
//
// Used in: PitchDeckPage, MyProjectsPageNew, FeasibilityStudyPage,
// FeasibilityReport, EditProjectPage, MarketAnalysisPage.
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface LoadingModalProps {
  open: boolean;
  // Big bold heading at the top of the card (e.g. "جاري التحضير")
  title: string;
  // One-line explanation under the title (e.g. "جاري إنشاء عرضك التقديمي")
  description: string;
  // Small accent line under the description. Defaults to a generic
  // "please wait" message in both languages.
  hint?: string;
  // Layout direction. Defaults to RTL since most callers are Arabic-first.
  dir?: "rtl" | "ltr";
}

export function LoadingModal({
  open,
  title,
  description,
  hint,
  dir = "rtl",
}: LoadingModalProps) {
  if (!open) return null;
  const resolvedHint = hint ?? (dir === "rtl" ? "الرجاء الانتظار..." : "Please wait...");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      dir={dir}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-200 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-300"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#C6A75E] flex items-center justify-center mb-6 shadow-lg">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-[#08312d] dark:text-gray-900 mb-3 font-[Changa]">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-700 text-lg leading-relaxed mb-2 font-[Changa]">
            {description}
          </p>
          <p className="text-[#C6A75E] font-bold text-lg font-[Changa]">
            {resolvedHint}
          </p>
          <div className="mt-6 w-full bg-gray-200 dark:bg-gray-300 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-[#C6A75E]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

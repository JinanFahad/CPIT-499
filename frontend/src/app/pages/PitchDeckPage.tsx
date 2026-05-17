import { useState, useEffect } from "react";
import { Link } from "react-router";

// Lucide icons
import {
  PresentationIcon,
  FolderOpen,
  FileText,
  Loader2,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// Animations + layout pieces + i18n + Firebase auth
import { motion, AnimatePresence } from "motion/react";
import { Header } from "../components/Header";
import { SparkleField } from "../components/SparkleField";
import { LoadingModal } from "../components/LoadingModal";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";
import { BACKEND_URL } from "../config";
import { getUserId } from "../auth-storage";

export default function PitchDeckPage() {
  // ── i18n ───────────────────────────────────────────────────────────
  const { language } = useLanguage();
  const isAr = language === "ar";

  // ── State ──────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<any[]>([]); // list of projects loaded from API
  const [isGenerating, setIsGenerating] = useState(false); // PPT generation in progress?
  const [generatingProject, setGeneratingProject] = useState<any>(null); // which project is currently generating
  const [emailingProject, setEmailingProject] = useState<any>(null); // which project is currently emailing
  // Floating success/error banner (null = no banner shown)
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  // Tiny helpers to show toasts in one line at call sites
  const showSuccess = (title: string, message: string) =>
    setNotice({ type: "success", title, message });
  const showError = (title: string, message: string) =>
    setNotice({ type: "error", title, message });

  // ── Load the user's projects on mount ──────────────────────────────
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    fetch(`${BACKEND_URL}/api/projects?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  // ── Generate + download a pitch deck for the chosen project ────────
  // Backend generates the PPTX file and returns it as a blob.
  // We then trigger a browser download via a temporary <a> element.
  const handleExportPitchDeck = async (project: any) => {
    setIsGenerating(true);
    setGeneratingProject(project);

    try {
      const response = await fetch(`${BACKEND_URL}/api/pitchdeck/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id, // backend uses this to mark the project as "pitch deck generated"
          project_name: project.project_name,
          business_type: project.project_type,
          restaurant_type: project.restaurant_type || "",
          city: project.city,
          capital: project.capital,
          rent: project.rent,
          employees: project.employees,
          avg_price: project.avg_price,
          customers_per_day: project.customers_per_day,
          target_customers: project.target_customers || "",
          main_products: project.main_products || [],
        }),
      });

      if (!response.ok) throw new Error("Failed to generate pitch deck");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.project_name}_pitch_deck.pptx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showError(
        isAr ? "تعذّر تحميل العرض الاستثماري" : "Unable to Download Pitch Deck",
        isAr
          ? "نأسف، لم نتمكن من إتمام تحميل العرض الاستثماري. نرجو إعادة المحاولة لاحقاً."
          : "We were unable to download the pitch deck. Please try again later.",
      );
    } finally {
      setIsGenerating(false);
      setGeneratingProject(null);
    }
  };

  // ── Generate + email the pitch deck to the user ────────────────────
  const handleEmailPitchDeck = async (project: any) => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) {
      showError(
        isAr ? "يلزم تسجيل الدخول" : "Authentication Required",
        isAr
          ? "يرجى تسجيل الدخول لإتمام إرسال العرض الاستثماري إلى بريدكم الإلكتروني."
          : "Please sign in to send the pitch deck to your email address.",
      );
      return;
    }
    setEmailingProject(project);
    try {
      const response = await fetch(`${BACKEND_URL}/api/pitchdeck/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          project_name: project.project_name,
          business_type: project.project_type,
          restaurant_type: project.restaurant_type || "",
          city: project.city,
          capital: project.capital,
          rent: project.rent,
          employees: project.employees,
          avg_price: project.avg_price,
          customers_per_day: project.customers_per_day,
          target_customers: project.target_customers || "",
          main_products: project.main_products || [],
          language: isAr ? "ar" : "en",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed");
      showSuccess(
        isAr
          ? "تم إرسال العرض الاستثماري بنجاح"
          : "Pitch Deck Sent Successfully",
        isAr
          ? `تم تسليم العرض الاستثماري الخاص بمشروعكم إلى بريدكم الإلكتروني ${userEmail}. نشكركم لاستخدامكم منصة مُقدِّم.`
          : `Your project's pitch deck has been delivered to ${userEmail}. Thank you for using Muqaddim.`,
      );
    } catch (err: any) {
      showError(
        isAr ? "تعذّر إرسال البريد الإلكتروني" : "Email Delivery Failed",
        isAr
          ? `نأسف، تعذّر إتمام إرسال البريد الإلكتروني. السبب: ${err.message}`
          : `We were unable to deliver the email. Reason: ${err.message}`,
      );
    } finally {
      setEmailingProject(null);
    }
  };

  return (
    <>
      <Header />
      <div
        className="min-h-screen bg-transparent p-6 lg:p-8 relative"
        dir={isAr ? "rtl" : "ltr"}
      >
        <SparkleField />
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-8 border border-[#C6A75E]/30 card-glow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-lg bg-[#C6A75E] flex items-center justify-center">
                <PresentationIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#08312d] dark:text-white">
                  {isAr ? "إعداد العرض الاستثماري" : "Pitch Deck"}
                </h1>
                <p className="text-gray-600 dark:text-white/70 text-lg font-medium font-[Changa] mt-2">
                  {" "}
                  {isAr
                    ? "قم بتصدير عرض تقديمي احترافي (Pitch Deck) لمشروعك"
                    : "Export a professional Pitch Deck for your project"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div
            className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-6 border border-[#C6A75E]/30 card-glow"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-[#08312D] dark:text-white mb-3">
              {isAr ? "ما هو Pitch Deck؟" : "What is a Pitch Deck?"}
            </h2>
            <p className="text-[#08312D]/70 dark:text-white/70 mb-4 leading-relaxed font-[Changa]">
              {isAr
                ? "العرض التقديمي (Pitch Deck) هو عرض مختصر واحترافي يستخدم لجذب المستثمرين والشركاء."
                : "A Pitch Deck is a concise professional presentation used to attract investors and partners."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                {
                  title: isAr ? "المشكلة والحل" : "Problem & Solution",
                  desc: isAr
                    ? "المشكلة التي يحلها مشروعك والحل المقترح"
                    : "The problem your project solves and the proposed solution",
                },
                {
                  title: isAr ? "السوق المستهدف" : "Target Market",
                  desc: isAr
                    ? "حجم السوق والفئة المستهدفة"
                    : "Market size and target audience",
                },
                {
                  title: isAr ? "نموذج العمل" : "Business Model",
                  desc: isAr
                    ? "كيف سيحقق مشروعك الإيرادات"
                    : "How your project will generate revenue",
                },
                {
                  title: isAr ? "التوقعات المالية" : "Financial Projections",
                  desc: isAr
                    ? "الإيرادات والتكاليف المتوقعة"
                    : "Expected revenues and costs",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-[#062620] border border-transparent dark:border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">
                        {index + 1}
                      </span>
                    </div>
                    <h4 className="text-[#08312D] dark:text-white font-bold text-sm">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[#08312D]/60 dark:text-white/60 text-xs mr-9 font-[Changa]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Projects List */}
          {projects.length === 0 ? (
            <div className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-12 text-center border border-[#C6A75E]/30 card-glow">
              <div className="w-20 h-20 rounded-2xl bg-[#C6A75E] flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#08312D] dark:text-white mb-3">
                {isAr ? "لا توجد مشاريع بعد" : "No projects yet"}
              </h3>
              <p className="text-gray-600 dark:text-white/70 mb-6 max-w-md mx-auto font-[Changa]">
                {isAr
                  ? "أنشئ مشروعك الأول لتتمكن من تصدير عرض تقديمي احترافي له"
                  : "Create your first project to export a professional pitch deck"}
              </p>
              <Link
                to="/dashboard/feasibility-study"
                className="inline-flex items-center gap-2 bg-[#C6A75E] hover:bg-[#a88f4e] rounded-xl px-6 py-3 text-white transition-all font-[Changa]"
              >
                <span>{isAr ? "إنشاء مشروع جديد" : "Create New Project"}</span>
                <FileText className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-[#08312D] dark:text-white mb-4">
                {isAr
                  ? "اختر مشروعاً لتصدير Pitch Deck"
                  : "Select a project to export Pitch Deck"}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-6 border border-[#C6A75E]/30 card-glow hover:shadow-xl hover:border-[#C6A75E]/60 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-[#C6A75E] flex items-center justify-center flex-shrink-0">
                          <PresentationIcon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#08312D] dark:text-white font-bold text-lg mb-2">
                            {isAr
                              ? project.project_name
                              : project.project_name_en || project.project_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-[#08312D]/70 dark:text-white/70 font-[Changa]">
                              {isAr ? "المدينة" : "City"}:{" "}
                              {isAr
                                ? project.city
                                : project.city_en || project.city}
                            </span>
                            <span className="text-[#08312D]/70 dark:text-white/70 font-[Changa]">
                              {isAr ? "رأس المال" : "Capital"}:{" "}
                              {project.capital
                                ? project.capital.toLocaleString()
                                : "—"}{" "}
                              {isAr ? "ر.س" : "SAR"}
                            </span>
                            <span className="inline-block bg-[#C6A75E]/15 text-[#C6A75E] font-semibold font-[Changa] px-3 py-1 rounded-full">
                              🍽{" "}
                              {isAr ? "مطاعم وكافيهات" : "Restaurants & Cafes"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleExportPitchDeck(project)}
                          disabled={
                            isGenerating || emailingProject?.id === project.id
                          }
                          className="bg-[#FFF9F0] dark:bg-[#C6A75E]/15 border-2 border-[#C6A75E] hover:bg-[#C6A75E] hover:text-white text-[#C6A75E] flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-sm transition-all font-[Changa] disabled:opacity-60"
                        >
                          {isGenerating &&
                          generatingProject?.id === project.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <PresentationIcon className="w-5 h-5" />
                              <span>{isAr ? "عرض تقديمي" : "Pitch Deck"}</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleEmailPitchDeck(project)}
                          disabled={
                            emailingProject?.id === project.id || isGenerating
                          }
                          title={isAr ? "إرسال إلى إيميلي" : "Send to my email"}
                          className="bg-white dark:bg-[#062620] border-2 border-[#08312D] dark:border-white/30 hover:bg-[#08312D] hover:text-white text-[#08312D] dark:text-white flex items-center justify-center px-4 py-3 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-60"
                        >
                          {emailingProject?.id === project.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Mail className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <LoadingModal
        open={!!(isGenerating && generatingProject)}
        title={isAr ? "جاري التحضير" : "Preparing..."}
        description={
          isAr
            ? "جاري إنشاء عرضك التقديمي وتحميله"
            : "Generating and downloading your pitch deck"
        }
        dir={isAr ? "rtl" : "ltr"}
      />

      {/* Notice Modal — للنجاح والفشل */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setNotice(null)}
            dir={isAr ? "rtl" : "ltr"}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#0E4A43] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#C6A75E]/30 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{
                  background: notice.type === "success" ? "#C6A75E" : "#dc2626",
                }}
              />
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                    notice.type === "success"
                      ? "bg-[#FFF9F0] dark:bg-[#C6A75E]/15 border-2 border-[#C6A75E]"
                      : "bg-red-50 dark:bg-red-500/15 border-2 border-red-300 dark:border-red-400/50"
                  }`}
                >
                  {notice.type === "success" ? (
                    <CheckCircle2 className="w-11 h-11 text-[#C6A75E]" />
                  ) : (
                    <AlertCircle className="w-11 h-11 text-red-500 dark:text-red-300" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[#08312D] dark:text-white mb-3 font-[Changa]">
                  {notice.title}
                </h3>
                <p className="text-gray-600 dark:text-white/80 text-base leading-relaxed mb-6 font-[Changa]">
                  {notice.message}
                </p>
                <button
                  onClick={() => setNotice(null)}
                  className={`w-full font-bold py-4 rounded-xl transition-all font-[Changa] text-white ${
                    notice.type === "success"
                      ? "bg-[#08312D] hover:bg-[#0E4A43] dark:bg-[#C6A75E] dark:hover:bg-[#a88f4e] dark:text-[#08312D]"
                      : "bg-gray-700 hover:bg-gray-800 dark:bg-red-500/30 dark:hover:bg-red-500/40 dark:text-white"
                  }`}
                >
                  {isAr ? "تمام" : "OK"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

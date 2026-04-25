// =====================================================================
// PitchDeckPage.tsx — صفحة تنزيل العروض التقديمية للمشاريع
// تعرض قائمة مشاريع المستخدم، وزر لكل مشروع لتنزيل PowerPoint
// عند الضغط: يستدعي /api/pitchdeck/generate (الباك اند يولّد بالـ AI)
// =====================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router";
import { PresentationIcon, FolderOpen, FileText, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";

const BACKEND_URL = "http://localhost:5000";

export default function PitchDeckPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [projects, setProjects] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProject, setGeneratingProject] = useState<any>(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid || localStorage.getItem("userId") || "";
    if (!userId) return;

    fetch(`${BACKEND_URL}/api/projects?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  const handleExportPitchDeck = async (project: any) => {
    setIsGenerating(true);
    setGeneratingProject(project);

    try {
      const response = await fetch(`${BACKEND_URL}/api/pitchdeck/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      alert(isAr ? "حدث خطأ في تنزيل العرض التقديمي" : "Error downloading pitch deck");
    } finally {
      setIsGenerating(false);
      setGeneratingProject(null);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-transparent dark:bg-gray-100 p-6 lg:p-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <motion.div
            className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-lg bg-[#C6A75E] flex items-center justify-center">
                <PresentationIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#08312d] dark:text-gray-900">
                  {isAr ? "إعداد العرض الاستثماري" : "Pitch Deck"}
                </h1>
                <p className="text-gray-600 dark:text-gray-700 text-lg font-medium font-[Changa] mt-2">                  {isAr ? "قم بتصدير عرض تقديمي احترافي (Pitch Deck) لمشروعك" : "Export a professional Pitch Deck for your project"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div
            className="bg-white dark:bg-gray-200 rounded-xl p-6 border border-gray-200 dark:border-gray-300 shadow-sm"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-[#08312D] dark:text-gray-900 mb-3">
              {isAr ? "ما هو Pitch Deck؟" : "What is a Pitch Deck?"}
            </h2>
            <p className="text-[#08312D]/70 dark:text-gray-700 mb-4 leading-relaxed font-[Changa]">
              {isAr
                ? "العرض التقديمي (Pitch Deck) هو عرض مختصر واحترافي يستخدم لجذب المستثمرين والشركاء."
                : "A Pitch Deck is a concise professional presentation used to attract investors and partners."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                { title: isAr ? "المشكلة والحل" : "Problem & Solution", desc: isAr ? "المشكلة التي يحلها مشروعك والحل المقترح" : "The problem your project solves and the proposed solution" },
                { title: isAr ? "السوق المستهدف" : "Target Market", desc: isAr ? "حجم السوق والفئة المستهدفة" : "Market size and target audience" },
                { title: isAr ? "نموذج العمل" : "Business Model", desc: isAr ? "كيف سيحقق مشروعك الإيرادات" : "How your project will generate revenue" },
                { title: isAr ? "التوقعات المالية" : "Financial Projections", desc: isAr ? "الإيرادات والتكاليف المتوقعة" : "Expected revenues and costs" },
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">{index + 1}</span>
                    </div>
                    <h4 className="text-[#08312D] dark:text-gray-900 font-bold text-sm">{item.title}</h4>
                  </div>
                  <p className="text-[#08312D]/60 dark:text-gray-700 text-xs mr-9 font-[Changa]">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Projects List */}
          {projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-200 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-300 shadow-sm">
              <div className="w-20 h-20 rounded-2xl bg-[#C6A75E] flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#08312D] dark:text-gray-900 mb-3">
                {isAr ? "لا توجد مشاريع بعد" : "No projects yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-700 mb-6 max-w-md mx-auto font-[Changa]">
                {isAr ? "أنشئ مشروعك الأول لتتمكن من تصدير عرض تقديمي احترافي له" : "Create your first project to export a professional pitch deck"}
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
              <h2 className="text-xl font-bold text-[#08312D] dark:text-gray-900 mb-4">
                {isAr ? "اختر مشروعاً لتصدير Pitch Deck" : "Select a project to export Pitch Deck"}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-gray-200 rounded-xl p-6 border border-gray-200 dark:border-gray-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-[#C6A75E] flex items-center justify-center flex-shrink-0">
                          <PresentationIcon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#08312D] dark:text-gray-900 font-bold text-lg mb-2">
                            {isAr ? project.project_name : (project.project_name_en || project.project_name)}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-[#08312D]/70 dark:text-gray-700 font-[Changa]">
                              {isAr ? "المدينة" : "City"}: {isAr ? project.city : (project.city_en || project.city)}
                            </span>
                            <span className="text-[#08312D]/70 dark:text-gray-700 font-[Changa]">
                              {isAr ? "رأس المال" : "Capital"}: {project.capital ? project.capital.toLocaleString() : "—"} {isAr ? "ر.س" : "SAR"}
                            </span>
                            <span className="inline-block bg-[#C6A75E]/15 text-[#C6A75E] font-semibold font-[Changa] px-3 py-1 rounded-full">
                              🍽 {isAr ? "مطاعم وكافيهات" : "Restaurants & Cafes"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleExportPitchDeck(project)}
                        className="bg-[#FFF9F0] border-2 border-[#C6A75E] hover:bg-[#C6A75E] hover:text-white text-[#C6A75E] flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-sm transition-all flex-shrink-0 font-[Changa]"
                      >
                        {isGenerating && generatingProject?.id === project.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <PresentationIcon className="w-5 h-5" />
                            <span>{isAr ? "عرض تقديمي" : "Pitch Deck"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Loading Modal */}
      {isGenerating && generatingProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          dir={isAr ? "rtl" : "ltr"}
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
              <h3 className="text-2xl font-bold text-[#08312d] dark:text-gray-900 mb-3">
                {isAr ? "جاري التحضير" : "Preparing..."}
              </h3>
              <p className="text-gray-600 dark:text-gray-700 text-lg leading-relaxed mb-2 font-[Changa]">
                {isAr ? "سيقوم الذكاء الاصطناعي بإنشاء عرضك التقديمي وتحميله" : "AI will generate and download your pitch deck"}
              </p>
              <p className="text-[#C6A75E] font-bold text-lg font-[Changa]">
                {isAr ? "الرجاء الانتظار..." : "Please wait..."}
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
      )}
    </>
  );
}
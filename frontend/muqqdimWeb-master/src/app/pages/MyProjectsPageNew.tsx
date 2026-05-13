// =====================================================================
// MyProjectsPageNew.tsx — قائمة مشاريع المستخدم
// لكل مشروع توفر:
//   - زر "عرض الدراسة" (يفتح FeasibilityReport بدون تنزيل ملف)
//   - زر تنزيل PDF
//   - زر تعديل
//   - زر حذف (مع modal تأكيد)
// ملاحظة: زرّا "تنزيل / إرسال العرض التقديمي" مَوجودان فقط في صفحة PitchDeckPage
// تجنّبًا للتكرار وللإلزام بأن المستخدم ينشئ العرض من مكان واحد.
// =====================================================================

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Plus, Edit, Trash2, FileText, Download, FolderOpen, Loader2, Eye, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "../components/Header";
import { Sparkle } from "../components/Sparkle";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";
import { cities } from "./FeasibilityStudyPage";

// خريطة عكسية: اسم المدينة بالعربي → بالإنجليزي
const cityArToEn: Record<string, string> = cities.reduce(
  (acc, c) => ({ ...acc, [c.ar]: c.en }),
  {} as Record<string, string>
);

const translateCity = (city: string | undefined, isAr: boolean): string => {
  if (!city) return "—";
  if (isAr) return city; // المخزّن أصلاً عربي
  return cityArToEn[city] || city; // لو مو في القائمة، نرجّع الأصل
};

const BACKEND_URL = "http://localhost:5000";

export default function MyProjectsPageNew() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<number | null>(null);
  const [emailingPDF, setEmailingPDF] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const userName = localStorage.getItem("userName") || (isAr ? "المستخدم" : "User");

  const showSuccess = (title: string, message: string) =>
    setNotice({ type: "success", title, message });
  const showError = (title: string, message: string) =>
    setNotice({ type: "error", title, message });

  // عند تحميل الصفحة وكلّ مرة المستخدم يرجع لهذي الصفحة (location.key يتغير):
  // نعيد جلب المشاريع. ضروري عشان لو ولّد بتش دك من صفحة Pitch Deck ورجع هنا،
  // الحقل pitch_deck_generated يكون محدّث (يفعّل أزرار البتش دك).
  const location = useLocation();
  useEffect(() => {
    // userId من Firebase (الأساسي)، أو localStorage كاحتياط لو Firebase ما حمّل بعد
    const userId = auth.currentUser?.uid || localStorage.getItem("userId") || "";
    if (!userId) return;

    fetch(`${BACKEND_URL}/api/projects?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, [location.key]);

  const handleDelete = async (projectId: number) => {
    try {
      await fetch(`${BACKEND_URL}/api/projects/${projectId}`, { method: "DELETE" });
      setProjects(projects.filter(p => p.id !== projectId));
    } catch {
      showError(
        isAr ? "تعذّر إتمام العملية" : "Operation Failed",
        isAr ? "نأسف، تعذّر إتمام طلب حذف المشروع. نرجو إعادة المحاولة لاحقاً." : "We were unable to complete the project deletion. Please try again later."
      );
    }
    setDeleteConfirm(null);
  };

  // إعادة توليد PDF + تنزيل (يستدعي الـ AI من جديد)
  const handleDownloadPDF = async (project: any) => {
    setIsGeneratingPDF(project.id);
    try {
      const response = await fetch(`${BACKEND_URL}/api/feasibility/report-pdf`, {
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
          // اللغة الحالية للموقع — يستخدمها الباك لاختيار برومبت الـ AI وقالب الـ PDF
          language: language,
          ...(project.lat && project.lng ? { lat: project.lat, lng: project.lng } : {}),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.project_name}_feasibility.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showError(
        isAr ? "تعذّر تحميل دراسة الجدوى" : "Unable to Download Report",
        isAr ? "نأسف، لم نتمكن من إتمام تحميل دراسة الجدوى. نرجو التحقق من الاتصال وإعادة المحاولة." : "We were unable to download the feasibility report. Please check your connection and try again."
      );
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  // إرسال دراسة الجدوى على إيميل المستخدم
  const handleEmailPDF = async (project: any) => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) {
      showError(
        isAr ? "يلزم تسجيل الدخول" : "Authentication Required",
        isAr ? "يرجى تسجيل الدخول لإتمام إرسال الملف إلى بريدكم الإلكتروني." : "Please sign in to send the document to your email address."
      );
      return;
    }
    if (!project.report_id) {
      showError(
        isAr ? "لا توجد دراسة جدوى مرتبطة" : "No Associated Report",
        isAr ? "هذا المشروع لا يحتوي على دراسة جدوى. يرجى إعادة إنشاء الدراسة عبر تعديل المشروع." : "This project has no associated feasibility report. Please regenerate it by editing the project."
      );
      return;
    }
    setEmailingPDF(project.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/feasibility/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: project.report_id,
          email: userEmail,
          project_name: project.project_name,
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      showSuccess(
        isAr ? "تم إرسال دراسة الجدوى بنجاح" : "Feasibility Report Sent Successfully",
        isAr
          ? `تم تسليم دراسة الجدوى الخاصة بمشروعكم إلى بريدكم الإلكتروني ${userEmail}. نشكركم لاستخدامكم منصة مُقدِّم.`
          : `Your project's feasibility report has been delivered to ${userEmail}. Thank you for using Muqaddim.`
      );
    } catch (err: any) {
      showError(
        isAr ? "تعذّر إرسال البريد الإلكتروني" : "Email Delivery Failed",
        isAr
          ? `نأسف، تعذّر إتمام إرسال البريد الإلكتروني. السبب: ${err.message}`
          : `We were unable to deliver the email. Reason: ${err.message}`
      );
    } finally {
      setEmailingPDF(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-SA" : "en-US");
    } catch {
      return "—";
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6 lg:p-8 relative" dir={isAr ? "rtl" : "ltr"}>
        <Sparkle className="top-[5%] left-[5%]" size={18} />
        <Sparkle className="top-[15%] right-[8%]" size={12} />
        <Sparkle className="top-[40%] left-[3%]" size={22} />
        <Sparkle className="top-[60%] right-[5%]" size={14} />
        <Sparkle className="bottom-[20%] left-[7%]" size={16} />
        <Sparkle className="bottom-[10%] right-[15%]" size={20} />
        <div className="max-w-7xl mx-auto space-y-6">

          <div className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-8 border border-[#C6A75E]/30 card-glow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-[#08312d] dark:text-white mb-2">
                  {t('projects.welcome')}, {userName}
                </h1>
                <p className="text-gray-600 dark:text-white/70 text-lg font-medium font-[Changa]">
                  {t('projects.youHave')} <span className="font-bold text-[#08312d] dark:text-[#C6A75E]">{projects.length}</span> {projects.length === 1 ? t('projects.project') : t('projects.projects')}
                </p>
              </div>
              <Link
                to="/dashboard/feasibility-study"
                className="bg-[#C6A75E] hover:bg-[#a88f4e] rounded-lg px-5 py-2 text-white transition-all flex items-center gap-2 font-bold text-sm shadow-md font-[Changa]"
              >
                <Plus className="w-4 h-4" />
                <span>{t('projects.createNew')}</span>
              </Link>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-20 text-center border border-[#C6A75E]/30 card-glow">
              <div className="w-32 h-32 rounded-2xl bg-[#E6F2F0] dark:bg-[#C6A75E]/15 flex items-center justify-center mx-auto mb-8">
                <FolderOpen className="w-16 h-16 text-[#C6A75E]" />
              </div>
              <h2 className="text-3xl font-bold text-[#08312d] dark:text-white mb-4">{t('projects.noProjects')}</h2>
              <p className="text-gray-600 dark:text-white/70 text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-[Changa]">
                {t('projects.noProjectsDesc')}
              </p>
              <Link
                to="/dashboard/feasibility-study"
                className="inline-flex items-center gap-3 bg-[#C6A75E] hover:bg-[#a88f4e] rounded-lg px-10 py-5 text-white transition-all font-bold text-lg shadow-md font-[Changa]"
              >
                <Plus className="w-6 h-6" />
                <span>{t('projects.createNew')}</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-6 border border-[#C6A75E]/30 card-glow hover:shadow-xl hover:border-[#C6A75E]/60 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row gap-6">

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-16 h-16 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0 shadow-md">
                          <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-[#08312d] dark:text-white mb-1">
                            {project.project_name}
                          </h3>
                          <p className="text-gray-500 dark:text-white/50 text-sm font-[Changa]">
                            {formatDate(project.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-[#062620] rounded-lg p-5 border border-gray-200 dark:border-white/10">
                        <div>
                          <div className="text-gray-600 dark:text-white/60 text-sm font-semibold mb-1 font-[Changa]">{isAr ? "المدينة" : "City"}</div>
                          <div className="text-[#08312d] dark:text-white font-bold text-lg">{translateCity(project.city, isAr)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-white/60 text-sm font-semibold mb-1 font-[Changa]">{isAr ? "رأس المال" : "Capital"}</div>
                          <div className="text-[#08312d] dark:text-white font-bold text-lg">
                            {project.capital ? `${project.capital.toLocaleString()} ${isAr ? "ر.س" : "SAR"}` : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-white/60 text-sm font-semibold mb-1 font-[Changa]">{isAr ? "الإيجار الشهري" : "Monthly Rent"}</div>
                          <div className="text-[#08312d] dark:text-white font-bold text-lg">
                            {project.rent ? `${project.rent.toLocaleString()} ${isAr ? "ر.س" : "SAR"}` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[220px]">
                      <Link
                        to={`/dashboard/report/${project.id}`}
                        className="flex items-center justify-center gap-2 bg-[#08312D] hover:bg-[#0E4A43] border border-[#C6A75E]/40 hover:border-[#C6A75E] rounded-lg px-5 py-3 text-white transition-all font-semibold shadow-sm font-[Changa]"
                      >
                        <Eye className="w-5 h-5" />
                        <span>{isAr ? "عرض الدراسة" : "View Report"}</span>
                      </Link>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPDF(project)}
                          disabled={isGeneratingPDF === project.id || emailingPDF === project.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-[#062620] border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-[#08312D] rounded-lg px-4 py-3 text-[#08312D] dark:text-white transition-all font-semibold shadow-sm font-[Changa] disabled:opacity-50"
                        >
                          {isGeneratingPDF === project.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                          <span>{t('projects.downloadFeasibility')}</span>
                        </button>
                        <button
                          onClick={() => handleEmailPDF(project)}
                          disabled={emailingPDF === project.id || isGeneratingPDF === project.id}
                          title={isAr ? "إرسال للإيميل" : "Send to email"}
                          className="flex items-center justify-center bg-gray-50 dark:bg-[#062620] border border-gray-300 dark:border-white/20 hover:bg-[#08312D] hover:text-white rounded-lg px-4 py-3 text-[#08312D] dark:text-white transition-all shadow-sm disabled:opacity-50"
                        >
                          {emailingPDF === project.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to={`/dashboard/edit-project/${project.id}`}
                          className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#062620] border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-[#08312D] rounded-lg px-4 py-3 text-gray-700 dark:text-white/80 transition-all shadow-sm"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(project.id)}
                          className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#062620] border border-gray-300 dark:border-white/20 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 transition-all shadow-sm"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-200 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#08312d] mb-3 font-[Changa]">{isAr ? "حذف المشروع" : "Delete Project"}</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6 font-[Changa]">
                {isAr ? "هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure? This action cannot be undone."}
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-all font-[Changa]">
                  {isAr ? "حذف" : "Delete"}
                </button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all font-[Changa]">
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Loading Modal — يطلع لما المستخدم يضغط تنزيل دراسة الجدوى */}
      {isGeneratingPDF !== null && (
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
                {isAr
                  ? "جاري إنشاء ملف دراسة الجدوى وتحميله"
                  : "Generating and downloading your feasibility report"}
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
              className="bg-white dark:bg-gray-200 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* شريط ملوّن في الأعلى */}
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: notice.type === "success" ? "#C6A75E" : "#dc2626" }}
              />
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                    notice.type === "success"
                      ? "bg-[#FFF9F0] border-2 border-[#C6A75E]"
                      : "bg-red-50 border-2 border-red-300"
                  }`}
                >
                  {notice.type === "success" ? (
                    <CheckCircle2 className="w-11 h-11 text-[#C6A75E]" />
                  ) : (
                    <AlertCircle className="w-11 h-11 text-red-500" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[#08312D] mb-3 font-[Changa]">
                  {notice.title}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed mb-6 font-[Changa]">
                  {notice.message}
                </p>
                <button
                  onClick={() => setNotice(null)}
                  className={`w-full font-bold py-4 rounded-xl transition-all font-[Changa] text-white ${
                    notice.type === "success"
                      ? "bg-[#08312D] hover:bg-[#0E4A43]"
                      : "bg-gray-700 hover:bg-gray-800"
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
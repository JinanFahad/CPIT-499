// =====================================================================
// ConsultantPage.tsx — قائمة المشاريع لاختيار واحد للنقاش مع المستشار الذكي
// المستخدم يضغط على مشروع → يروح لـ ConsultantChatPage مع projectId
// =====================================================================

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, MessageSquare, FolderOpen } from "lucide-react";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";

const BACKEND_URL = "http://localhost:5000";

export default function ConsultantPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    const userId = auth.currentUser?.uid || localStorage.getItem("userId") || "";
    if (!userId) return;

    fetch(`${BACKEND_URL}/api/projects?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  const handleSelectProject = (projectId: number) => {
    navigate(`/dashboard/consultant/chat/${projectId}`);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-transparent p-6 lg:p-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <motion.div
            className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-lg bg-[#C6A75E] flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-[#08312d] dark:text-gray-900">
                    {isAr ? "مساعدك المستشار" : "AI Consultant"}
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-700 text-lg font-medium mr-[68px] font-[Changa]">
                  {isAr ? "ناقش وحلل مشاريعك مع مساعد ذكي متخصص" : "Discuss and analyze your projects with a specialized AI assistant"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div
            className="bg-white dark:bg-gray-200 border border-gray-200 dark:border-gray-300 shadow-sm rounded-xl p-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-[#08312D] dark:text-gray-900 mb-3">
              {isAr ? "كيف يعمل المساعد؟" : "How does the assistant work?"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir={isAr ? "rtl" : "ltr"}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-[#08312D] dark:text-gray-900">{isAr ? "اختر مشروعك" : "Select your project"}</h4>
                  <p className="text-gray-600 dark:text-gray-700 text-sm font-[Changa]">{isAr ? "حدد المشروع الذي تريد مناقشته" : "Choose the project you want to discuss"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-[#08312D] dark:text-gray-900">{isAr ? "ابدأ المحادثة" : "Start the conversation"}</h4>
                  <p className="text-gray-600 dark:text-gray-700 text-sm font-[Changa]">{isAr ? "اطرح أسئلتك واحصل على إجابات فورية" : "Ask your questions and get instant answers"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-[#08312D] dark:text-gray-900">{isAr ? "احصل على رؤى" : "Get insights"}</h4>
                  <p className="text-gray-600 dark:text-gray-700 text-sm font-[Changa]">{isAr ? "تحليلات ونصائح لتحسين مشروعك" : "Analytics and tips to improve your project"}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Projects List */}
          {projects.length === 0 ? (
            <motion.div
              className="bg-white dark:bg-gray-200 border border-gray-200 dark:border-gray-300 shadow-lg rounded-xl p-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-xl bg-[#E6F2F0] border border-gray-200 dark:border-gray-300 flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-[#08312D]" />
              </div>
              <h3 className="text-xl font-bold text-[#08312D] dark:text-gray-900 mb-3">
                {isAr ? "لا توجد مشاريع بعد" : "No projects yet"}
              </h3>
              <p className="text-gray-700 dark:text-gray-800 mb-6 max-w-md mx-auto font-[Changa]">
                {isAr ? "أنشئ مشروعك الأول لتتمكن من استخدام المساعد المستشار" : "Create your first project to use the AI consultant"}
              </p>
              <Link
                to="/dashboard/feasibility-study"
                className="inline-flex items-center gap-2 bg-[#08312D] hover:bg-[#0E4A43] rounded-lg px-6 py-3 text-white transition-all shadow-md font-[Changa]"
              >
                <span>{isAr ? "إنشاء مشروع جديد" : "Create New Project"}</span>
                <ArrowLeft className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-[#08312D] dark:text-gray-900 mb-4">
                {isAr ? "اختر مشروعاً للمناقشة" : "Select a project to discuss"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project, index) => (
                  <motion.button
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className="bg-white dark:bg-gray-200 border border-gray-200 dark:border-gray-300 hover:shadow-xl rounded-xl p-6 transition-all duration-300 group hover:border-[#08312D]"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#08312D] to-[#0E4A43] flex items-center justify-center flex-shrink-0 shadow-md">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>

                      <div className={`flex-1 min-w-0 ${isAr ? "text-right" : "text-left"}`}>                        <h3 className="text-[#08312D] dark:text-gray-900 font-bold text-lg mb-2 truncate">
                        {isAr ? project.project_name : (project.project_name_en || project.project_name)}
                      </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="text-gray-600 dark:text-gray-700 font-[Changa]">
                            {isAr ? "المدينة" : "City"}: {isAr ? project.city : (project.city_en || project.city)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-700 font-[Changa]">
                            {isAr ? "رأس المال" : "Capital"}: {project.capital ? project.capital.toLocaleString() : "—"} {isAr ? "ر.س" : "SAR"}
                          </span>
                          <span className="inline-block bg-[#C6A75E]/15 text-[#C6A75E] font-semibold font-[Changa] px-3 py-1 rounded-full">
                            🍽 {isAr ? "مطاعم وكافيهات" : "Restaurants & Cafes"}
                          </span>
                        </div>
                      </div>

                      <ArrowLeft className={`w-5 h-5 text-gray-500 group-hover:text-[#C6A75E] transition-all flex-shrink-0 ${isAr ? "rotate-0" : "rotate-180"}`} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}
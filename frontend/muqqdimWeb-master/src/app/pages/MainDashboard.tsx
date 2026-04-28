// =====================================================================
// MainDashboard.tsx — اللوحة الرئيسية بعد تسجيل الدخول
// تتكون من:
//   1) Hero - عنوان ترحيبي
//   2) بطاقة شخصية - اسم المستخدم + عدد مشاريعه + آخر ٣ مشاريع
//   3) About - معلومات عن المنصة
//   4) How It Works - 4 خطوات
//   5) Services - 5 بطاقات للخدمات
//   6) FAQ - الأسئلة الشائعة
// =====================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ChevronDown,
  FolderOpen,
  FileText,
  MessageSquare,
  Building2,
  PresentationIcon,
  ArrowLeft,
  HelpCircle,
  Plus,
  Calendar,
} from "lucide-react";
const logoImage = "/assets/logo-color.png";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";

const BACKEND_URL = "http://localhost:5000";

export default function MainDashboard() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const { language } = useLanguage();
  const isAr = language === "ar";

  const userName =
    auth.currentUser?.displayName ||
    localStorage.getItem("userName") ||
    (isAr ? "المستخدم" : "User");

  // نجيب مشاريع المستخدم عشان نعرض العدد + آخر ٣ مشاريع
  useEffect(() => {
    const userId = auth.currentUser?.uid || localStorage.getItem("userId") || "";
    if (!userId) return;

    fetch(`${BACKEND_URL}/api/projects?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-SA" : "en-US");
    } catch {
      return "—";
    }
  };

  const recentProjects = projects.slice(0, 3);

  const services = [
    {
      id: 1,
      title: isAr ? "دراسة الجدوى" : "Feasibility Study",
      description: isAr
        ? "إنشاء دراسة جدوى شاملة واحترافية لمشروعك"
        : "Create a comprehensive feasibility study for your project",
      icon: FileText,
      link: "/dashboard/feasibility-study",
      color: "#C6A75E",
      bgColor: "bg-[#FFF9F0]",
    },
    {
      id: 2,
      title: isAr ? "مساعدك المستشار" : "AI Consultant",
      description: isAr
        ? "مساعد ذكي لتحليل ومناقشة نتائج مشاريعك"
        : "Smart assistant to analyze and discuss your project results",
      icon: MessageSquare,
      link: "/dashboard/consultant",
      color: "#08312D",
      bgColor: "bg-[#E6F2F0]",
    },
    {
      id: 3,
      title: isAr ? "الإجراءات الحكومية" : "Government Procedures",
      description: isAr
        ? "دليل شامل للإجراءات والتراخيص المطلوبة"
        : "Comprehensive guide to required procedures and licenses",
      icon: Building2,
      link: "/dashboard/government-procedures",
      color: "#0E4A43",
      bgColor: "bg-[#E6F2F0]",
    },
    {
      id: 4,
      title: isAr ? "إعداد العرض الاستثماري" : "Pitch Deck",
      description: isAr
        ? "تصدير عرض تقديمي احترافي لمشروعك"
        : "Export a professional pitch deck for your project",
      icon: PresentationIcon,
      link: "/dashboard/pitch-deck",
      color: "#C6A75E",
      bgColor: "bg-[#FFF9F0]",
    },
  ];

  const steps = [
    {
      number: 1,
      title: isAr ? "تعبئة بيانات مشروعك" : "Fill Project Data",
      desc: isAr
        ? "أملأ نموذج بسيط عن فكرتك"
        : "Fill a simple form about your idea",
    },
    {
      number: 2,
      title: isAr ? "إنشاء دراسة جدوى" : "Generate Feasibility Study",
      desc: isAr
        ? "تقرير شامل جاهز في دقائق"
        : "A full report ready in minutes",
    },
    {
      number: 3,
      title: isAr ? "مناقشة تفاصيل مشروعك" : "Discuss Your Project",
      desc: isAr
        ? "حلل النتائج مع المستشار الذكي"
        : "Analyze results with the AI consultant",
    },
    {
      number: 4,
      title: isAr ? "الإجراءات الحكومية" : "Government Procedures",
      desc: isAr
        ? "دليل شامل للتراخيص والإجراءات المطلوبة"
        : "A comprehensive guide to required licenses and procedures",
    },
  ];

  const faqs = [
    {
      q: isAr ? "ما هي دراسة الجدوى؟" : "What is a feasibility study?",
      a: isAr
        ? "دراسة الجدوى هي تحليل شامل لمشروعك يشمل دراسة السوق، التوقعات المالية، تحليل المنافسين، والمخاطر المحتملة لتقييم نجاح المشروع."
        : "A feasibility study is a comprehensive analysis of your project including market research, financial projections, competitor analysis, and risk assessment.",
    },
    {
      q: isAr
        ? "كم يستغرق إنشاء دراسة الجدوى؟"
        : "How long does it take to create a feasibility study?",
      a: isAr
        ? "باستخدام مُـقــــدِم، يمكنك الحصول على دراسة جدوى أولية في دقائق معدودة، ويمكن تطويرها وتحسينها بمساعدة المستشار الذكي."
        : "Using Muqqdim, you can get an initial feasibility study in just minutes, and it can be further developed with the AI consultant.",
    },
    {
      q: isAr
        ? "هل يمكنني تعديل دراسة الجدوى بعد إنشائها؟"
        : "Can I edit the feasibility study after creating it?",
      a: isAr
        ? "نعم! يمكنك تعديل بيانات مشروعك في أي وقت، وسيتم تحديث دراسة الجدوى تلقائياً بناءً على التغييرات."
        : "Yes! You can edit your project data at any time and the feasibility study will be updated automatically.",
    },
    {
      q: isAr
        ? "ما هي الإجراءات الحكومية المتوفرة؟"
        : "What government procedures are available?",
      a: isAr
        ? "نوفر دليل شامل للإجراءات الحكومية في السعودية بما في ذلك السجل التجاري، الرقم الضريبي، الرخص البلدية، وغيرها."
        : "We provide a comprehensive guide to government procedures in Saudi Arabia including commercial registration, tax number, municipal licenses, and more.",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent" dir={isAr ? "rtl" : "ltr"}>
      {/* Navigation Bar */}
      <Header />

      {/* Hero Section */}
      <section id="home" className="relative py-20 px-6">
        <motion.div
          className="max-w-5xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-[48px] font-bold text-[#08312D] dark:text-white mb-6 leading-tight font-[Changa]">
            {isAr ? (
              <>
                حــوّل فـــكـــرتك إلى{" "}
                <span className="text-[#C6A75E]">مـشــــروع ناجح</span>
              </>
            ) : (
              <>
                Turn Your Idea Into a{" "}
                <span className="text-[#C6A75E]">Successful Business</span>
              </>
            )}
          </h1>

          <p className="text-xl text-gray-700 dark:text-white/60 mb-10 max-w-3xl mx-auto leading-relaxed font-[Changa]">
            {isAr
              ? "مُـقــــدِم يوفر لك دراسات جدوى احترافية، مساعد ذكي متخصص، دليل الإجراءات الحكومية، وأدوات إعداد العروض الاستثمارية - كل ما تحتاجه لبدء مشروعك بثقة"
              : "Muqqdim provides professional feasibility studies, a specialized AI assistant, a government procedures guide, and pitch deck tools - everything you need to start your business with confidence."}
          </p>
        </motion.div>
      </section>

      {/* Personalized Dashboard Section */}
      <section className="px-6 pb-12 pt-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="rounded-3xl p-8 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #08312D 0%, #0E4A43 100%)",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-[Changa]">
                  {isAr ? `مرحبًا ${userName} 👋` : `Welcome ${userName} 👋`}
                </h2>
                <p className="text-white/70 font-[Changa]">
                  {projects.length > 0
                    ? isAr
                      ? `عندك ${projects.length} ${projects.length === 1 ? "مشروع" : "مشاريع"}`
                      : `You have ${projects.length} project${projects.length === 1 ? "" : "s"}`
                    : isAr
                      ? "ابدأ رحلتك وأنشئ مشروعك الأول"
                      : "Start your journey and create your first project"}
                </p>
              </div>
              <Link
                to="/dashboard/feasibility-study"
                className="bg-[#C6A75E] hover:bg-[#a88f4e] rounded-lg px-6 py-3 text-white font-bold flex items-center gap-2 transition-all shadow-md whitespace-nowrap font-[Changa]"
              >
                <Plus className="w-5 h-5" />
                {isAr ? "مشروع جديد" : "New Project"}
              </Link>
            </div>

            {recentProjects.length > 0 && (
              <div>
                <h3 className="text-white/80 text-sm font-semibold mb-3 font-[Changa]">
                  {isAr ? "آخر مشاريعك" : "Recent Projects"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentProjects.map((p) => (
                    <Link
                      key={p.id}
                      to="/dashboard/my-projects"
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 hover:bg-white/15 hover:border-[#C6A75E]/60 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-sm truncate font-[Changa]">
                            {isAr ? p.project_name : p.project_name_en || p.project_name}
                          </div>
                          <div className="text-white/60 text-xs flex items-center gap-1 mt-1 font-[Changa]">
                            <Calendar className="w-3 h-3" />
                            {formatDate(p.created_at)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Part */}

          {/* About Part with Gradient */}
          <motion.div
            className="rounded-3xl p-12 text-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #08312D 0%, #718E8B 100%)",
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-4xl font-bold text-white mb-6">
              {isAr ? "من نحن" : "About Us"}
            </h3>
            <p className="text-white text-lg leading-relaxed font-[Changa] max-w-3xl mx-auto opacity-95">
              {isAr
                ? "مُـقــــدِم هي منصة سعودية متخصصة في تمكين رواد الأعمال من خلال تقديم أدوات ذكية ومتطورة لإنشاء دراسات الجدوى الاحترافية. نجمع بين التقنية المتقدمة والخبرة الاستشارية لنوفر تجربة متكاملة تساعدك على اتخاذ قرارات مدروسة وتحويل أفكارك إلى مشاريع ناجحة على أرض الواقع."
                : "Muqqdim is a Saudi platform specialized in empowering entrepreneurs with smart and advanced tools for creating professional feasibility studies. We combine advanced technology and consulting expertise to provide an integrated experience that helps you make informed decisions and turn your ideas into successful businesses."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-4xl font-bold text-[#08312D] dark:text-white mb-4">
              {isAr ? "رحلتك مع مُقدم" : "Your Journey with Muqqdim"}
            </h3>
            <p className="text-[#08312D]/60 dark:text-white/50 text-lg font-[Changa]">
              {isAr
                ? "أربع خطوات بسيطة لتحويل فكرتك إلى مشروع"
                : "Four simple steps to turn your idea into a business"}
            </p>
          </motion.div>

          <div className="flex items-start justify-between gap-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="flex-1 flex flex-col items-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Connecting line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-[22px] right-[50%] w-full h-[1px] bg-[#C6A75E]/30 z-0" />
                )}

                {/* Circle */}
                <div className="relative z-10 w-11 h-11 rounded-full border-2 border-[#C6A75E] bg-[#C6A75E]/10 dark:bg-[#C6A75E]/10 flex items-center justify-center mb-4">
                  <span className="text-[#C6A75E] font-bold text-base">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="text-center px-3">
                  <h4 className="text-[#08312D] dark:text-white font-bold text-sm mb-2 font-[Changa]">
                    {step.title}
                  </h4>
                  <p className="text-[#08312D]/50 dark:text-white/40 text-xs leading-relaxed font-[Changa]">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-4xl font-bold text-[#08312D] dark:text-white mb-4">
              {isAr ? "خدماتنا" : "Our Services"}
            </h3>
            <p className="text-[#08312D]/60 dark:text-white/50 text-lg font-[Changa]">
              {isAr
                ? "مجموعة متكاملة من الأدوات لدعم رحلتك الريادية"
                : "An integrated set of tools to support your entrepreneurial journey"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link
                    to={service.link}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-[#08312D]/25 dark:border-white/15 hover:border-[#C6A75E]/60 transition-all duration-300 group"
                    style={{ background: "rgba(8,49,45,0.07)" }}
                  >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-[#C6A75E]/10 border border-[#C6A75E]/25 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-7 h-7 text-[#C6A75E]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#08312D] dark:text-white font-bold text-base mb-1 font-[Changa]">
                        {service.title}
                      </h4>
                      <p className="text-[#08312D]/60 dark:text-white/50 text-sm font-[Changa] leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowLeft
                      className={`w-4 h-4 text-[#C6A75E]/50 group-hover:text-[#C6A75E] transition-all duration-300 flex-shrink-0 ${isAr ? "group-hover:-translate-x-1" : "rotate-180 group-hover:translate-x-1"}`}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-4xl font-bold text-[#08312D] dark:text-white mb-4">
              {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h3>
            <p className="text-[#08312D]/60 dark:text-white/50 text-lg font-[Changa]">
              {isAr
                ? "إجابات على أهم الأسئلة حول خدماتنا"
                : "Answers to the most common questions about our services"}
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="rounded-xl overflow-hidden border border-[#C6A75E]/20 dark:border-[#C6A75E]/20 hover:border-[#C6A75E]/50 transition-all duration-300"
                style={{ background: "rgba(8,49,45,0.08)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-right hover:bg-[#C6A75E]/5 dark:hover:bg-[#C6A75E]/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-[#C6A75E]/10 border border-[#C6A75E]/25 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-4 h-4 text-[#C6A75E]" />
                    </div>
                    <h4
                      className={`text-[#08312D] dark:text-white font-bold text-base font-[Changa] ${isAr ? "text-right" : "text-left"}`}
                    >
                      {faq.q}
                    </h4>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#08312D]/40 dark:text-white/40 transition-transform flex-shrink-0 ${
                      openFAQ === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openFAQ === index && (
                  <div
                    className="px-5 pt-4 pb-6 pr-[52px]"
                    style={{ background: "rgba(8,49,45,0.05)" }}
                  >
                    <p
                      className={`text-[#08312D]/60 dark:text-white/55 leading-relaxed font-[Changa] text-sm ${isAr ? "text-right" : "text-left"}`}
                    >
                      {faq.a}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — تذييل رسمي بطابع حكومي */}
      <footer className="mt-20 relative z-10 bg-[#08312D] text-white">
        {/* الجزء الرئيسي */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* العمود الأول — العلامة + النبذة */}
            <div>
              <img src={logoImage} alt="مُقدِّم" className="h-12 w-auto mb-4 brightness-0 invert" />
              <p className="text-white/70 text-sm leading-relaxed">
                {isAr
                  ? "منصة سعودية متخصصة في توليد دراسات الجدوى الذكية للمشاريع الصغيرة والمتوسطة في قطاع المطاعم والكافيهات."
                  : "A Saudi platform specialized in generating intelligent feasibility studies for small and medium-sized restaurant and café projects."}
              </p>
            </div>

            {/* العمود الثاني — روابط سريعة */}
            <div>
              <h4 className="text-[#C6A75E] font-bold text-sm mb-4 tracking-wide uppercase">
                {isAr ? "روابط سريعة" : "Quick Links"}
              </h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/dashboard/feasibility-study" className="text-white/80 hover:text-[#C6A75E] transition-colors">{isAr ? "إنشاء دراسة جدوى" : "Create Feasibility Study"}</Link></li>
                <li><Link to="/dashboard/my-projects" className="text-white/80 hover:text-[#C6A75E] transition-colors">{isAr ? "مشاريعي" : "My Projects"}</Link></li>
                <li><Link to="/dashboard/consultant" className="text-white/80 hover:text-[#C6A75E] transition-colors">{isAr ? "المستشار الذكي" : "AI Consultant"}</Link></li>
                <li><Link to="/dashboard/government-procedures" className="text-white/80 hover:text-[#C6A75E] transition-colors">{isAr ? "الإجراءات الحكومية" : "Government Procedures"}</Link></li>
              </ul>
            </div>

            {/* العمود الثالث — التواصل */}
            <div>
              <h4 className="text-[#C6A75E] font-bold text-sm mb-4 tracking-wide uppercase">
                {isAr ? "تواصل معنا" : "Contact Us"}
              </h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>{isAr ? "البريد الإلكتروني:" : "Email:"} <span dir="ltr">info@muqaddim.sa</span></li>
                <li>{isAr ? "جامعة الملك عبدالعزيز" : "King Abdulaziz University"}</li>
                <li>{isAr ? "جدة، المملكة العربية السعودية" : "Jeddah, Saudi Arabia"}</li>
              </ul>
              <div className="flex items-center gap-3 mt-4">
                <a
                  href="https://x.com/muqqdim"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={isAr ? "حسابنا على إكس" : "Our X account"}
                  className="w-9 h-9 rounded-md bg-white/10 hover:bg-[#C6A75E] flex items-center justify-center transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* الجزء السفلي — حقوق النشر */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
            <p>
              {isAr
                ? "© 2026 منصة مُقدِّم. جميع الحقوق محفوظة."
                : "© 2026 Muqaddim Platform. All rights reserved."}
            </p>
            <p>
              {isAr ? "مشروع تخرّج | جامعة الملك عبدالعزيز | كلية الحاسبات وتقنية المعلومات" : "Graduation Project | King Abdulaziz University | FCIT"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

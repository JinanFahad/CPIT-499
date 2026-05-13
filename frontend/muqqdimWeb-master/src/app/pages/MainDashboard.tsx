import { useState } from "react";          // for tracking which FAQ is open
import { Link } from "react-router";       // SPA navigation links

// Lucide icons used by the various cards/sections
import {
  ChevronDown,
  FileText,
  MessageSquare,
  Building2,
  PresentationIcon,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";

// Footer logo (the rest of the page uses Tailwind backgrounds, no images)
const logoImage = "/assets/logo-color.png";

// motion = Framer Motion for the fade/slide entrance animations
import { motion } from "motion/react";

// Top navigation bar + decorative scattered stars
import { Header } from "../components/Header";
import { Sparkle } from "../components/Sparkle";

// i18n hook (gives us the current language)
import { useLanguage } from "../contexts/LanguageContext";


export default function MainDashboard() {
  // Which FAQ row is currently expanded (null = all collapsed)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Current language + a shorthand boolean for Arabic checks
  const { language } = useLanguage();
  const isAr = language === "ar";

  // ── Services data — rendered as the "Our Services" cards grid ────────
  // Each entry has a title/description in both languages, an icon,
  // a link to the corresponding feature page, and brand colors.
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

  // ── "How It Works" steps — rendered as a 4-step horizontal flow ────
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

  // ── FAQ entries — rendered as collapsible accordion items ──────────
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
    <div className="min-h-screen bg-transparent relative" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Decorative stars scattered along the page edges ── */}
      <Sparkle className="top-[8%] left-[3%]" size={20} />
      <Sparkle className="top-[15%] right-[4%]" size={14} />
      <Sparkle className="top-[25%] left-[8%]" size={12} />
      <Sparkle className="top-[35%] right-[2%]" size={22} />
      <Sparkle className="top-[45%] left-[2%]" size={16} />
      <Sparkle className="top-[55%] right-[6%]" size={18} />
      <Sparkle className="top-[65%] left-[5%]" size={11} />
      <Sparkle className="top-[75%] right-[3%]" size={15} />
      <Sparkle className="top-[85%] left-[4%]" size={13} />
      <Sparkle className="top-[92%] right-[8%]" size={17} />
      <Sparkle className="top-[18%] left-[10%]" size={10} />
      <Sparkle className="top-[50%] right-[10%]" size={12} />

      {/* Top navigation bar (sticky on every page) */}
      <Header />

      {/* ════════ Hero — large welcome headline ════════ */}
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

      {/* ════════ About Us — short paragraph in a glass card ════════ */}
      <section id="about" className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* The glass card with a gold border + subtle gold glow */}
          <motion.div
            className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-12 text-center border border-[#C6A75E]/30 card-glow"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-4xl font-bold text-[#08312D] dark:text-white mb-6">
              {isAr ? "من نحن" : "About Us"}
            </h3>
            <p className="text-[#08312D]/80 dark:text-white/85 text-lg leading-relaxed font-[Changa] max-w-3xl mx-auto">
              {isAr
                ? "مُـقــــدِم هي منصة سعودية متخصصة في تمكين رواد الأعمال من خلال تقديم أدوات ذكية ومتطورة لإنشاء دراسات الجدوى الاحترافية. نجمع بين التقنية المتقدمة والخبرة الاستشارية لنوفر تجربة متكاملة تساعدك على اتخاذ قرارات مدروسة وتحويل أفكارك إلى مشاريع ناجحة على أرض الواقع."
                : "Muqqdim is a Saudi platform specialized in empowering entrepreneurs with smart and advanced tools for creating professional feasibility studies. We combine advanced technology and consulting expertise to provide an integrated experience that helps you make informed decisions and turn your ideas into successful businesses."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════ How It Works — 4-step numbered flow ════════
           Each step is rendered from the `steps` array defined at the top.
           A thin gold line connects steps 1→2→3 (hidden on the last step). */}
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
                {/* Connecting line — switches sides based on RTL/LTR */}
                {index < 3 && (
                  <div className={`hidden md:block absolute top-[22px] w-full h-[1px] bg-[#C6A75E]/30 z-0 ${isAr ? "right-[50%]" : "left-[50%]"}`} />
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

      {/* ════════ Services — 2×2 grid of feature cards ════════
           Built by mapping over the `services` array.
           Each card links to the corresponding feature page. */}
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

      {/* ════════ FAQ — collapsible accordion ════════
           Only one FAQ can be open at a time. Clicking an open FAQ closes it.
           State lives in `openFAQ` (the index of the open one, or null). */}
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

      {/* ════════ Footer ════════
           Three-column layout (logo+blurb / quick links / contact).
           A bottom strip carries copyright + project credit. */}
      <footer className="mt-20 relative z-10 bg-[#08312D] text-white border-t border-[#C6A75E]/30">
        {/* Main upper area with the three columns */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* Column 1 — brand logo + short description */}
            <div>
              <img src={logoImage} alt="مُقدِّم" className="h-20 w-auto mb-4 brightness-0 invert" />
              <p className="text-white/70 text-sm leading-relaxed">
                {isAr
                  ? "منصة سعودية متخصصة في توليد دراسات الجدوى الذكية للمشاريع الصغيرة في قطاع المطاعم والكافيهات."
                  : "A Saudi platform specialized in generating intelligent feasibility studies for small restaurant and café projects."}
              </p>
            </div>

            {/* Column 2 — quick navigation links to feature pages */}
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

            {/* Column 3 — contact info + X (Twitter) social link */}
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

        {/* Bottom strip — copyright + university credit */}
        <div>
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

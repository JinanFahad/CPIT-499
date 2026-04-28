// =====================================================================
// FeasibilityReport.tsx — عارض التقرير الداخلي (تفاعلي بدون تنزيل PDF)
// مكوّن من ٤ تبويبات: مالي، سوق، مخاطر، خطوات
// يحتوي على:
//   - رسوم بيانية بـ Recharts (الإيراد/المصاريف، توزيع التكاليف)
//   - بطاقات مؤشرات (هامش الربح، فترة الاسترداد، إلخ)
//   - جدول المنافسين الحقيقيين من قوقل بلايسز (لو متوفر)
//   - زر "تحميل PDF" يستدعي الباك اند لإعادة التوليد
// =====================================================================

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  Download,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Loader2,
  ArrowLeft,
  FileText,
  Lightbulb,
  Trophy,
  Building2,
  Info,
  Mail,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  ReferenceLine,
} from "recharts";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";

const BACKEND_URL = "http://localhost:5000";

interface ClassifiedCompetitor {
  id: string;
  estimated_cuisine: string;
  confidence: number;
  is_direct_competitor: boolean;
  reason_short: string;
}

interface CompetitorPlace {
  id: string;
  name: string;
  rating: number | null;
  userRatingCount: number | null;
  address: string | null;
}

interface Report {
  title: string;
  executive_summary: any;
  business_overview: {
    business_type: string;
    restaurant_type?: string;
    city: string;
    target_customers: string;
    value_proposition: string;
    main_products?: string[];
  };
  market_analysis: {
    narrative: string;
    competition_level: string;
    market_opportunity_score: number;
    direct_competitor_summary: {
      count: number;
      avg_rating: number;
      strongest_name: string;
      weakest_gap: string;
    };
    bullets: string[];
    recommendations: string[];
    classified_competitors?: ClassifiedCompetitor[];
  };
  competitor_places?: CompetitorPlace[];
  financial_summary: {
    monthly_revenue: number;
    monthly_expenses: number;
    monthly_net_profit: number;
    profit_margin_percent: number;
    break_even_revenue: number;
    payback_period_months: number | null;
    utilities_cost: number;
    overhead_cost: number;
    marketing_cost: number;
    // حقول منحنى التدرّج (تُحقن من المحرك المالي بعد توليد الـ AI)
    month_1_revenue?: number;
    month_1_net_profit?: number;
    break_even_month?: number | null;
    monthly_projection?: Array<{
      month: number;
      ramp_percent: number;
      revenue: number;
      expenses: number;
      net_profit: number;
    }>;
    year_1_total_revenue?: number;
    year_1_total_profit?: number;
    ramp_up_months?: number;
    salaries_total?: number;
    cogs_cost?: number;
    // توقّع 3 سنوات
    yearly_summary?: Array<{
      year: number;
      revenue: number;
      expenses: number;
      net_profit: number;
      cumulative_profit: number;
      cumulative_roi_pct: number;
    }>;
    cumulative_profit_curve?: Array<{
      month: number;
      year: number;
      cumulative_profit: number;
      remaining_to_recoup: number;
    }>;
    total_3_year_profit?: number;
    roi_3_year_percent?: number;
    yearly_revenue_growth?: number;
    yearly_cost_inflation?: number;
    // توزيع رأس المال + التنبؤ بالنجاح/الفشل
    capital_allocation?: Array<{
      key: string;
      label_ar: string;
      label_en: string;
      percent: number;
      amount: number;
    }>;
    operating_cushion?: number;
    inputs_summary?: {
      capital: number;
      rent: number;
      employees: number;
      avg_price: number;
      customers_per_day: number;
      business_type: string;
    };
    success_prediction?: {
      score: number;
      max_score: number;
      score_percent: number;
      outcome: string;
      outcome_color: string;
      outcome_emoji: string;
      message: string;
      factors: Array<{
        name: string;
        value: string;
        rating: string;
        score: number;
        weight: number;
      }>;
    };
    stress_test?: {
      revenue_drop_10pct: number;
      expenses_rise_10pct: number;
      stressed_net_profit: number;
      stressed_margin_pct: number;
    };
    improvement_to_18pct_margin?: {
      target_net_profit: number;
      max_expenses: number;
      required_saving: number;
    };
  };
  decision: {
    classification: string;
    score: number;
    reasons: string[];
    invest_conditions?: string[];
    reject_conditions?: string[];
  };
  risks_and_mitigations: Array<{
    risk: string;
    severity?: string;
    mitigation: string;
  }>;
  next_steps: string[];
}

type TabKey = "financial" | "market" | "risks" | "steps";

export default function FeasibilityReport() {
  const { projectId } = useParams();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [report, setReport] = useState<Report | null>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("financial");
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  // عند فتح الصفحة:
  //   1) نجيب المشروع من /api/projects/:id (نحتاج report_id)
  //   2) نجيب التقرير من /api/reports/:report_id (الدراسة كاملة)
  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      try {
        const projRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}`);
        if (!projRes.ok) throw new Error("Project not found");
        const proj = await projRes.json();
        setProject(proj);

        if (!proj.report_id) {
          throw new Error(
            isAr
              ? "لا توجد دراسة جدوى مرتبطة بهذا المشروع"
              : "No feasibility report linked to this project",
          );
        }

        const repRes = await fetch(`${BACKEND_URL}/api/reports/${proj.report_id}`);
        if (!repRes.ok) throw new Error("Report not found");
        const rep = await repRes.json();
        setReport(rep);
      } catch (err: any) {
        setError(err.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, isAr]);

  const handleDownload = async () => {
    if (!project) return;
    setDownloading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/feasibility/report-pdf`, {
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
          ...(project.lat && project.lng ? { lat: project.lat, lng: project.lng } : {}),
        }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.project_name}_feasibility.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert(isAr ? "فشل تحميل الدراسة" : "Failed to download");
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = async () => {
    if (!project?.report_id) return;
    const userEmail = auth.currentUser?.email;
    if (!userEmail) {
      alert(isAr ? "لازم تسجّلي الدخول أولاً" : "Please log in first");
      return;
    }
    setEmailing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/feasibility/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: project.report_id,
          email: userEmail,
          project_name: project.project_name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      alert(isAr ? `تم الإرسال إلى ${userEmail} ✓` : `Sent to ${userEmail} ✓`);
    } catch (err: any) {
      alert(isAr ? `فشل الإرسال: ${err.message}` : `Send failed: ${err.message}`);
    } finally {
      setEmailing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-[#C6A75E] animate-spin mx-auto mb-4" />
            <p className="text-[#08312D] font-[Changa]">
              {isAr ? "جاري تحميل الدراسة..." : "Loading report..."}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error || !report) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white rounded-xl p-8 max-w-md text-center border border-gray-200 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#08312D] mb-2 font-[Changa]">
              {isAr ? "خطأ" : "Error"}
            </h2>
            <p className="text-gray-600 mb-6 font-[Changa]">{error}</p>
            <Link
              to="/dashboard/my-projects"
              className="inline-flex items-center gap-2 bg-[#08312D] hover:bg-[#0E4A43] rounded-lg px-5 py-2.5 text-white font-[Changa]"
            >
              <ArrowLeft className="w-4 h-4" />
              {isAr ? "العودة لمشاريعي" : "Back to My Projects"}
            </Link>
          </div>
        </div>
      </>
    );
  }

  const fs = report.financial_summary;
  const ma = report.market_analysis;
  const dec = report.decision;
  const exec = report.executive_summary;
  const bo = report.business_overview;

  // التصنيفات الـ5 من success_predictor + التوافق مع التصنيفات القديمة
  const cls = dec.classification;
  const clsLower = cls.toLowerCase();
  const decisionTheme =
    cls.includes("نجاح مرتفع") || cls.includes("مناسب") || clsLower.includes("suitable")
      ? { bg: "#f0fdf4", border: "#15803d", text: "#15803d", icon: "✅" }
      : cls.includes("نجاح محتمل")
        ? { bg: "#f0fdf4", border: "#22c55e", text: "#16a34a", icon: "🟢" }
        : cls.includes("متوسط") || clsLower.includes("moderate") || cls.includes("بشروط")
          ? { bg: "#fffbeb", border: "#f59e0b", text: "#b45309", icon: "🟡" }
          : cls.includes("فشل")
            ? { bg: "#fef2f2", border: "#dc2626", text: "#b91c1c", icon: "🔴" }
            : { bg: "#fff7ed", border: "#ea580c", text: "#9a3412", icon: "🟠" };

  const costData = [
    { name: isAr ? "مرافق" : "Utilities", value: fs.utilities_cost, color: "#3b82f6" },
    { name: isAr ? "تشغيل" : "Overhead", value: fs.overhead_cost, color: "#8b5cf6" },
    { name: isAr ? "تسويق" : "Marketing", value: fs.marketing_cost, color: "#C6A75E" },
  ];

  const financialBars = [
    { name: isAr ? "إيراد" : "Revenue", value: fs.monthly_revenue, color: "#22c55e" },
    { name: isAr ? "مصاريف" : "Expenses", value: fs.monthly_expenses, color: "#ef4444" },
    { name: isAr ? "ربح" : "Profit", value: fs.monthly_net_profit, color: "#08312D" },
  ];

  const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
    { key: "financial", label: isAr ? "التحليل المالي" : "Financial", icon: DollarSign },
    { key: "market", label: isAr ? "تحليل السوق" : "Market", icon: BarChart3 },
    { key: "risks", label: isAr ? "المخاطر" : "Risks", icon: AlertTriangle },
    { key: "steps", label: isAr ? "الخطوات" : "Next Steps", icon: CheckCircle },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6 lg:p-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <motion.div
            className="rounded-2xl p-8 shadow-lg"
            style={{ background: "linear-gradient(135deg, #08312D 0%, #0E4A43 100%)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3 text-xs text-white font-[Changa]">
                  <FileText className="w-3 h-3" />
                  {isAr ? "دراسة جدوى" : "Feasibility Report"}
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 font-[Changa]">{report.title}</h1>
                <p className="text-white/70 font-[Changa]">
                  {bo.business_type} · {bo.city}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading || emailing}
                  className="bg-[#C6A75E] hover:bg-[#a88f4e] rounded-lg px-5 py-3 text-white font-bold flex items-center gap-2 transition-all disabled:opacity-60 font-[Changa]"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isAr ? "تحميل PDF" : "Download PDF"}
                </button>
                <button
                  onClick={handleEmail}
                  disabled={emailing || downloading}
                  title={isAr ? "إرسال إلى إيميلي" : "Send to my email"}
                  className="bg-white hover:bg-gray-100 rounded-lg px-5 py-3 text-[#08312D] font-bold flex items-center gap-2 transition-all disabled:opacity-60 font-[Changa]"
                >
                  {emailing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {isAr ? "إرسال للإيميل" : "Email Me"}
                </button>
                <Link
                  to="/dashboard/my-projects"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-5 py-3 text-white font-bold flex items-center gap-2 transition-all font-[Changa]"
                >
                  <ArrowLeft className={`w-4 h-4 ${!isAr ? "rotate-180" : ""}`} />
                  {isAr ? "رجوع" : "Back"}
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Success Prediction Banner — prominent at top */}
          {fs.success_prediction && (() => {
            const sp = fs.success_prediction;
            const colorMap: Record<string, { bg: string; border: string; text: string; bar: string }> = {
              green:      { bg: "#f0fdf4", border: "#86efac", text: "#15803d", bar: "#15803d" },
              lightgreen: { bg: "#f0fdf4", border: "#86efac", text: "#22c55e", bar: "#22c55e" },
              amber:      { bg: "#fffbeb", border: "#fcd34d", text: "#b45309", bar: "#f59e0b" },
              orange:     { bg: "#fff7ed", border: "#fdba74", text: "#ea580c", bar: "#ea580c" },
              red:        { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", bar: "#dc2626" },
            };
            const theme = colorMap[sp.outcome_color] || colorMap.amber;
            return (
              <motion.div
                className="rounded-2xl p-6 border-2"
                style={{ background: theme.bg, borderColor: theme.border }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[260px]">
                    <div className="text-xs text-gray-600 mb-1 font-[Changa] flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      {isAr ? "تنبؤ نتيجة المشروع" : "Project Outcome Prediction"}
                    </div>
                    <div className="text-2xl font-black mb-2 font-[Changa]" style={{ color: theme.text }}>
                      {sp.outcome_emoji} {sp.outcome}
                    </div>
                    <p className="text-sm text-gray-700 font-[Changa] leading-relaxed">{sp.message}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 min-w-[140px]">
                    <div className="text-5xl font-black font-[Changa]" style={{ color: theme.text }}>
                      {sp.score}
                      <span className="text-xl text-gray-400">/{sp.max_score}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${sp.score_percent}%`, background: theme.bar }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 font-[Changa]">{isAr ? "درجة النجاح المرجّحة" : "Weighted success score"}</p>
                  </div>
                </div>

                {/* Factors breakdown */}
                <div className="mt-4 pt-4 border-t border-white/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                    {sp.factors.map((f) => {
                      const pct = (f.score / f.weight) * 100;
                      return (
                        <div key={f.name} className="bg-white/70 rounded-lg p-3">
                          <div className="text-xs text-gray-600 font-[Changa] mb-1 line-clamp-2">{f.name}</div>
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-sm font-bold text-[#08312D] font-[Changa]">
                              {f.score}/{f.weight}
                            </span>
                            <span className="text-xs text-gray-500 font-[Changa]">{f.rating}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${pct}%`,
                                background: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#dc2626",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* Steady-state notice */}
          {fs.ramp_up_months && (
            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-blue-900 font-[Changa]">
                <strong>{isAr ? "ملاحظة منهجية:" : "Methodology note:"}</strong>{" "}
                {isAr
                  ? `الأرقام الشهرية بالأسفل تمثّل وضع التشغيل المستقر بعد ${fs.ramp_up_months} أشهر من الافتتاح. الأشهر الأولى بطبيعتها أقل (يبدأ المشروع بـ 50% من العملاء المتوقعين ويتدرّج للوصول لكامل طاقته). راجع جدول التوقع الشهري في التبويب المالي.`
                  : `The monthly figures below represent steady-state operation after ${fs.ramp_up_months} months. The first months naturally start lower (50% of target customers, ramping up to full capacity). See the monthly projection in the Financial tab.`}
              </div>
            </motion.div>
          )}

          {/* Unviable Project Warning Banner */}
          {(fs.profit_margin_percent <= 0 || !fs.payback_period_months) && (
            <motion.div
              className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-900 font-bold text-lg mb-2 font-[Changa]">
                    {isAr ? "المشروع غير مجدي بهذي الأرقام" : "Project Not Viable With These Numbers"}
                  </h3>
                  <p className="text-red-800 text-sm leading-relaxed mb-3 font-[Changa]">
                    {isAr
                      ? `المصاريف الشهرية أعلى من الإيرادات، فالمشروع يخسر ${Math.abs(fs.monthly_net_profit).toLocaleString()} ر.س شهرياً. ما يمكن حساب فترة استرداد لأنه ما فيه ربح يغطي رأس المال.`
                      : `Monthly expenses exceed revenue — the project loses ${Math.abs(fs.monthly_net_profit).toLocaleString()} SAR/month. Payback can't be calculated because there's no profit to recover the capital.`}
                  </p>
                  <div className="bg-white/70 rounded-lg p-3 border border-red-200">
                    <p className="text-red-900 text-xs font-bold mb-2 font-[Changa]">
                      {isAr ? "💡 جربي تعديل المدخلات:" : "💡 Try adjusting these inputs:"}
                    </p>
                    <ul className="text-red-800 text-xs space-y-1 font-[Changa]">
                      <li>{isAr ? "• قللي عدد الموظفين (الرواتب أكبر بند مصروف)" : "• Reduce employee count (salaries are the biggest expense)"}</li>
                      <li>{isAr ? "• زيدي عدد العملاء المتوقعين يومياً" : "• Increase expected daily customers"}</li>
                      <li>{isAr ? "• ارفعي متوسط سعر المنتج لو واقعي" : "• Increase average product price if realistic"}</li>
                      <li>{isAr ? "• خفضي الإيجار (ابحثي عن موقع أرخص)" : "• Lower rent (find a cheaper location)"}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={DollarSign}
              label={isAr ? "إيراد شهري (مستقر)" : "Monthly Revenue (steady)"}
              value={`${fs.monthly_revenue.toLocaleString()} ${isAr ? "ر.س" : "SAR"}`}
              color="#22c55e"
              hint={isAr ? "إجمالي المبيعات الشهرية المتوقعة بعد استقرار المشروع." : "Total expected monthly sales after the project stabilizes."}
            />
            <KpiCard
              icon={TrendingUp}
              label={isAr ? "هامش الربح (مستقر)" : "Profit Margin (steady)"}
              value={`${fs.profit_margin_percent}%`}
              color={fs.profit_margin_percent <= 0 ? "#dc2626" : "#C6A75E"}
              hint={isAr ? "نسبة صافي الربح من الإيراد. القاعدة: 10% متوسط، 20%+ ممتاز." : "Net profit as % of revenue. 10% is moderate, 20%+ is excellent."}
            />
            <KpiCard
              icon={Calendar}
              label={isAr ? "فترة الاسترداد" : "Payback"}
              value={
                fs.payback_period_months
                  ? `${fs.payback_period_months.toFixed(1)} ${isAr ? "شهر" : "mo"}`
                  : (isAr ? "غير ممكن" : "Not possible")
              }
              color={fs.payback_period_months ? "#3b82f6" : "#dc2626"}
              hint={
                fs.payback_period_months
                  ? (isAr ? "كم شهر تحتاجين لاسترداد رأس المال (مع احتساب خسائر الأشهر الأولى)." : "Months needed to recoup capital (accounting for early-month losses).")
                  : (isAr ? "ما يمكن حسابها لأن المشروع خاسر — لازم يكون فيه ربح صافي شهري حتى نقدر نحسب." : "Can't be calculated — the project is losing money, so there's no profit to recoup capital.")
              }
            />
            <KpiCard
              icon={Target}
              label={isAr ? "فرصة السوق" : "Market Score"}
              value={ma ? `${ma.market_opportunity_score}/10` : "—"}
              color="#8b5cf6"
              hint={isAr ? "تقييم السوق المحلي بناءً على المنافسين القريبين وكثافة الطلب." : "Market score based on nearby competitors and demand density."}
            />
          </div>

          {/* Decision + Executive Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Decision */}
            <motion.div
              className="lg:col-span-1 rounded-2xl p-6 border-2 shadow-sm"
              style={{ background: decisionTheme.bg, borderColor: decisionTheme.border }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-4xl mb-3">{decisionTheme.icon}</div>
              <div className="text-xs text-gray-600 mb-1 font-[Changa]">
                {isAr ? "القرار الاستثماري" : "Investment Decision"}
              </div>
              <div className="text-xl font-bold mb-3 font-[Changa]" style={{ color: decisionTheme.text }}>
                {dec.classification}
              </div>
              <div className="flex items-center gap-2 text-sm font-[Changa]">
                <Trophy className="w-4 h-4" style={{ color: decisionTheme.text }} />
                <span className="text-gray-700">
                  {dec.score} / 4 {isAr ? "نقاط" : "points"}
                </span>
              </div>
            </motion.div>

            {/* Executive Summary */}
            <motion.div
              className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <h3 className="text-lg font-bold text-[#08312D] mb-3 font-[Changa]">
                {isAr ? "الملخص التنفيذي" : "Executive Summary"}
              </h3>
              {typeof exec === "object" && exec.verdict ? (
                <>
                  <p className="text-gray-700 leading-relaxed mb-4 font-[Changa]">{exec.verdict}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exec.key_opportunity && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-green-700 mb-1 font-[Changa]">
                          ✦ {isAr ? "الفرصة" : "Opportunity"}
                        </div>
                        <div className="text-sm text-gray-700 font-[Changa]">{exec.key_opportunity}</div>
                      </div>
                    )}
                    {exec.key_concern && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-red-700 mb-1 font-[Changa]">
                          ⚠ {isAr ? "المخاطرة" : "Concern"}
                        </div>
                        <div className="text-sm text-gray-700 font-[Changa]">{exec.key_concern}</div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-700 leading-relaxed font-[Changa]">{String(exec)}</p>
              )}
            </motion.div>
          </div>

          {/* Project Inputs Summary — for quick reference without going back */}
          {fs.inputs_summary && (
            <motion.div
              className="bg-slate-50 border border-slate-200 rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-700 font-[Changa]">
                  {isAr ? "📋 بيانات المشروع المُدخلة" : "📋 Project Inputs"}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <div className="text-xs text-slate-500 font-[Changa] mb-1">{isAr ? "رأس المال" : "Capital"}</div>
                  <div className="text-sm font-bold text-[#08312D] font-[Changa]">
                    {fs.inputs_summary.capital.toLocaleString()} {isAr ? "ر.س" : "SAR"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-[Changa] mb-1">{isAr ? "الإيجار/شهر" : "Rent/mo"}</div>
                  <div className="text-sm font-bold text-[#08312D] font-[Changa]">
                    {fs.inputs_summary.rent.toLocaleString()} {isAr ? "ر.س" : "SAR"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-[Changa] mb-1">{isAr ? "الموظفين" : "Employees"}</div>
                  <div className="text-sm font-bold text-[#08312D] font-[Changa]">{fs.inputs_summary.employees}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-[Changa] mb-1">{isAr ? "سعر الوجبة" : "Avg Price"}</div>
                  <div className="text-sm font-bold text-[#08312D] font-[Changa]">
                    {fs.inputs_summary.avg_price.toLocaleString()} {isAr ? "ر.س" : "SAR"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-[Changa] mb-1">{isAr ? "العملاء/يوم" : "Customers/day"}</div>
                  <div className="text-sm font-bold text-[#08312D] font-[Changa]">{fs.inputs_summary.customers_per_day}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-[Changa] mb-1">{isAr ? "الإيراد/شهر (محسوب)" : "Revenue/mo (calc)"}</div>
                  <div className="text-sm font-bold text-[#08312D] font-[Changa]">
                    {(fs.inputs_summary.avg_price * fs.inputs_summary.customers_per_day * 28).toLocaleString()} {isAr ? "ر.س" : "SAR"}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-[Changa] mt-3">
                {isAr
                  ? "الإيراد = سعر الوجبة × العملاء يومياً × 28 يوم (الشهر بـ 28 يوم احتياطاً للإجازات)"
                  : "Revenue = price × customers/day × 28 days (28-day month accounts for holidays)"}
              </p>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="border-b border-gray-200 flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-all whitespace-nowrap font-[Changa] ${
                      active
                        ? "text-[#C6A75E] border-b-2 border-[#C6A75E] bg-[#FFF9F0]"
                        : "text-gray-500 hover:text-[#08312D] hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6 lg:p-8">
              {/* Financial Tab */}
              {activeTab === "financial" && (
                <div className="space-y-6">
                  {/* Profit Margin Explainer */}
                  {(() => {
                    const m = fs.profit_margin_percent;
                    const tiers = [
                      { range: "15%+", label: isAr ? "ممتاز — أعلى من معيار القطاع" : "Excellent", min: 15, max: Infinity, bg: "bg-green-100", border: "border-green-300" },
                      { range: "7% - 15%", label: isAr ? "جيد — المعدل الطبيعي للقطاع" : "Good (industry standard)", min: 7, max: 15, bg: "bg-green-100", border: "border-green-300" },
                      { range: "3% - 7%", label: isAr ? "ضعيف لكن موجب — يحتاج تحسين" : "Weak but positive", min: 3, max: 7, bg: "bg-amber-100", border: "border-amber-300" },
                      { range: "0% - 3%", label: isAr ? "حدّي قرب الصفر — لا يصمد لأي ضغط" : "Marginal — won't survive shocks", min: 0, max: 3, bg: "bg-orange-100", border: "border-orange-300" },
                      { range: isAr ? "أقل من 0%" : "< 0%", label: isAr ? "خسارة — المصاريف تتجاوز الإيراد" : "Loss", min: -Infinity, max: 0, bg: "bg-red-100", border: "border-red-300" },
                    ];
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-blue-700" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-blue-900 font-[Changa]">
                              {isAr ? "📚 ما هو هامش الربح؟ (شرح)" : "What is Profit Margin? (Explained)"}
                            </h3>
                            <p className="text-xs text-blue-700 font-[Changa] mt-1">
                              {isAr
                                ? "نسبة ما يبقى من كل ريال مبيعات بعد طرح كل التكاليف"
                                : "% of revenue retained after all costs are paid"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                          <div className="text-xs text-gray-500 font-[Changa] mb-1">{isAr ? "الصيغة" : "Formula"}</div>
                          <div className="text-sm font-bold text-[#08312D] font-[Changa] mb-3 font-mono" style={{ direction: "ltr" }}>
                            {isAr ? "هامش الربح" : "Margin"} = ({isAr ? "صافي الربح" : "Net Profit"} ÷ {isAr ? "الإيراد" : "Revenue"}) × 100
                          </div>
                          <div className="text-xs text-gray-500 font-[Changa] mb-1 mt-3">{isAr ? "حسابكِ الفعلي" : "Your calculation"}</div>
                          <div className="text-base font-bold text-blue-900 font-[Changa] font-mono" style={{ direction: "ltr" }}>
                            ({fs.monthly_net_profit.toLocaleString()} ÷ {fs.monthly_revenue.toLocaleString()}) × 100 = <span className="text-2xl">{m}%</span>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-gray-700 mb-2 font-[Changa]">
                          {isAr ? "التقييم في قطاع المطاعم السعودي:" : "Saudi Restaurant Industry Benchmarks:"}
                        </div>
                        <div className="space-y-1.5">
                          {tiers.map((tier, i) => {
                            const isCurrent = m >= tier.min && m < tier.max;
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                                  isCurrent ? `${tier.bg} ${tier.border} font-bold` : "bg-white border-gray-200"
                                }`}
                              >
                                <span className="text-xs font-mono text-gray-700 min-w-[80px] font-[Changa]" style={{ direction: "ltr" }}>{tier.range}</span>
                                <span className="text-xs text-gray-700 flex-1 font-[Changa]">{tier.label}</span>
                                {isCurrent && <span className="text-sm font-[Changa]">{isAr ? "أنتِ هنا" : "← You"}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Capital Allocation */}
                  {fs.capital_allocation && fs.capital_allocation.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-purple-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#08312D] font-[Changa]">
                            {isAr ? "توزيع رأس المال" : "Capital Allocation"}
                          </h3>
                          <p className="text-xs text-gray-600 font-[Changa] mt-1">
                            {isAr
                              ? "توزيع تقديري بناءً على معايير قطاع المطاعم في السعودية"
                              : "Estimated breakdown based on Saudi restaurant industry standards"}
                          </p>
                        </div>
                      </div>

                      <table className="w-full text-sm font-[Changa]">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 text-xs">
                            <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "البند" : "Item"}</th>
                            <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "النسبة" : "%"}</th>
                            <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المبلغ" : "Amount"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fs.capital_allocation.map((a) => (
                            <tr
                              key={a.key}
                              className={`border-b border-gray-100 ${a.key === "cushion" ? "bg-amber-50" : ""}`}
                            >
                              <td className="py-3 font-bold text-[#08312D]">
                                {isAr ? a.label_ar : a.label_en}
                                {a.key === "cushion" && " ⭐"}
                              </td>
                              <td className="py-3 text-gray-600">{a.percent}%</td>
                              <td className="py-3 font-bold text-[#08312D]">
                                {a.amount.toLocaleString()} {isAr ? "ر.س" : "SAR"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <p className="text-xs text-gray-500 mt-3 font-[Changa] leading-relaxed">
                        ⭐{" "}
                        <strong>
                          {isAr ? "الاحتياطي التشغيلي" : "Operating Cushion"}:
                        </strong>{" "}
                        {isAr
                          ? "المبلغ المخصص لتغطية خسائر الأشهر الأولى قبل وصول المشروع لمرحلة الاستقرار."
                          : "Reserved to cover early-month losses before the project stabilizes."}
                      </p>

                      {/* Cushion vs Year-1 loss warning */}
                      {fs.year_1_total_profit !== undefined &&
                        fs.year_1_total_profit < 0 &&
                        fs.operating_cushion !== undefined &&
                        (() => {
                          const loss = Math.abs(fs.year_1_total_profit);
                          const insufficient = fs.operating_cushion < loss;
                          return insufficient ? (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-800 font-[Changa] font-bold mb-1">
                                ⚠ {isAr ? "تنبيه: الاحتياطي غير كافٍ" : "Warning: Insufficient cushion"}
                              </p>
                              <p className="text-xs text-red-700 font-[Changa] leading-relaxed">
                                {isAr
                                  ? `الاحتياطي (${fs.operating_cushion.toLocaleString()} ر.س) أقل من خسائر السنة الأولى المتوقعة (${loss.toLocaleString()} ر.س). يُنصح بزيادة رأس المال بـ ${(loss - fs.operating_cushion).toLocaleString()} ر.س على الأقل، أو إعادة هيكلة المشروع.`
                                  : `Cushion (${fs.operating_cushion.toLocaleString()} SAR) is less than expected Year-1 loss (${loss.toLocaleString()} SAR). Recommend increasing capital by at least ${(loss - fs.operating_cushion).toLocaleString()} SAR, or restructuring.`}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-800 font-[Changa]">
                                ✓{" "}
                                {isAr
                                  ? `الاحتياطي (${fs.operating_cushion.toLocaleString()} ر.س) يغطي خسائر السنة الأولى المتوقعة (${loss.toLocaleString()} ر.س).`
                                  : `Cushion (${fs.operating_cushion.toLocaleString()} SAR) covers expected Year-1 loss (${loss.toLocaleString()} SAR).`}
                              </p>
                            </div>
                          );
                        })()}
                    </div>
                  )}

                  {/* Year-1 Journey: Ramp-up projection */}
                  {fs.monthly_projection && fs.monthly_projection.length > 0 && (
                    <div className="bg-gradient-to-br from-[#FFF9F0] to-white border border-[#C6A75E]/30 rounded-xl p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#C6A75E]/20 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-[#C6A75E]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#08312D] font-[Changa]">
                            {isAr ? "رحلة السنة الأولى" : "Year-1 Journey"}
                          </h3>
                          <p className="text-xs text-gray-600 font-[Changa] mt-1">
                            {isAr
                              ? "توقّع الإيراد والربح شهر-بشهر مع منحنى تدرّج العملاء (50% → 100%)"
                              : "Monthly revenue & profit projection with customer ramp-up (50% → 100%)"}
                          </p>
                        </div>
                      </div>

                      {/* Quick comparison cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        <RampStat
                          label={isAr ? "شهر 1" : "Month 1"}
                          revenue={fs.month_1_revenue ?? 0}
                          profit={fs.month_1_net_profit ?? 0}
                          isAr={isAr}
                        />
                        <RampStat
                          label={isAr ? "تشغيل مستقر" : "Steady-state"}
                          revenue={fs.monthly_revenue}
                          profit={fs.monthly_net_profit}
                          isAr={isAr}
                          highlight
                        />
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1 font-[Changa]">
                            {isAr ? "أول شهر يصل لنقطة التعادل" : "Break-even month"}
                          </div>
                          <div className="text-lg font-bold text-[#08312D] font-[Changa]">
                            {fs.break_even_month ? `${fs.break_even_month}` : "—"}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1 font-[Changa]">
                            {isAr ? "صافي ربح السنة 1" : "Year-1 net profit"}
                          </div>
                          <div className={`text-lg font-bold font-[Changa] ${(fs.year_1_total_profit ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {(fs.year_1_total_profit ?? 0).toLocaleString()} {isAr ? "ر.س" : "SAR"}
                          </div>
                        </div>
                      </div>

                      {/* 12-month line chart */}
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={fs.monthly_projection}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" stroke="#6b7280" tickFormatter={(m) => `${isAr ? "ش" : "M"}${m}`} />
                          <YAxis stroke="#6b7280" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                          <Tooltip
                            formatter={(v: number) => v.toLocaleString() + (isAr ? " ر.س" : " SAR")}
                            labelFormatter={(m) => isAr ? `الشهر ${m}` : `Month ${m}`}
                          />
                          <Legend />
                          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="revenue" name={isAr ? "إيراد" : "Revenue"} stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="expenses" name={isAr ? "مصاريف" : "Expenses"} stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="net_profit" name={isAr ? "صافي ربح" : "Net Profit"} stroke="#08312D" strokeWidth={2.5} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* 3-Year Projection + Payback Recovery Chart */}
                  {fs.yearly_summary && fs.yearly_summary.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#08312D]/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-[#08312D]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-[#08312D] font-[Changa]">
                            {isAr ? "التوقع لـ 3 سنوات" : "3-Year Projection"}
                          </h3>
                          <p className="text-xs text-gray-600 font-[Changa] mt-1">
                            {isAr
                              ? `الافتراضات: نمو إيراد +${Math.round((fs.yearly_revenue_growth ?? 0.10) * 100)}% سنوياً، تضخم تكاليف ثابتة +${Math.round((fs.yearly_cost_inflation ?? 0.05) * 100)}% سنوياً`
                              : `Assumptions: revenue growth +${Math.round((fs.yearly_revenue_growth ?? 0.10) * 100)}%/year, fixed-cost inflation +${Math.round((fs.yearly_cost_inflation ?? 0.05) * 100)}%/year`}
                          </p>
                        </div>
                      </div>

                      {/* Yearly summary table */}
                      <div className="overflow-x-auto mb-5">
                        <table className="w-full text-sm font-[Changa]">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-500 text-xs">
                              <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "السنة" : "Year"}</th>
                              <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "الإيراد" : "Revenue"}</th>
                              <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المصاريف" : "Expenses"}</th>
                              <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "صافي الربح" : "Net Profit"}</th>
                              <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "تراكمي" : "Cumulative"}</th>
                              <th className={`py-2 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "ROI" : "ROI"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fs.yearly_summary.map((y) => {
                              const profitPositive = y.net_profit >= 0;
                              const cumulPositive = y.cumulative_profit >= 0;
                              const recouped = y.cumulative_roi_pct >= 100;
                              return (
                                <tr key={y.year} className="border-b border-gray-100">
                                  <td className="py-3 font-bold text-[#08312D]">
                                    {isAr ? `السنة ${y.year}` : `Year ${y.year}`}
                                  </td>
                                  <td className="py-3 text-[#08312D]">{y.revenue.toLocaleString()}</td>
                                  <td className="py-3 text-gray-600">{y.expenses.toLocaleString()}</td>
                                  <td className={`py-3 font-bold ${profitPositive ? "text-green-700" : "text-red-700"}`}>
                                    {profitPositive ? "+" : ""}{y.net_profit.toLocaleString()}
                                  </td>
                                  <td className={`py-3 font-bold ${cumulPositive ? "text-green-700" : "text-red-700"}`}>
                                    {cumulPositive ? "+" : ""}{y.cumulative_profit.toLocaleString()}
                                  </td>
                                  <td className={`py-3 font-bold ${recouped ? "text-green-700" : "text-amber-700"}`}>
                                    {y.cumulative_roi_pct.toFixed(0)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* ROI summary banner */}
                      <div className={`rounded-lg p-4 mb-5 ${(fs.roi_3_year_percent ?? 0) >= 100 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                        <div className="flex items-center gap-3">
                          <Trophy className={`w-6 h-6 ${(fs.roi_3_year_percent ?? 0) >= 100 ? "text-green-700" : "text-amber-700"}`} />
                          <div>
                            <div className="text-xs text-gray-600 font-[Changa]">
                              {isAr ? "العائد على الاستثمار بعد 3 سنوات (ROI)" : "Return on Investment after 3 years"}
                            </div>
                            <div className={`text-2xl font-black font-[Changa] ${(fs.roi_3_year_percent ?? 0) >= 100 ? "text-green-700" : "text-amber-700"}`}>
                              {fs.roi_3_year_percent?.toFixed(1) ?? "—"}%
                              <span className="text-sm font-normal text-gray-600 ml-2">
                                ({(fs.total_3_year_profit ?? 0).toLocaleString()} {isAr ? "ر.س ربح صافي" : "SAR net"})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payback recovery chart */}
                      {fs.cumulative_profit_curve && (
                        <div>
                          <h4 className="text-sm font-bold text-[#08312D] mb-3 font-[Changa] flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#3b82f6]" />
                            {isAr ? "منحنى استرداد رأس المال" : "Capital Recovery Curve"}
                          </h4>
                          <p className="text-xs text-gray-600 mb-3 font-[Changa]">
                            {isAr
                              ? `الخط الأخضر يبيّن الربح التراكمي شهرياً. لمّا يقطع الخط المتقطع الأحمر (= رأس المال)، تكون استرديتي استثمارك. ${fs.payback_period_months ? `يحدث ذلك في الشهر ${Math.round(fs.payback_period_months)}.` : "لا يحدث استرداد ضمن 3 سنوات."}`
                              : `The green line shows cumulative profit. When it crosses the dashed red line (= capital), your investment is recouped. ${fs.payback_period_months ? `This happens in month ${Math.round(fs.payback_period_months)}.` : "Recovery does not occur within 3 years."}`}
                          </p>
                          <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={fs.cumulative_profit_curve}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="month"
                                stroke="#6b7280"
                                tickFormatter={(m) => `${isAr ? "ش" : "M"}${m}`}
                                ticks={[1, 6, 12, 18, 24, 30, 36]}
                              />
                              <YAxis
                                stroke="#6b7280"
                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                              />
                              <Tooltip
                                formatter={(v: number) => v.toLocaleString() + (isAr ? " ر.س" : " SAR")}
                                labelFormatter={(m) => isAr ? `الشهر ${m}` : `Month ${m}`}
                              />
                              <ReferenceLine y={0} stroke="#9ca3af" />
                              <ReferenceLine
                                y={fs.payback_period_months ? (project?.capital || 0) : 0}
                                stroke="#dc2626"
                                strokeDasharray="6 4"
                                label={{
                                  value: isAr ? `رأس المال (${(project?.capital || 0).toLocaleString()})` : `Capital (${(project?.capital || 0).toLocaleString()})`,
                                  fill: "#dc2626",
                                  fontSize: 11,
                                  position: "insideTopRight",
                                }}
                              />
                              {fs.payback_period_months && (
                                <ReferenceLine
                                  x={Math.round(fs.payback_period_months)}
                                  stroke="#22c55e"
                                  strokeDasharray="3 3"
                                  label={{
                                    value: isAr ? `استرداد: ش ${Math.round(fs.payback_period_months)}` : `Payback: M${Math.round(fs.payback_period_months)}`,
                                    fill: "#22c55e",
                                    fontSize: 11,
                                    position: "top",
                                  }}
                                />
                              )}
                              <Line
                                type="monotone"
                                dataKey="cumulative_profit"
                                name={isAr ? "ربح تراكمي" : "Cumulative Profit"}
                                stroke="#22c55e"
                                strokeWidth={3}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-[#08312D] mb-4 font-[Changa]">
                      {isAr ? "الإيرادات والمصاريف (تشغيل مستقر)" : "Revenue & Expenses (steady-state)"}
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={financialBars} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" />
                        <YAxis dataKey="name" type="category" stroke="#6b7280" width={80} />
                        <Tooltip formatter={(v: number) => v.toLocaleString() + " SAR"} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {financialBars.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatBox label={isAr ? "نقطة التعادل" : "Break-even"} value={`${fs.break_even_revenue.toLocaleString()} ${isAr ? "ر.س/شهر" : "SAR/mo"}`} />
                    <StatBox
                      label={isAr ? "فترة الاسترداد" : "Payback Period"}
                      value={fs.payback_period_months ? `${fs.payback_period_months.toFixed(1)} ${isAr ? "شهر" : "months"}` : "—"}
                    />
                  </div>

                  {/* Cost Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-[#08312D] mb-4 font-[Changa]">
                      {isAr ? "توزيع التكاليف" : "Cost Breakdown"}
                    </h3>
                    <div className="space-y-3">
                      {costData.map((item) => {
                        const total = costData.reduce((s, i) => s + i.value, 0);
                        const pct = total > 0 ? (item.value / total) * 100 : 0;
                        return (
                          <div key={item.name}>
                            <div className="flex justify-between text-sm mb-1 font-[Changa]">
                              <span className="font-semibold text-[#08312D]">{item.name}</span>
                              <span className="text-gray-600">
                                {item.value.toLocaleString()} {isAr ? "ر.س" : "SAR"} ({pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${pct}%`, background: item.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stress Test */}
                  {fs.stress_test && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-amber-900 mb-4 flex items-center gap-2 font-[Changa]">
                        ⚡ {isAr ? "اختبار الضغط — انخفاض العملاء 10% + ارتفاع التكاليف 10%" : "Stress Test — 10% revenue drop + 10% cost rise"}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StressItem label={isAr ? "الإيراد بعد الضغط" : "Stressed Revenue"} value={`${fs.stress_test.revenue_drop_10pct.toLocaleString()}`} />
                        <StressItem label={isAr ? "التكاليف بعد الضغط" : "Stressed Expenses"} value={`${fs.stress_test.expenses_rise_10pct.toLocaleString()}`} />
                        <StressItem label={isAr ? "صافي الربح" : "Net Profit"} value={`${fs.stress_test.stressed_net_profit.toLocaleString()}`} negative={fs.stress_test.stressed_net_profit < 0} />
                        <StressItem label={isAr ? "الهامش" : "Margin"} value={`${fs.stress_test.stressed_margin_pct.toFixed(1)}%`} negative={fs.stress_test.stressed_margin_pct < 0} />
                      </div>
                    </div>
                  )}

                  {/* Improvement */}
                  {fs.improvement_to_18pct_margin && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2 font-[Changa]">
                        🎯 {isAr ? "المطلوب للوصول إلى هامش 18%" : "Required to reach 18% margin"}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StressItem label={isAr ? "صافي ربح مستهدف" : "Target Profit"} value={`${fs.improvement_to_18pct_margin.target_net_profit.toLocaleString()}`} positive />
                        <StressItem label={isAr ? "الحد الأقصى للمصروفات" : "Max Expenses"} value={`${fs.improvement_to_18pct_margin.max_expenses.toLocaleString()}`} positive />
                        <StressItem label={isAr ? "التوفير المطلوب" : "Required Saving"} value={`${fs.improvement_to_18pct_margin.required_saving.toLocaleString()}`} positive />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Market Tab */}
              {activeTab === "market" && ma && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    <div className="flex-shrink-0 rounded-2xl p-6 text-white text-center" style={{ background: "linear-gradient(135deg, #08312D, #22c55e)" }}>
                      <div className="text-5xl font-black">{ma.market_opportunity_score}</div>
                      <div className="text-sm opacity-75">/ 10</div>
                      <div className="text-xs mt-2 opacity-90 font-[Changa]">{isAr ? "فرصة السوق" : "Market Opportunity"}</div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-[#08312D]">{ma.direct_competitor_summary.count}</div>
                        <div className="text-xs text-gray-600 mt-1 font-[Changa]">{isAr ? "منافس مباشر" : "Direct competitors"}</div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-amber-700">{ma.direct_competitor_summary.avg_rating || "—"}</div>
                        <div className="text-xs text-gray-600 mt-1 font-[Changa]">{isAr ? "متوسط التقييم" : "Avg rating"}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center">
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-[Changa] ${
                          ma.competition_level === "منخفض" ? "bg-green-100 text-green-700" :
                          ma.competition_level === "متوسط" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {ma.competition_level}
                        </div>
                        <div className="text-xs text-gray-600 mt-2 font-[Changa]">{isAr ? "مستوى المنافسة" : "Competition"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-[#08312D] mb-3 font-[Changa]">
                      {isAr ? "نظرة على السوق" : "Market Overview"}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-sm font-[Changa]">{ma.narrative}</p>
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-[Changa]">
                      <div>
                        <span className="font-bold text-[#08312D]">🏆 {isAr ? "أقوى منافس:" : "Strongest:"} </span>
                        <span className="text-gray-700">{ma.direct_competitor_summary.strongest_name}</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#08312D]">💡 {isAr ? "الفجوة:" : "Gap:"} </span>
                        <span className="text-gray-700">{ma.direct_competitor_summary.weakest_gap}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-[#08312D] mb-3 font-[Changa]">
                        {isAr ? "أبرز النقاط" : "Key Points"}
                      </h3>
                      <ul className="space-y-2">
                        {ma.bullets.map((b, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700 font-[Changa]">
                            <span className="text-[#C6A75E] flex-shrink-0">◆</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-[#08312D] mb-3 flex items-center gap-2 font-[Changa]">
                        <Lightbulb className="w-4 h-4 text-[#C6A75E]" />
                        {isAr ? "التوصيات" : "Recommendations"}
                      </h3>
                      <ol className="space-y-2">
                        {ma.recommendations.map((r, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-700 font-[Changa]">
                            <span className="w-6 h-6 rounded-full bg-[#08312D] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {ma.classified_competitors && ma.classified_competitors.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-[#08312D] mb-4 font-[Changa]">
                        {isAr
                          ? `المطاعم المجاورة (${ma.classified_competitors.length})`
                          : `Nearby Restaurants (${ma.classified_competitors.length})`}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="text-right py-3 px-2 text-gray-600 font-semibold font-[Changa]">
                                {isAr ? "الاسم" : "Name"}
                              </th>
                              <th className="text-right py-3 px-2 text-gray-600 font-semibold font-[Changa]">
                                {isAr ? "نوع المطبخ" : "Cuisine"}
                              </th>
                              <th className="text-right py-3 px-2 text-gray-600 font-semibold font-[Changa]">
                                {isAr ? "التقييم" : "Rating"}
                              </th>
                              <th className="text-right py-3 px-2 text-gray-600 font-semibold font-[Changa]">
                                {isAr ? "النوع" : "Type"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...ma.classified_competitors]
                              .sort((a, b) => Number(b.is_direct_competitor) - Number(a.is_direct_competitor))
                              .map((c) => {
                                const place = report.competitor_places?.find((p) => p.id === c.id);
                                return (
                                  <tr
                                    key={c.id}
                                    className={`border-b border-gray-100 ${c.is_direct_competitor ? "bg-red-50/50" : ""}`}
                                  >
                                    <td className="py-3 px-2 text-[#08312D] font-medium font-[Changa] max-w-[200px] truncate">
                                      {place?.name || c.id}
                                    </td>
                                    <td className="py-3 px-2 text-gray-600 font-[Changa]">{c.estimated_cuisine}</td>
                                    <td className="py-3 px-2">
                                      {place?.rating ? (
                                        <span className="text-yellow-600 font-bold">★ {place.rating}</span>
                                      ) : (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-2">
                                      <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-[Changa] ${
                                          c.is_direct_competitor
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {c.is_direct_competitor
                                          ? isAr ? "مباشر" : "Direct"
                                          : isAr ? "غير مباشر" : "Indirect"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "market" && !ma && (
                <EmptyState
                  icon={BarChart3}
                  message={isAr ? "لا يوجد تحليل سوق لهذه الدراسة" : "No market analysis for this report"}
                />
              )}

              {/* Risks Tab */}
              {activeTab === "risks" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#08312D] font-[Changa]">
                    {isAr ? "المخاطر وخطط التخفيف" : "Risks & Mitigations"}
                  </h3>
                  {report.risks_and_mitigations.map((r, i) => {
                    const sev = r.severity || "";
                    const theme =
                      sev === "عالي" || sev === "high"
                        ? { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700" }
                        : sev === "متوسط" || sev === "medium"
                          ? { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" }
                          : { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700" };
                    return (
                      <div key={i} className={`${theme.bg} ${theme.border} border rounded-xl p-5`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-bold text-[#08312D] text-sm font-[Changa]">{r.risk}</h4>
                          {sev && (
                            <span className={`${theme.badge} px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap font-[Changa]`}>
                              {sev}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-[Changa]">
                          <span className="font-bold">{isAr ? "خطة التخفيف: " : "Mitigation: "}</span>
                          {r.mitigation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Next Steps Tab */}
              {activeTab === "steps" && (
                <div className="space-y-6">
                  {/* Decision reasons */}
                  <div>
                    <h3 className="text-lg font-bold text-[#08312D] mb-3 font-[Changa]">
                      {isAr ? "أسباب القرار" : "Decision Reasons"}
                    </h3>
                    <ul className="space-y-2">
                      {dec.reasons.map((r, i) => (
                        <li key={i} className="flex gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 font-[Changa]">
                          <span className="text-[#C6A75E]">◆</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(dec.invest_conditions?.length || dec.reject_conditions?.length) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dec.invest_conditions && dec.invest_conditions.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                          <h4 className="text-sm font-bold text-green-700 mb-3 font-[Changa]">
                            ✓ {isAr ? "شروط الاستثمار" : "Invest Conditions"}
                          </h4>
                          <ul className="space-y-2">
                            {dec.invest_conditions.map((c, i) => (
                              <li key={i} className="text-sm text-gray-700 font-[Changa]">
                                <span className="text-green-700 font-bold ml-1">✓</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {dec.reject_conditions && dec.reject_conditions.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                          <h4 className="text-sm font-bold text-red-700 mb-3 font-[Changa]">
                            ✗ {isAr ? "شروط الرفض" : "Reject Conditions"}
                          </h4>
                          <ul className="space-y-2">
                            {dec.reject_conditions.map((c, i) => (
                              <li key={i} className="text-sm text-gray-700 font-[Changa]">
                                <span className="text-red-700 font-bold ml-1">✗</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Next Steps */}
                  <div>
                    <h3 className="text-lg font-bold text-[#08312D] mb-3 font-[Changa]">
                      {isAr ? "الخطوات القادمة" : "Next Steps"}
                    </h3>
                    <ol className="space-y-3">
                      {report.next_steps.map((s, i) => (
                        <li key={i} className="flex gap-3 bg-[#FFF9F0] border border-[#C6A75E]/30 rounded-lg p-4 text-sm text-gray-700 font-[Changa]">
                          <span className="w-7 h-7 rounded-full bg-[#08312D] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                          <span className="pt-0.5">{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Business Overview footer */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-bold text-[#08312D] mb-4 flex items-center gap-2 font-[Changa]">
              <Building2 className="w-5 h-5 text-[#C6A75E]" />
              {isAr ? "نظرة عامة على المشروع" : "Business Overview"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-[Changa]">
              <InfoRow label={isAr ? "نوع النشاط" : "Business Type"} value={bo.business_type} />
              {bo.restaurant_type && <InfoRow label={isAr ? "التخصص" : "Specialty"} value={bo.restaurant_type} />}
              <InfoRow label={isAr ? "المدينة" : "City"} value={bo.city} />
              <InfoRow label={isAr ? "العملاء المستهدفون" : "Target Customers"} value={bo.target_customers} />
              <InfoRow label={isAr ? "عرض القيمة" : "Value Proposition"} value={bo.value_proposition} />
              {bo.main_products && bo.main_products.length > 0 && (
                <InfoRow label={isAr ? "المنتجات الرئيسية" : "Main Products"} value={bo.main_products.join(" · ")} />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function KpiCard({ icon: Icon, label, value, color, hint }: any) {
  return (
    <motion.div
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      title={hint || undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1 font-[Changa] flex items-center gap-1">
            {label}
            {hint && (
              <Info className="w-3 h-3 text-gray-400 cursor-help opacity-60 group-hover:opacity-100" />
            )}
          </div>
          <div className="text-xl font-black text-[#08312D] font-[Changa] truncate">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {hint && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#08312D] text-white text-xs rounded-lg px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10 font-[Changa] leading-relaxed shadow-lg">
          {hint}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#08312D]" />
        </div>
      )}
    </motion.div>
  );
}

function RampStat({
  label, revenue, profit, isAr, highlight,
}: {
  label: string; revenue: number; profit: number; isAr: boolean; highlight?: boolean;
}) {
  const positive = profit >= 0;
  return (
    <div className={`rounded-lg p-3 border ${highlight ? "bg-[#08312D] border-[#08312D] text-white" : "bg-white border-gray-200"}`}>
      <div className={`text-xs mb-1 font-[Changa] ${highlight ? "text-white/70" : "text-gray-500"}`}>{label}</div>
      <div className={`text-sm font-bold font-[Changa] ${highlight ? "text-white" : "text-[#08312D]"}`}>
        {revenue.toLocaleString()} {isAr ? "ر.س" : "SAR"}
      </div>
      <div className={`text-xs mt-1 font-[Changa] ${
        highlight ? (positive ? "text-green-300" : "text-red-300") : (positive ? "text-green-700" : "text-red-700")
      }`}>
        {positive ? "+" : ""}{profit.toLocaleString()} {isAr ? "ربح" : "profit"}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="text-xs text-gray-500 mb-1 font-[Changa]">{label}</div>
      <div className="text-lg font-bold text-[#08312D] font-[Changa]">{value}</div>
    </div>
  );
}

function StressItem({ label, value, negative, positive }: { label: string; value: string; negative?: boolean; positive?: boolean }) {
  const color = negative ? "#b91c1c" : positive ? "#15803d" : "#b45309";
  return (
    <div className="text-center">
      <div className="text-lg font-bold font-[Changa]" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-600 mt-1 font-[Changa]">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-2 border-b border-gray-100">
      <div className="text-gray-500 min-w-[120px]">{label}:</div>
      <div className="text-gray-800 font-semibold flex-1">{value}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: any) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-[Changa]">{message}</p>
    </div>
  );
}

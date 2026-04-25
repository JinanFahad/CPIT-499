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
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";

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

  const cls = dec.classification.toLowerCase();
  const decisionTheme =
    cls.includes("suitable") || cls.includes("مناسب")
      ? { bg: "#f0fdf4", border: "#4caf50", text: "#15803d", icon: "✅" }
      : cls.includes("moderate") || cls.includes("متوسط")
        ? { bg: "#fffbeb", border: "#f59e0b", text: "#b45309", icon: "⚠️" }
        : { bg: "#fff5f5", border: "#e53e3e", text: "#b91c1c", icon: "🔴" };

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
                  disabled={downloading}
                  className="bg-[#C6A75E] hover:bg-[#a88f4e] rounded-lg px-5 py-3 text-white font-bold flex items-center gap-2 transition-all disabled:opacity-60 font-[Changa]"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isAr ? "تحميل PDF" : "Download PDF"}
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

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={DollarSign}
              label={isAr ? "إيراد شهري" : "Monthly Revenue"}
              value={`${fs.monthly_revenue.toLocaleString()} ${isAr ? "ر.س" : "SAR"}`}
              color="#22c55e"
            />
            <KpiCard
              icon={TrendingUp}
              label={isAr ? "هامش الربح" : "Profit Margin"}
              value={`${fs.profit_margin_percent}%`}
              color="#C6A75E"
            />
            <KpiCard
              icon={Calendar}
              label={isAr ? "فترة الاسترداد" : "Payback"}
              value={
                fs.payback_period_months
                  ? `${fs.payback_period_months.toFixed(1)} ${isAr ? "شهر" : "mo"}`
                  : "—"
              }
              color="#3b82f6"
            />
            <KpiCard
              icon={Target}
              label={isAr ? "فرصة السوق" : "Market Score"}
              value={ma ? `${ma.market_opportunity_score}/10` : "—"}
              color="#8b5cf6"
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
                  <div>
                    <h3 className="text-lg font-bold text-[#08312D] mb-4 font-[Changa]">
                      {isAr ? "الإيرادات والمصاريف" : "Revenue & Expenses"}
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

function KpiCard({ icon: Icon, label, value, color }: any) {
  return (
    <motion.div
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1 font-[Changa]">{label}</div>
          <div className="text-xl font-black text-[#08312D] font-[Changa] truncate">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
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

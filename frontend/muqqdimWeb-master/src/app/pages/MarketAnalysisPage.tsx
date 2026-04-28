// =====================================================================
// MarketAnalysisPage.tsx — تحليل السوق المستقل (بدون إنشاء مشروع)
// المستخدم يختار: نوع المشروع + موقع على الخريطة + نطاق البحث
// عند الضغط على "تحليل":
//   - يستدعي /analyze (يستدعي قوقل بلايسز + AI)
//   - يعرض: درجة الفرصة، عدد المنافسين، تقييماتهم، نقاط، توصيات، جدول
// =====================================================================

import { useState, useEffect } from "react";
import {
  BarChart3,
  MapPin,
  Search,
  Loader2,
  Sparkles,
  Trophy,
  Target,
  Lightbulb,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { MapPicker } from "../components/MapPicker";
import { businessTypes, cities, cityMap, businessTypeMap } from "./FeasibilityStudyPage";

const BACKEND_URL = "http://localhost:5000";

interface ClassifiedCompetitor {
  id: string;
  estimated_cuisine: string;
  confidence: number;
  is_direct_competitor: boolean;
  reason_short: string;
}

interface SummaryCompetitor {
  id: string;
  name: string;
  rating: number | null;
  userRatingCount: number | null;
  address: string | null;
}

interface AnalysisResult {
  input: { lat: number; lng: number; type: string; label: string; radius: number };
  places_found: number;
  summary: { count: number; avg_rating: number | null; all_competitors: SummaryCompetitor[] };
  ai_analysis: {
    classified_competitors: ClassifiedCompetitor[];
    direct_competitor_summary: {
      count: number;
      avg_rating: number;
      strongest_name: string;
      weakest_gap: string;
    };
    narrative: string;
    bullets: string[];
    recommendations: string[];
    competition_level: string;
    market_opportunity_score: number;
  };
}

const ChevronDown = () => (
  <svg className="w-4 h-4 text-[#C6A75E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const labelClass = "block text-[#08312d] dark:text-gray-900 font-bold text-base mb-2 font-[Changa]";
const selectClass = "w-full bg-gray-50 dark:bg-gray-100 border border-gray-300 dark:border-gray-400 text-[#08312d] dark:text-gray-900 rounded-lg px-4 py-3 text-base font-medium font-[Changa] focus:ring-2 focus:ring-[#C6A75E] focus:border-[#C6A75E] focus:outline-none appearance-none cursor-pointer";
const sectionTitle = "text-[#08312d] dark:text-white font-bold text-lg mb-5 pb-2 border-b border-gray-200 dark:border-white/10 font-[Changa]";

export default function MarketAnalysisPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("1500");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLocationSelect = (newLat: number, newLng: number) => {
    setLat(newLat.toFixed(6));
    setLng(newLng.toFixed(6));
  };

  // الدالة الرئيسية: استدعاء الباك اند لتحليل الموقع
  // تتطلب: نوع المشروع + إحداثيات (lat/lng)
  const handleAnalyze = async () => {
    setError("");
    if (!businessType) {
      setError(isAr ? "اختاري نوع المشروع" : "Select a business type");
      return;
    }
    if (!lat || !lng) {
      setError(isAr ? "حدّدي الموقع على الخريطة" : "Select a location on the map");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const params = new URLSearchParams({
        lat,
        lng,
        type: businessTypeMap[businessType] || "restaurant",
        city: cityMap[city] || city || "غير محدد",
        radius,
      });

      const res = await fetch(`${BACKEND_URL}/analyze?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Analysis failed");
      }
      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || (isAr ? "فشل التحليل — تأكدي أن الباك اند شغّال" : "Analysis failed"));
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionBadgeClasses = (level: string) => {
    if (level === "منخفض") return "bg-green-100 text-green-800 border-green-300";
    if (level === "متوسط") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const renderCompetitorName = (id: string) =>
    result?.summary.all_competitors.find((p) => p.id === id)?.name || id;

  const renderCompetitorRating = (id: string) =>
    result?.summary.all_competitors.find((p) => p.id === id)?.rating ?? null;

  const sortedCompetitors = result
    ? [...result.ai_analysis.classified_competitors].sort(
        (a, b) => Number(b.is_direct_competitor) - Number(a.is_direct_competitor),
      )
    : [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-transparent p-6 lg:p-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Header */}
          <motion.div
            className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#08312d] dark:text-gray-900 font-[Changa]">
                  {isAr ? "تحليل السوق" : "Market Analysis"}
                </h1>
                <p className="text-gray-500 dark:text-gray-600 text-sm font-[Changa] mt-2">
                  {isAr
                    ? "حدّدي موقع ونوع مشروعك لاستكشاف المنافسين وفرص السوق"
                    : "Select a location and business type to explore competitors and market opportunities"}
                </p>
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-[Changa] text-right">
              {error}
            </div>
          )}

          {/* Form */}
          <motion.div
            className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* Section 1 */}
            <div>
              <h2 className={sectionTitle}>{isAr ? "١. معلومات المشروع" : "1. Project Information"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>
                    {isAr ? "نوع المشروع" : "Business Type"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">{isAr ? "اختاري النوع" : "Select type"}</option>
                      {businessTypes.map((b) => (
                        <option key={b.en} value={b.en}>
                          {isAr ? b.ar : b.en}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "المدينة (اختياري)" : "City (Optional)"}</label>
                  <div className="relative">
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{isAr ? "اختاري المدينة" : "Select city"}</option>
                      {cities.map((c) => (
                        <option key={c.en} value={c.en}>
                          {isAr ? c.ar : c.en}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    {isAr ? "نطاق البحث (متر)" : "Search Radius (m)"}
                  </label>
                  <div className="relative">
                    <select
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      className={selectClass}
                    >
                      <option value="500">500</option>
                      <option value="1000">1,000</option>
                      <option value="1500">1,500</option>
                      <option value="2000">2,000</option>
                      <option value="3000">3,000</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Location */}
            <div>
              <h2 className={sectionTitle}>
                {isAr ? "٢. الموقع" : "2. Location"} <span className="text-red-500">*</span>
              </h2>
              <div
                className="relative w-full h-64 rounded-xl overflow-hidden border border-[#C6A75E]/30 bg-gray-100 dark:bg-gray-200 cursor-pointer group"
                onClick={() => setMapOpen(true)}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(rgba(200,220,200,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,220,200,0.3) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                    backgroundColor: "#e8f0e8",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <MapPin className="w-10 h-10 text-red-500 drop-shadow-lg" />
                    <div className="w-3 h-3 bg-red-500/30 rounded-full -mt-1" />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-end justify-center pb-4">
                  <div className="bg-white/90 dark:bg-gray-100/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md group-hover:bg-[#C6A75E]/10 transition-all border border-[#C6A75E]/20">
                    <p className="text-[#08312d] text-sm font-medium font-[Changa] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#C6A75E]" />
                      {isAr ? "اضغطي لتحديد الموقع على الخريطة" : "Click to select location on map"}
                    </p>
                  </div>
                </div>
                {lat && lng && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium font-[Changa] px-3 py-1 rounded-full flex items-center gap-1">
                    <span>✓</span>
                    <span>
                      {isAr ? "تم تحديد الموقع" : "Location selected"}: {Number(lat).toFixed(4)},{" "}
                      {Number(lng).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 bg-[#FFF9F0] dark:bg-[#C6A75E]/10 rounded-lg border border-[#C6A75E] dark:border-[#C6A75E]/40">
              <Sparkles className="w-5 h-5 text-[#C6A75E] flex-shrink-0" />
              <p className="text-gray-700 dark:text-white/80 text-sm font-medium font-[Changa]">
                {isAr
                  ? "سنحلّل المطاعم المجاورة عبر قوقل بلايسز ثم يحدّد الذكاء الاصطناعي المنافسين المباشرين والفرص المتاحة."
                  : "We'll analyze nearby restaurants via Google Places, then AI will identify direct competitors and opportunities."}
              </p>
            </div>

            <div className="pt-6 border-t-2 border-gray-200 dark:border-gray-300">
              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full h-14 bg-[#C6A75E] hover:bg-[#a88f4e] text-white font-bold text-base rounded-lg transition-all font-[Changa]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    {isAr ? "جاري تحليل السوق..." : "Analyzing market..."}
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 ml-2" />
                    {isAr ? "تحليل الموقع" : "Analyze Location"}
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Results */}
          {result && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Score Hero */}
              <div className="bg-gradient-to-br from-[#08312D] to-[#0E4A43] rounded-xl p-8 text-white shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  <div className="text-center md:text-right">
                    <div className="text-6xl font-black text-[#C6A75E] leading-none">
                      {result.ai_analysis.market_opportunity_score}
                      <span className="text-2xl text-white/60">/10</span>
                    </div>
                    <div className="text-sm text-white/80 mt-2 font-[Changa]">
                      {isAr ? "درجة فرصة السوق" : "Market Opportunity Score"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`inline-block px-4 py-2 rounded-full border font-bold text-sm font-[Changa] ${getCompetitionBadgeClasses(result.ai_analysis.competition_level)}`}
                    >
                      {isAr ? "منافسة" : "Competition"}: {result.ai_analysis.competition_level}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-300">
                      {result.ai_analysis.direct_competitor_summary.count}
                    </div>
                    <div className="text-xs text-white/70 mt-1 font-[Changa]">
                      {isAr ? "منافس مباشر" : "Direct Competitors"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-300">
                      {result.ai_analysis.direct_competitor_summary.avg_rating?.toFixed(1) || "—"}
                    </div>
                    <div className="text-xs text-white/70 mt-1 font-[Changa]">
                      {isAr ? "متوسط تقييمهم" : "Avg Rating"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-200 rounded-xl p-6 border border-gray-200 dark:border-gray-300 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFF9F0] border border-[#C6A75E]/30 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-[#C6A75E]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-[Changa] mb-1">
                        {isAr ? "أقوى منافس" : "Strongest Competitor"}
                      </div>
                      <div className="text-[#08312D] dark:text-gray-900 font-bold text-lg">
                        {result.ai_analysis.direct_competitor_summary.strongest_name || "—"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-200 rounded-xl p-6 border border-gray-200 dark:border-gray-300 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFF9F0] border border-[#C6A75E]/30 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-[#C6A75E]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-[Changa] mb-1">
                        {isAr ? "الفرصة المتاحة" : "Opportunity Gap"}
                      </div>
                      <div className="text-[#08312D] dark:text-gray-900 font-medium text-sm leading-relaxed font-[Changa]">
                        {result.ai_analysis.direct_competitor_summary.weakest_gap || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Narrative */}
              <div className="bg-white dark:bg-gray-200 rounded-xl p-6 border border-gray-200 dark:border-gray-300 shadow-sm">
                <h3 className={sectionTitle}>{isAr ? "نظرة على السوق" : "Market Overview"}</h3>
                <p className="text-[#08312D] dark:text-gray-900 leading-relaxed font-[Changa]">
                  {result.ai_analysis.narrative}
                </p>
              </div>

              {/* Bullets + Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-200 rounded-xl p-6 border border-gray-200 dark:border-gray-300 shadow-sm">
                  <h3 className={sectionTitle}>{isAr ? "أبرز النقاط" : "Key Points"}</h3>
                  <ul className="space-y-3">
                    {result.ai_analysis.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#C6A75E]/15 text-[#C6A75E] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          ◆
                        </div>
                        <span className="text-[#08312D] dark:text-gray-900 text-sm leading-relaxed font-[Changa]">
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white dark:bg-gray-200 rounded-xl p-6 border border-gray-200 dark:border-gray-300 shadow-sm">
                  <h3 className={sectionTitle}>
                    <span className="inline-flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[#C6A75E]" />
                      {isAr ? "التوصيات" : "Recommendations"}
                    </span>
                  </h3>
                  <ul className="space-y-3">
                    {result.ai_analysis.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#08312D] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          {i + 1}
                        </div>
                        <span className="text-[#08312D] dark:text-gray-900 text-sm leading-relaxed font-[Changa]">
                          {r}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Competitors table */}
              <div className="bg-white dark:bg-gray-200 rounded-xl p-6 border border-gray-200 dark:border-gray-300 shadow-sm">
                <h3 className={sectionTitle}>
                  {isAr ? `المطاعم المجاورة (${result.places_found})` : `Nearby Restaurants (${result.places_found})`}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-300">
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
                      {sortedCompetitors.map((c) => {
                        const rating = renderCompetitorRating(c.id);
                        return (
                          <tr
                            key={c.id}
                            className={`border-b border-gray-100 dark:border-gray-300 ${
                              c.is_direct_competitor ? "bg-red-50/50" : ""
                            }`}
                          >
                            <td className="py-3 px-2 text-[#08312D] dark:text-gray-900 font-medium font-[Changa] max-w-[200px] truncate">
                              {renderCompetitorName(c.id)}
                            </td>
                            <td className="py-3 px-2 text-gray-600 font-[Changa]">
                              {c.estimated_cuisine}
                            </td>
                            <td className="py-3 px-2">
                              {rating ? (
                                <span className="text-yellow-600 font-bold">★ {rating}</span>
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
                                  ? isAr
                                    ? "مباشر"
                                    : "Direct"
                                  : isAr
                                    ? "غير مباشر"
                                    : "Indirect"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <MapPicker
        open={mapOpen}
        initialLat={lat}
        initialLng={lng}
        onClose={() => setMapOpen(false)}
        onSelect={handleLocationSelect}
      />
    </>
  );
}

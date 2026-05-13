import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

// Lucide icons used on the page header and submit button
import { FileText, Sparkles, CheckCircle, MapPin } from "lucide-react";

// Reusable UI primitives + layout pieces
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Sparkle } from "../components/Sparkle";

// i18n + Firebase auth (for the user ID) + map picker modal
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";
import { MapPicker } from "../components/MapPicker";


// Backend (Python/Flask) API root
const BACKEND_URL = "http://localhost:5000";


// ── Maps that translate UI labels into backend keys ────────────────────
// `businessTypeMap` is exported so EditProjectPage and MarketAnalysisPage
// can reuse the same English-label → backend-key conversion (no duplication).
// Stays 1:1 in sync with BUSINESS_TYPES in business_types.py on the backend.
export const businessTypeMap: Record<string, string> = {
  "Pizza Restaurant":               "pizza_restaurant",
  "Fast Food Restaurant":           "fast_food_restaurant",
  "Cafe":                           "cafe",
  "Seafood Restaurant":             "seafood_restaurant",
  "Breakfast Restaurant":           "breakfast_restaurant",
  "Sandwich Shop":                  "sandwich_shop",
  "Shawarma Restaurant":            "shawarma_restaurant",
  "Traditional / Mandi Restaurant": "traditional_restaurant",
  "General Restaurant":             "restaurant",
};

// Custom chevron icon used in the <select> arrow position.
// We render our own instead of relying on the browser default
// because native arrows look different on each OS/browser.
const ChevronDown = () => (
  <svg className="w-4 h-4 text-[#C6A75E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);


// ── Reusable Tailwind class strings ────────────────────────────────────
// Defined once so every input/label/select on this page looks identical.
const inputClass = "w-full bg-gray-50 dark:bg-[#062620] border-gray-300 dark:border-white/20 text-[#08312d] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 rounded-lg px-4 py-3 text-base font-medium font-[Changa] focus:ring-2 focus:ring-[#C6A75E] focus:border-[#C6A75E]";
const labelClass = "block text-[#08312d] dark:text-white font-bold text-base mb-2 font-[Changa]";
const selectClass = "w-full bg-gray-50 dark:bg-[#062620] border border-gray-300 dark:border-white/20 text-[#08312d] dark:text-white rounded-lg px-4 py-3 text-base font-medium font-[Changa] focus:ring-2 focus:ring-[#C6A75E] focus:border-[#C6A75E] focus:outline-none appearance-none cursor-pointer";
const sectionTitle = "text-[#08312d] dark:text-white font-bold text-lg mb-5 pb-2 border-b border-gray-200 dark:border-[#C6A75E]/30 font-[Changa]";


// ── Business types and cities — exported for reuse ─────────────────────
// Both lists are exported so other pages (EditProjectPage, MarketAnalysisPage)
// can use them without redefining their own copies.
// Stays 1:1 in sync with the backend (business_types.py).
export const businessTypes = [
  { ar: "مطعم بيتزا",        en: "Pizza Restaurant" },
  { ar: "وجبات سريعة",       en: "Fast Food Restaurant" },
  { ar: "كافيه",              en: "Cafe" },
  { ar: "مأكولات بحرية",     en: "Seafood Restaurant" },
  { ar: "فطور",               en: "Breakfast Restaurant" },
  { ar: "ساندويتش",           en: "Sandwich Shop" },
  { ar: "شاورما",             en: "Shawarma Restaurant" },
  { ar: "مطعم شعبي / مندي",  en: "Traditional / Mandi Restaurant" },
  { ar: "مطعم عام",           en: "General Restaurant" },
];

export const cities = [
  { ar: "الرياض", en: "Riyadh" },
  { ar: "جدة", en: "Jeddah" },
  { ar: "مكة المكرمة", en: "Makkah" },
  { ar: "المدينة المنورة", en: "Madinah" },
  { ar: "الدمام", en: "Dammam" },
  { ar: "الخبر", en: "Khobar" },
  { ar: "أبها", en: "Abha" },
  { ar: "تبوك", en: "Tabuk" },
  { ar: "الطائف", en: "Taif" },
];

export const cityMap: Record<string, string> = {
  "Riyadh": "الرياض", "Jeddah": "جدة", "Makkah": "مكة المكرمة",
  "Madinah": "المدينة المنورة", "Dammam": "الدمام", "Khobar": "الخبر",
  "Abha": "أبها", "Tabuk": "تبوك", "Taif": "الطائف"
};

export const businessMap: Record<string, string> = {
  "Pizza Restaurant":               "مطعم بيتزا",
  "Fast Food Restaurant":           "وجبات سريعة",
  "Cafe":                           "كافيه",
  "Seafood Restaurant":             "مأكولات بحرية",
  "Breakfast Restaurant":           "فطور",
  "Sandwich Shop":                  "ساندويتش",
  "Shawarma Restaurant":            "شاورما",
  "Traditional / Mandi Restaurant": "مطعم شعبي / مندي",
  "General Restaurant":             "مطعم عام",
};

export default function FeasibilityStudyPage() {
  // ── Routing + i18n ─────────────────────────────────────────────────
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  // ── UI state ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);              // submission in progress
  const [error, setError] = useState("");                      // validation/network error message
  const [locationLoading, setLocationLoading] = useState(false); // GPS request in progress
  const [mapOpen, setMapOpen] = useState(false);               // is the map picker open?

  // ── Form data — one object that mirrors every field in the form ────
  const [formData, setFormData] = useState({
    projectName: "",
    businessType: "",
    restaurantType: "",
    city: "",
    initialCapital: "",
    monthlyRent: "",
    numEmployees: "",
    avgProductPrice: "",
    expectedCustomersPerDay: "",
    targetCustomers: "",
    mainProducts: "",
    lat: "",
    lng: "",
  });

  // Scroll to the top whenever the page first loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Generic onChange handler — works for any input/select/textarea
  // because we keyed every field by its `name` attribute.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Stop the mouse wheel from changing values inside <input type="number">.
  // Browsers do this by default and it confuses users when they scroll past.
  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).blur();
  };

  // Block negative signs and scientific notation in number fields.
  const preventNegativeKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
  };

  // Callback fired when the user picks a point inside the MapPicker modal.
  // We round to 6 decimals (about 11cm precision) — more than enough.
  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  };

  // Browser geolocation API — asks the OS for the current device location.
  // The user is shown a system permission prompt the first time.
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
    );
  };


  // ── Main submission handler ────────────────────────────────────────
  // Runs two API calls in sequence:
  //   1) /api/feasibility/report-pdf  → AI generates the report (returns PDF + report_id)
  //   2) /api/projects                → save the project linked to the report_id
  // On success, navigate to the projects list page.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Map location is required — fail fast with a clear message
    if (!formData.lat || !formData.lng) {
      setError(isAr ? "يجب تحديد موقع المشروع على الخريطة" : "Please select the project location on the map");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setError("");

    // Convert the textarea (one product per line) into a clean string array
    const mainProductsList = formData.mainProducts
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    try {
      // Build the request body using the backend's expected field names.
      // We translate the human-readable English labels into backend keys.
      const body: any = {
        business_type: businessTypeMap[formData.businessType] || "restaurant",
        restaurant_type: formData.restaurantType,
        city: cityMap[formData.city] || formData.city,
        capital: Number(formData.initialCapital),
        rent: Number(formData.monthlyRent),
        employees: Number(formData.numEmployees),
        avg_price: Number(formData.avgProductPrice),
        customers_per_day: Number(formData.expectedCustomersPerDay),
        target_customers: formData.targetCustomers,
        main_products: mainProductsList,
        // Current site language — backend uses this to pick the
        // correct AI prompt and the matching PDF template (Arabic/English)
        language: language,
      };

      if (formData.lat && formData.lng) {
        body.lat = Number(formData.lat);
        body.lng = Number(formData.lng);
      }

      // ① Ask the backend to generate the PDF report.
      // This call takes 20-40 seconds because it waits for the OpenAI response.
      const response = await fetch(`${BACKEND_URL}/api/feasibility/report-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "حدث خطأ في توليد الدراسة");
      }

      // The backend sets a custom X-Report-Id header alongside the PDF body
      // so we know which report row in the database to link to the project.
      const reportId = response.headers.get("X-Report-Id");

      // Get the Firebase user ID first; fall back to localStorage in case
      // Firebase hasn't hydrated yet on this page load.
      const userId = auth.currentUser?.uid || localStorage.getItem("userId") || "";

      if (!userId) throw new Error("يجب تسجيل الدخول أولاً");

      // ② Save the project in the database, linked to the report we just made.
      const projectResponse = await fetch(`${BACKEND_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          project_name: formData.projectName,
          project_name_en: formData.projectName,
          project_type: businessTypeMap[formData.businessType] || "restaurant",
          restaurant_type: formData.restaurantType,
          city: cityMap[formData.city] || formData.city,
          city_en: formData.city,
          capital: Number(formData.initialCapital),
          rent: Number(formData.monthlyRent),
          employees: Number(formData.numEmployees),
          avg_price: Number(formData.avgProductPrice),
          customers_per_day: Number(formData.expectedCustomersPerDay),
          target_customers: formData.targetCustomers,
          main_products: mainProductsList,
          lat: formData.lat ? Number(formData.lat) : null,
          lng: formData.lng ? Number(formData.lng) : null,
          report_id: reportId ? Number(reportId) : null,
        }),
      });

      if (!projectResponse.ok) throw new Error("حدث خطأ في حفظ المشروع");

      // All done — take the user to their projects list to see the new entry
      navigate("/dashboard/my-projects");

    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع، تأكد من تشغيل الباك اند");
    } finally {
      // Always clear the loading flag (success OR failure) so the button
      // becomes clickable again.
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-transparent p-6 lg:p-8 relative" dir={isAr ? "rtl" : "ltr"}>
        <Sparkle className="top-[5%] left-[5%]" size={18} />
        <Sparkle className="top-[15%] right-[8%]" size={12} />
        <Sparkle className="top-[40%] left-[3%]" size={22} />
        <Sparkle className="top-[60%] right-[5%]" size={14} />
        <Sparkle className="bottom-[20%] left-[7%]" size={16} />
        <Sparkle className="bottom-[10%] right-[15%]" size={20} />
        <div className="max-w-3xl mx-auto space-y-6">

          <motion.div
            className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-8 border border-[#C6A75E]/30 card-glow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#08312d] dark:text-gray-900 font-[Changa]">
                  {isAr ? "إنشاء دراسة جدوى" : "Create Feasibility Study"}
                </h1>
                <p className="text-gray-500 dark:text-gray-600 text-sm font-[Changa] mt-2">
                  {isAr ? "أدخل بيانات مشروعك لإنشاء دراسة جدوى شاملة" : "Enter your project data to generate a full study"}
                </p>
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-[Changa] text-right">
              {error}
            </div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-8 border border-[#C6A75E]/30 card-glow space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <h2 className={sectionTitle}>{isAr ? "١. معلومات المشروع" : "1. Project Information"}</h2>
              <div className="grid grid-cols-1 gap-5 mb-5">
                <div>
                  <label className={labelClass}>{isAr ? "اسم المشروع" : "Project Name"} <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder={isAr ? "مثال: مطعم برجر الذهبي" : "e.g. Golden Burger Restaurant"}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>{isAr ? "نوع المشروع" : "Business Type"} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select name="businessType" value={formData.businessType} onChange={handleChange} required className={selectClass}>
                      <option value="">{isAr ? "اختر نوع المشروع" : "Select business type"}</option>
                      {businessTypes.map((b) => (
                        <option key={b.en} value={b.en}>{isAr ? b.ar : b.en}</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "المدينة" : "City"} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select name="city" value={formData.city} onChange={handleChange} required className={selectClass}>
                      <option value="">{isAr ? "اختر المدينة" : "Select city"}</option>
                      {cities.map((c) => (
                        <option key={c.en} value={c.en}>{isAr ? c.ar : c.en}</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>{isAr ? "٢. تفاصيل المشروع" : "2. Project Details"}</h2>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className={labelClass}>
                    {isAr ? "وصف المشروع (اختياري)" : "Project Description (Optional)"}
                  </label>
                  <textarea
                    name="restaurantType"
                    value={formData.restaurantType}
                    onChange={handleChange}
                    rows={3}
                    placeholder={isAr ? "اكتبي وصفاً مختصراً عن مشروعك، فكرته، ومميزاته" : "Briefly describe your project, its concept, and what makes it unique"}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {isAr ? "العملاء المستهدفون (اختياري)" : "Target Customers (Optional)"}
                  </label>
                  <Input
                    type="text"
                    name="targetCustomers"
                    value={formData.targetCustomers}
                    onChange={handleChange}
                    placeholder={isAr ? "مثال: الشباب والعائلات في المنطقة" : "e.g. youth and families in the area"}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {isAr ? "المنتجات الرئيسية (اختياري)" : "Main Products (Optional)"}
                  </label>
                  <textarea
                    name="mainProducts"
                    value={formData.mainProducts}
                    onChange={handleChange}
                    rows={3}
                    placeholder={isAr ? "اكتبي كل منتج في سطر منفصل\nمثال:\nبرجر لحم\nبرجر دجاج\nبطاطس" : "One product per line\nExample:\nBeef burger\nChicken burger\nFries"}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>{isAr ? "٣. التفاصيل الاستثمارية" : "3. Investment Details"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>{isAr ? "رأس المال الأولي (ر.س)" : "Initial Capital (SAR)"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="initialCapital" value={formData.initialCapital} onChange={handleChange} onWheel={preventWheelChange} onKeyDown={preventNegativeKeys} min={5000} placeholder={isAr ? "مثال: 100000" : "e.g. 100000"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "الإيجار الشهري (ر.س)" : "Monthly Rent (SAR)"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange} onWheel={preventWheelChange} onKeyDown={preventNegativeKeys} min={1000} placeholder={isAr ? "مثال: 8000" : "e.g. 8000"} className={inputClass} required />
                </div>
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>{isAr ? "٤. التشغيل" : "4. Operations"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>{isAr ? "عدد الموظفين" : "No. of Employees"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="numEmployees" value={formData.numEmployees} onChange={handleChange} onWheel={preventWheelChange} onKeyDown={preventNegativeKeys} min={1} placeholder={isAr ? "مثال: 4" : "e.g. 4"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "متوسط سعر المنتج (ر.س)" : "Avg Product Price (SAR)"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="avgProductPrice" value={formData.avgProductPrice} onChange={handleChange} onWheel={preventWheelChange} onKeyDown={preventNegativeKeys} min={5} placeholder={isAr ? "مثال: 30" : "e.g. 30"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "عملاء متوقعون يومياً" : "Expected Customers/Day"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="expectedCustomersPerDay" value={formData.expectedCustomersPerDay} onChange={handleChange} onWheel={preventWheelChange} onKeyDown={preventNegativeKeys} min={1} placeholder={isAr ? "مثال: 70" : "e.g. 70"} className={inputClass} required />
                </div>
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>{isAr ? "٥. الموقع" : "5. Location"} <span className="text-red-500">*</span></h2>
              <div
                className="relative w-full h-64 rounded-xl overflow-hidden border border-[#C6A75E]/30 bg-gray-100 dark:bg-gray-200 cursor-pointer group"
                onClick={() => setMapOpen(true)}
              >
                <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(200,220,200,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,220,200,0.3) 1px, transparent 1px)`, backgroundSize: "40px 40px", backgroundColor: "#e8f0e8" }} />
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
                      {isAr ? "اضغط لتحديد الموقع على الخريطة" : "Click to select location on map"}
                    </p>
                  </div>
                </div>
                {formData.lat && formData.lng && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium font-[Changa] px-3 py-1 rounded-full flex items-center gap-1">
                    <span>✓</span>
                    <span>{isAr ? "تم تحديد الموقع" : "Location selected"}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="mt-3 flex items-center gap-3 px-5 py-3 rounded-lg border border-[#C6A75E]/40 bg-[#C6A75E]/5 text-[#08312d] dark:text-white font-[Changa] font-medium text-sm hover:border-[#C6A75E] hover:bg-[#C6A75E]/10 transition-all"
              >
                <MapPin className="w-5 h-5 text-[#C6A75E]" />
                {locationLoading ? isAr ? "جاري تحديد الموقع..." : "Getting location..." : isAr ? "تحديد موقعي تلقائياً" : "Use my current location"}
              </button>
            </div>

            <div className="flex items-center gap-2 p-4 bg-[#FFF9F0] dark:bg-[#C6A75E]/10 rounded-lg border border-[#C6A75E] dark:border-[#C6A75E]/40">
              <Sparkles className="w-5 h-5 text-[#C6A75E] flex-shrink-0" />
              <p className="text-gray-700 dark:text-white/80 text-sm font-medium font-[Changa]">
                {t("feasibility.autoSaveNote")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200 dark:border-[#C6A75E]/20">
              <Button type="submit" disabled={loading} className="flex-1 h-14 bg-[#C6A75E] hover:bg-[#a88f4e] text-white font-bold text-base rounded-lg transition-all font-[Changa]">
                <CheckCircle className="w-5 h-5 ml-2 flex-shrink-0" />
                {loading ? isAr ? "جاري التوليد..." : "Generating..." : t("feasibility.generateButton")}
              </Button>
              <Link to="/dashboard/my-projects" className="h-14 bg-gray-50 dark:bg-[#08312D]/30 border border-gray-300 dark:border-white/20 rounded-lg px-6 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center justify-center font-semibold font-[Changa] text-sm whitespace-nowrap">
                {t("feasibility.viewProjectsButton")}
              </Link>
            </div>
          </motion.form>
        </div>
      </div>

      <MapPicker
        open={mapOpen}
        initialLat={formData.lat}
        initialLng={formData.lng}
        onClose={() => setMapOpen(false)}
        onSelect={handleLocationSelect}
      />
    </>
  );
}
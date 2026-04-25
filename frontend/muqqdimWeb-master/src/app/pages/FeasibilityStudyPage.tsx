// =====================================================================
// FeasibilityStudyPage.tsx — صفحة إنشاء دراسة جدوى جديدة
// تتكون من ٥ أقسام: معلومات + تفاصيل + استثمار + تشغيل + موقع
// عند الضغط على "توليد":
//   1) ترسل البيانات لـ /api/feasibility/report-pdf لتوليد التقرير
//   2) تستخرج report_id من الهيدر
//   3) ترسل لـ /api/projects لحفظ المشروع مع ربطه بالتقرير
//   4) توجّه المستخدم لصفحة "مشاريعي"
// =====================================================================

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { FileText, Sparkles, CheckCircle, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { auth } from "../firebase";
import { MapPicker } from "../components/MapPicker";

const BACKEND_URL = "http://localhost:5000";

// خريطة تحويل أسماء الواجهة الإنجليزية إلى المفاتيح اللي يفهمها الباك اند
// مثال: "Burger Restaurant" → "fast_food_restaurant"
const businessTypeMap: Record<string, string> = {
  "Burger Restaurant": "fast_food_restaurant",
  "Shawarma Restaurant": "shawarma_restaurant",
  "Seafood Restaurant": "seafood_restaurant",
  "Grill Restaurant": "restaurant",
  "Italian / Pizza Restaurant": "pizza_restaurant",
  "Asian Restaurant": "restaurant",
  "Fast Food Restaurant": "fast_food_restaurant",
  "Specialty Coffee Cafe": "cafe",
  "General Cafe": "cafe",
  "Dessert Cafe": "cafe",
  "Buffet Restaurant": "restaurant",
  "Food Truck": "fast_food_restaurant",
  "Cloud Kitchen": "restaurant",
  "Other": "restaurant",
};

const ChevronDown = () => (
  <svg className="w-4 h-4 text-[#C6A75E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const inputClass = "w-full bg-gray-50 dark:bg-gray-100 border-gray-300 dark:border-gray-400 text-[#08312d] dark:text-gray-900 placeholder:text-gray-400 rounded-lg px-4 py-3 text-base font-medium font-[Changa] focus:ring-2 focus:ring-[#C6A75E] focus:border-[#C6A75E]";
const labelClass = "block text-[#08312d] dark:text-gray-900 font-bold text-base mb-2 font-[Changa]";
const selectClass = "w-full bg-gray-50 dark:bg-gray-100 border border-gray-300 dark:border-gray-400 text-[#08312d] dark:text-gray-900 rounded-lg px-4 py-3 text-base font-medium font-[Changa] focus:ring-2 focus:ring-[#C6A75E] focus:border-[#C6A75E] focus:outline-none appearance-none cursor-pointer";
const sectionTitle = "text-[#08312d] dark:text-white font-bold text-lg mb-5 pb-2 border-b border-gray-200 dark:border-white/10 font-[Changa]";

// قوائم الأنواع والمدن (نصدّرها للاستخدام في صفحات أخرى مثل EditProjectPage)
export const businessTypes = [
  { ar: "مطعم برجر", en: "Burger Restaurant" },
  { ar: "مطعم شاورما", en: "Shawarma Restaurant" },
  { ar: "مطعم مأكولات بحرية", en: "Seafood Restaurant" },
  { ar: "مطعم مشويات", en: "Grill Restaurant" },
  { ar: "مطعم إيطالي / بيتزا", en: "Italian / Pizza Restaurant" },
  { ar: "مطعم آسيوي", en: "Asian Restaurant" },
  { ar: "مطعم وجبات سريعة", en: "Fast Food Restaurant" },
  { ar: "كافيه قهوة مختصة", en: "Specialty Coffee Cafe" },
  { ar: "كافيه عام", en: "General Cafe" },
  { ar: "كافيه حلويات وديزرت", en: "Dessert Cafe" },
  { ar: "بوفيه مفتوح", en: "Buffet Restaurant" },
  { ar: "فود ترك", en: "Food Truck" },
  { ar: "كلاود كيتشن", en: "Cloud Kitchen" },
  { ar: "أخرى", en: "Other" },
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
  "Burger Restaurant": "مطعم برجر", "Shawarma Restaurant": "مطعم شاورما",
  "Seafood Restaurant": "مطعم مأكولات بحرية", "Grill Restaurant": "مطعم مشويات",
  "Italian / Pizza Restaurant": "مطعم إيطالي / بيتزا", "Asian Restaurant": "مطعم آسيوي",
  "Fast Food Restaurant": "مطعم وجبات سريعة", "Specialty Coffee Cafe": "كافيه قهوة مختصة",
  "General Cafe": "كافيه عام", "Dessert Cafe": "كافيه حلويات وديزرت",
  "Buffet Restaurant": "بوفيه مفتوح", "Food Truck": "فود ترك",
  "Cloud Kitchen": "كلاود كيتشن", "Other": "أخرى"
};

export default function FeasibilityStudyPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // يمنع عجلة الماوس من تغيير قيمة حقول الأرقام (سلوك افتراضي مزعج في المتصفحات)
  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).blur();
  };

  // callback لما المستخدم يختار موقع من نافذة الخريطة (MapPicker)
  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  };

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

  // الدالة الأساسية: عند ضغط زر "توليد الدراسة"
  // تنفّذ خطوتين بالتسلسل: توليد التقرير → حفظ المشروع
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // تحويل قائمة المنتجات من نص متعدد الأسطر إلى مصفوفة
    const mainProductsList = formData.mainProducts
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    try {
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
      };

      if (formData.lat && formData.lng) {
        body.lat = Number(formData.lat);
        body.lng = Number(formData.lng);
      }

      // ① طلب توليد PDF (يستغرق ٢٠-٤٠ ثانية بسبب الـ AI)
      const response = await fetch(`${BACKEND_URL}/api/feasibility/report-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "حدث خطأ في توليد الدراسة");
      }

      // الباك اند يرجع رقم التقرير في هيدر مخصص (X-Report-Id) مع الـ PDF
      const reportId = response.headers.get("X-Report-Id");

      // جلب userId من Firebase أولاً، ثم localStorage كاحتياط
      const userId = auth.currentUser?.uid || localStorage.getItem("userId") || "";

      if (!userId) throw new Error("يجب تسجيل الدخول أولاً");

      // ② حفظ المشروع في قاعدة البيانات وربطه بالتقرير
      const projectResponse = await fetch(`${BACKEND_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          project_name: businessMap[formData.businessType] || formData.businessType,
          project_name_en: formData.businessType,
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

      navigate("/dashboard/my-projects");

    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع، تأكد من تشغيل الباك اند");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-transparent p-6 lg:p-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto space-y-6">

          <motion.div
            className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm"
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
            className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <h2 className={sectionTitle}>{isAr ? "١. معلومات المشروع" : "1. Project Information"}</h2>
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
                    {isAr ? "نوع / تخصص المطعم (اختياري)" : "Restaurant Specialty (Optional)"}
                  </label>
                  <Input
                    type="text"
                    name="restaurantType"
                    value={formData.restaurantType}
                    onChange={handleChange}
                    placeholder={isAr ? "مثال: مطعم برجر فاخر، كافيه قهوة مختصة..." : "e.g. gourmet burger, specialty coffee..."}
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
                  <Input type="number" name="initialCapital" value={formData.initialCapital} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 100000" : "e.g. 100000"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "الإيجار الشهري (ر.س)" : "Monthly Rent (SAR)"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 8000" : "e.g. 8000"} className={inputClass} required />
                </div>
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>{isAr ? "٤. التشغيل" : "4. Operations"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>{isAr ? "عدد الموظفين" : "No. of Employees"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="numEmployees" value={formData.numEmployees} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 4" : "e.g. 4"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "متوسط سعر المنتج (ر.س)" : "Avg Product Price (SAR)"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="avgProductPrice" value={formData.avgProductPrice} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 30" : "e.g. 30"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "عملاء متوقعون يومياً" : "Expected Customers/Day"} <span className="text-red-500">*</span></label>
                  <Input type="number" name="expectedCustomersPerDay" value={formData.expectedCustomersPerDay} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 70" : "e.g. 70"} className={inputClass} required />
                </div>
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>{isAr ? "٥. الموقع (اختياري)" : "5. Location (Optional)"}</h2>
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

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200 dark:border-gray-300">
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
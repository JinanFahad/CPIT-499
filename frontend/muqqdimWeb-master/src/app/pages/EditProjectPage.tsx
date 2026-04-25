// =====================================================================
// EditProjectPage.tsx — تعديل مشروع موجود + إعادة توليد الدراسة
// عند الحفظ: تعيد التوليد بالكامل (تستدعي /api/feasibility/report-pdf)
// ثم تحدّث المشروع برقم التقرير الجديد
// =====================================================================

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { FileText, Save, MapPin, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { businessTypes, cities, cityMap, businessMap } from "./FeasibilityStudyPage";
import { MapPicker } from "../components/MapPicker";
 
const BACKEND_URL = "http://localhost:5000";
 
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
 
const inputClass = "w-full bg-gray-50 dark:bg-gray-100 border border-gray-300 dark:border-gray-400 text-[#08312d] dark:text-gray-900 placeholder:text-gray-400 rounded-lg px-4 py-3 text-base font-medium font-[Changa] focus:ring-2 focus:ring-[#C6A75E] focus:border-[#C6A75E] focus:outline-none";
const selectClass = "w-full bg-gray-50 dark:bg-gray-100 border border-gray-300 dark:border-gray-400 text-[#08312d] dark:text-gray-900 rounded-lg px-4 py-3 text-base font-medium font-[Changa] focus:ring-2 focus:ring-[#C6A75E] focus:border-[#C6A75E] focus:outline-none appearance-none cursor-pointer";
 
export default function EditProjectPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
 
  const labelClass = "block text-[#08312d] dark:text-gray-900 font-bold text-base mb-2 font-[Changa]";
  const sectionTitle = "text-[#08312d] dark:text-white font-bold text-lg mb-5 pb-2 border-b border-gray-200 dark:border-white/10 font-[Changa]";
 
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
 
  // عند فتح الصفحة: نجيب بيانات المشروع من الباك اند ونعبّي الفورم
  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${BACKEND_URL}/api/projects/${projectId}`)
      .then(res => res.json())
      .then(project => {
        if (project.id) {
          const mainProductsArr = Array.isArray(project.main_products) ? project.main_products : [];
          setFormData({
            businessType: project.project_name_en || "",
            restaurantType: project.restaurant_type || "",
            city: project.city_en || "",
            initialCapital: String(project.capital || ""),
            monthlyRent: String(project.rent || ""),
            numEmployees: String(project.employees || ""),
            avgProductPrice: String(project.avg_price || ""),
            expectedCustomersPerDay: String(project.customers_per_day || ""),
            targetCustomers: project.target_customers || "",
            mainProducts: mainProductsArr.join("\n"),
            lat: project.lat ? String(project.lat) : "",
            lng: project.lng ? String(project.lng) : "",
          });
        } else {
          navigate("/dashboard/my-projects");
        }
      })
      .catch(() => navigate("/dashboard/my-projects"));
  }, [projectId, navigate]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  };
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).blur();
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
 
    const mainProductsList = formData.mainProducts
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    try {
      // ① إعادة توليد دراسة الجدوى
      const pdfBody: any = {
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
        pdfBody.lat = Number(formData.lat);
        pdfBody.lng = Number(formData.lng);
      }
 
      const pdfResponse = await fetch(`${BACKEND_URL}/api/feasibility/report-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfBody),
      });
 
      if (!pdfResponse.ok) {
        const errData = await pdfResponse.json();
        throw new Error(errData.error || "حدث خطأ في إعادة التوليد");
      }
 
      const newReportId = pdfResponse.headers.get("X-Report-Id");
 
      // ② تحديث بيانات المشروع في قاعدة البيانات
      const projectResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          report_id: newReportId ? Number(newReportId) : null,
        }),
      });
 
      if (!projectResponse.ok) {
        throw new Error("حدث خطأ في تحديث المشروع");
      }
 
      navigate("/dashboard/my-projects");
 
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <>
      <Header />
      <div className="min-h-screen bg-transparent p-6 lg:p-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto space-y-6">
 
          <motion.div className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#08312d] dark:text-gray-900 font-[Changa]">
                  {isAr ? "تعديل المشروع" : "Edit Project"}
                </h1>
                <p className="text-gray-500 dark:text-gray-600 text-sm font-[Changa] mt-1">
                  {isAr ? "عدّل بيانات مشروعك وسيتم إعادة توليد الدراسة تلقائياً" : "Edit your project data and the study will be regenerated"}
                </p>
              </div>
            </div>
          </motion.div>
 
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-[Changa] text-right">
              {error}
            </div>
          )}
 
          <motion.form onSubmit={handleSubmit} className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm space-y-8" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
 
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
                  <input
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
                  <input
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
                    placeholder={isAr ? "اكتبي كل منتج في سطر منفصل" : "One product per line"}
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
                  <input type="number" name="initialCapital" value={formData.initialCapital} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 100000" : "e.g. 100000"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "الإيجار الشهري (ر.س)" : "Monthly Rent (SAR)"} <span className="text-red-500">*</span></label>
                  <input type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 8000" : "e.g. 8000"} className={inputClass} required />
                </div>
              </div>
            </div>
 
            <div>
              <h2 className={sectionTitle}>{isAr ? "٤. التشغيل" : "4. Operations"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>{isAr ? "عدد الموظفين" : "No. of Employees"} <span className="text-red-500">*</span></label>
                  <input type="number" name="numEmployees" value={formData.numEmployees} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 4" : "e.g. 4"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "متوسط سعر المنتج (ر.س)" : "Avg Product Price (SAR)"} <span className="text-red-500">*</span></label>
                  <input type="number" name="avgProductPrice" value={formData.avgProductPrice} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 30" : "e.g. 30"} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? "عملاء متوقعون يومياً" : "Expected Customers/Day"} <span className="text-red-500">*</span></label>
                  <input type="number" name="expectedCustomersPerDay" value={formData.expectedCustomersPerDay} onChange={handleChange} onWheel={preventWheelChange} placeholder={isAr ? "مثال: 70" : "e.g. 70"} className={inputClass} required />
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
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-[#C6A75E]/20">
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
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setFormData((prev) => ({
                      ...prev,
                      lat: pos.coords.latitude.toFixed(6),
                      lng: pos.coords.longitude.toFixed(6),
                    }));
                  });
                }}
                className="mt-3 flex items-center gap-3 px-5 py-3 rounded-lg border border-[#C6A75E]/40 bg-[#C6A75E]/5 text-[#08312d] font-[Changa] font-medium text-sm hover:border-[#C6A75E] hover:bg-[#C6A75E]/10 transition-all"
              >
                <MapPin className="w-5 h-5 text-[#C6A75E]" />
                {isAr ? "تحديد موقعي تلقائياً" : "Use my current location"}
              </button>
            </div>
 
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200 dark:border-gray-300">
              <Button type="submit" disabled={loading} className="flex-1 h-14 bg-[#C6A75E] hover:bg-[#a88f4e] text-white font-bold text-base rounded-lg transition-all font-[Changa]">
                {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Save className="w-5 h-5 ml-2" />}
                {loading ? isAr ? "جاري إعادة التوليد..." : "Regenerating..." : isAr ? "حفظ وإعادة التوليد" : "Save & Regenerate"}
              </Button>
              <Link to="/dashboard/my-projects" className="h-14 bg-gray-50 dark:bg-gray-100 border border-gray-300 rounded-lg px-6 text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center font-semibold font-[Changa] text-sm">
                {isAr ? "إلغاء" : "Cancel"}
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
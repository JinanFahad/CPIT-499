// =====================================================================
// reportTranslate.ts — مترجم قيم التقرير الثابتة للعرض في الموقع.
//
// الفكرة: التقارير تُحفظ في الـ DB بنفس لغة التوليد. لما المستخدم يبدّل
// لغة الواجهة، الـ UI labels تتغير لكن المحتوى المحفوظ يبقى عربي/إنجليزي.
//
// هذا الملف يعالج المشكلة لـ "القيم المنظّمة" (تصنيفات، تقييمات، severity،
// أسماء العوامل) باستخدام قواميس ثنائية. النصوص الحرّة (verdict, narrative,
// recommendations …) المولّدة من الـ AI تبقى بلغة التوليد الأصلية لأن
// ترجمتها تتطلب استدعاء AI آخر.
// =====================================================================

type Lang = "ar" | "en";

// قاموس موحّد: المفتاح بأي لغة، والقيمة الثانية للترجمة المعاكسة.
// الترتيب: [arabic, english]
const PAIRS: Array<[string, string]> = [
  // ── تصنيفات النتيجة النهائية (success_predictor outcomes) ──
  ["نجاح مرتفع",            "High Success"],
  ["نجاح محتمل",            "Probable Success"],
  ["مخاطرة متوسطة",         "Moderate Risk"],
  ["مخاطرة عالية",          "High Risk"],
  ["احتمال فشل عالي",       "High Failure Probability"],
  // ── تصنيفات decision_engine القديمة ──
  ["مناسب للاستثمار",        "Suitable for Investment"],
  ["قابل للتطبيق بشروط",     "Viable with Conditions"],

  // ── أسماء العوامل (factors) ──
  ["هامش الربح المستقر",            "Stable Profit Margin"],
  ["العائد على الاستثمار (3 سنوات)", "Return on Investment (3 Years)"],
  ["فترة الاسترداد",                 "Payback Period"],
  ["كفاية الاحتياطي التشغيلي",       "Operating Cushion Adequacy"],
  ["فرصة السوق",                     "Market Opportunity"],

  // ── التقييمات (ratings) ──
  ["ممتاز",                              "Excellent"],
  ["جيد جداً",                            "Very Good"],
  ["جيد (المعدل الطبيعي للقطاع)",         "Good (Sector Average)"],
  ["جيد (ضمن المتوقع للقطاع)",            "Good (Within Sector Expectations)"],
  ["جيد",                                 "Good"],
  ["مقبول",                               "Acceptable"],
  ["ضعيف لكن موجب",                       "Weak but Positive"],
  ["حدّي (قرب الصفر)",                    "Marginal (Near Zero)"],
  ["سلبي",                                "Negative"],
  ["ضعيف",                                "Weak"],
  ["بالكاد موجب",                         "Barely Positive"],
  ["خسارة صافية",                         "Net Loss"],
  ["ممتاز (استرداد + ضعف خلال 3 سنوات)",  "Excellent (Payback + Double in 3 Years)"],
  ["طويل لكن ممكن",                       "Long but Feasible"],
  ["طويل جداً",                           "Very Long"],
  ["غير عملي",                            "Impractical"],
  ["لا يحدث (الربح غير موجب)",            "Does Not Occur (Non-Positive Profit)"],
  ["ممتاز (السنة 1 رابحة)",               "Excellent (Year 1 Profitable)"],
  ["ممتاز (يغطي الخسائر بأمان)",          "Excellent (Safely Covers Losses)"],
  ["كافٍ بحدّ أدنى",                       "Minimally Sufficient"],
  ["غير كافٍ — خطر تعثّر",                "Insufficient — Risk of Default"],
  ["غير كافٍ على الإطلاق",                "Severely Insufficient"],
  ["غير محسوب",                           "Not Calculated"],
  ["متوسط",                               "Moderate"],
  ["ضعيف (سوق مشبع/ضعيف الطلب)",          "Weak (Saturated / Low Demand)"],
  ["غير محدّد (افتراضي)",                  "Undefined (Default)"],

  // ── قيم خاصة ──
  ["غير مطلوب",          "Not Required"],

  // ── أنواع النشاط (business_overview.business_type) ──
  ["مطعم بيتزا",        "Pizza Restaurant"],
  ["وجبات سريعة",       "Fast Food"],
  ["كافيه",              "Cafe"],
  ["مأكولات بحرية",     "Seafood Restaurant"],
  ["فطور",               "Breakfast Restaurant"],
  ["ساندويتش",           "Sandwich Shop"],
  ["شاورما",             "Shawarma Restaurant"],
  ["مطعم شعبي / مندي",  "Traditional Restaurant"],
  ["مطعم عام",           "General Restaurant"],

  // ── رسائل توصية النتيجة (success_prediction.message) ──
  // الـ5 رسائل المعروفة من success_predictor — مفيدة عشان نترجم فورياً
  // بدون استدعاء AI للتقارير المحفوظة.
  [
    "كل المؤشرات تدعم نجاح المشروع. تنفيذ منضبط للخطة المالية والتشغيلية متوقع أن يحقق العائد المستهدف خلال الإطار الزمني المتوقّع.",
    "All indicators support project success. Disciplined execution of the financial and operational plan is expected to deliver the targeted return within the projected timeframe.",
  ],
  [
    "المشروع واعد، لكن يحتاج متابعة دقيقة لمؤشرات الأداء (KPI) شهرياً، والاستعداد لتعديل الخطة عند الانحراف عن المستهدف.",
    "The project is promising but requires close monthly monitoring of KPIs and readiness to adjust the plan when actual results diverge from targets.",
  ],
  [
    "المشروع قابل للتطبيق لكنه يحتاج تحسينات جوهرية قبل البدء — مثل إعادة هيكلة التكاليف، رفع الأسعار، أو تقليل عدد الموظفين.",
    "The project is viable but requires substantial improvements before launch — such as restructuring costs, raising prices, or reducing headcount.",
  ],
  [
    "المؤشرات الحالية ضعيفة. يُنصح بمراجعة جوهرية للنموذج الاقتصادي (تكاليف، تسعير، حجم فريق) قبل الالتزام بأي استثمار.",
    "Current indicators are weak. A substantial review of the economic model (costs, pricing, team size) is advised before committing to any investment.",
  ],
  [
    "المشروع كما هو مصمم لن يحقق ربحية مستدامة. التوصية: لا تستثمر دون إعادة هيكلة كاملة لمعطيات المشروع.",
    "The project as designed will not achieve sustainable profitability. Recommendation: do not invest without a full restructuring of the project's economics.",
  ],

  // ── مستوى المنافسة (market_analysis.competition_level) ──
  ["منخفض",             "Low"],
  ["مرتفع",             "High"],

  // ── خطورة المخاطر (risks_and_mitigations[].severity) ──
  ["عالي",              "High"],
  ["منخفض",             "Low"],
  // ملاحظة: "متوسط" مكرر أعلاه لكن JavaScript ييسر التعامل لأنه نفس الترجمة "Moderate"
  // والـ severity العربي "متوسط" ينطبق عليه "Medium" بدل "Moderate" — نعالجه أدناه.
];

// قاموسان متجانسان: العربي → الإنجليزي، والعكس.
const AR_TO_EN: Record<string, string> = {};
const EN_TO_AR: Record<string, string> = {};
for (const [ar, en] of PAIRS) {
  AR_TO_EN[ar] = en;
  EN_TO_AR[en] = ar;
}
// تعديل خاص: severity "Medium" بالإنجليزي يقابل "متوسط" بالعربي.
EN_TO_AR["Medium"] = "متوسط";

/** يكتشف لغة نص: عربي إذا فيه أي حرف عربي، وإلا إنجليزي. */
export function detectLang(text: unknown): Lang {
  if (typeof text !== "string" || !text) return "en";
  return /[؀-ۿ]/.test(text) ? "ar" : "en";
}

/**
 * يترجم قيمة معروفة (تصنيف، تقييم، severity …) إلى اللغة المطلوبة.
 * إذا القيمة غير معروفة في القاموس → نرجّعها كما هي (نص حر من الـ AI).
 *
 * استخدمه على الحقول الـ "قصيرة المنظّمة" فقط، لا تستخدمه على
 * الفقرات الحرّة (narrative, verdict, recommendations).
 */
export function tr(value: unknown, target: Lang): string {
  if (typeof value !== "string" || !value) return value as string;
  const sourceLang = detectLang(value);
  if (sourceLang === target) return value;
  const dict = sourceLang === "ar" ? AR_TO_EN : EN_TO_AR;
  return dict[value] ?? value;
}

/**
 * يترجم سطر "reason" من decision.reasons.
 * الصيغة المعروفة: "<اسم العامل>: <تقييم> (<قيمة>) — X/Y"
 * مثال: "هامش الربح المستقر: ممتاز (28.14%) — 25/25"
 *      "Stable Profit Margin: Excellent (28.14%) — 25/25"
 * نترجم الـ name والـ rating فقط؛ الأرقام والنسب تبقى كما هي.
 */
export function trReason(reason: string, target: Lang): string {
  if (typeof reason !== "string" || !reason) return reason;
  if (detectLang(reason) === target) return reason;

  // نفصل قبل ":" و"("
  const colonIdx = reason.indexOf(":");
  if (colonIdx < 0) return reason;
  const name = reason.slice(0, colonIdx).trim();
  const rest = reason.slice(colonIdx + 1).trim();

  // قسم الـ rating قبل "("
  const parenIdx = rest.indexOf("(");
  const rating = (parenIdx < 0 ? rest : rest.slice(0, parenIdx)).trim();
  const tail   = parenIdx < 0 ? ""  : rest.slice(parenIdx);

  const trName   = tr(name, target);
  const trRating = tr(rating, target);
  return `${trName}: ${trRating}${tail ? " " + tail : ""}`;
}

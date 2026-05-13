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

  // ── المدن السعودية (business_overview.city) ──
  ["الرياض",             "Riyadh"],
  ["جدة",                "Jeddah"],
  ["مكة المكرمة",        "Makkah"],
  ["المدينة المنورة",    "Madinah"],
  ["الدمام",             "Dammam"],
  ["الخبر",              "Khobar"],
  ["أبها",               "Abha"],
  ["تبوك",               "Tabuk"],
  ["الطائف",             "Taif"],
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
 *
 * ملاحظة: التقييم نفسه قد يحتوي على أقواس، مثل:
 *   "فترة الاسترداد: لا يحدث (الربح غير موجب) (—) — 0/20"
 *   "فرصة السوق: غير محدّد (افتراضي) (—) — 5/10"
 * لذلك نمسح الأقواس من اليمين لليسار للعثور على آخر مجموعة أقواس متطابقة
 * (وهي قوس الـ value)، وكل ما قبلها هو التقييم — حتى لو فيه أقواس داخلية.
 */
export function trReason(reason: string, target: Lang): string {
  if (typeof reason !== "string" || !reason) return reason;
  if (detectLang(reason) === target) return reason;

  // نفصل عند أول ":" — اسم العامل قد يحتوي أقواس (مثل "Return on Investment (3 Years)")
  // لكن لا يحتوي ":" داخله.
  const colonIdx = reason.indexOf(":");
  if (colonIdx < 0) return reason;
  const name = reason.slice(0, colonIdx).trim();
  const rest = reason.slice(colonIdx + 1).trim();

  // نبحث عن آخر مجموعة أقواس متطابقة من اليمين — هي قوس الـ value.
  // كل ما قبلها هو التقييم (قد يحتوي أقواسه الداخلية).
  // الصيغة بعد الفاصلة: "<rating[(...)]> (<value>) — X/Y"
  // نقسم أولاً عند آخر " — " للحصول على score/weight ثم نحلّل اليسار.
  const sepIdx = rest.lastIndexOf(" — ");
  let left = rest;
  let scoreTail = "";
  if (sepIdx >= 0) {
    left = rest.slice(0, sepIdx).trim();
    scoreTail = rest.slice(sepIdx); // يشمل " — "
  }

  // الآن left = "<rating> (<value>)" — نبحث عن قوس الـ value الفاتح من اليمين
  let depth = 0;
  let valueOpenIdx = -1;
  for (let i = left.length - 1; i >= 0; i--) {
    const ch = left[i];
    if (ch === ")") depth++;
    else if (ch === "(") {
      depth--;
      if (depth === 0) {
        valueOpenIdx = i;
        break;
      }
    }
  }

  let rating: string;
  let valueGroup = "";
  if (valueOpenIdx >= 0) {
    rating = left.slice(0, valueOpenIdx).trim();
    valueGroup = left.slice(valueOpenIdx); // يشمل "(...)"
  } else {
    rating = left;
  }

  const trName       = tr(name, target);
  const trRating     = tr(rating, target);
  const trValueGroup = valueGroup ? translateValueGroup(valueGroup, target) : "";
  const valueSep     = trValueGroup ? " " : "";
  return `${trName}: ${trRating}${valueSep}${trValueGroup}${scoreTail}`;
}

/**
 * يترجم قيمة عامل داخل قوسي الـ value — قد تكون نص ديناميكي مثل
 * "احتياطي 1,800 مقابل خسارة 164,844" أو "18 شهر".
 * نستبدل الكلمات السياقية المعروفة فقط، الأرقام تبقى كما هي.
 */
const VALUE_WORD_PAIRS: Array<[string, string]> = [
  // الأطول قبل الأقصر لتفادي الاستبدال الجزئي
  ["غير مطلوب",  "Not Required"],
  ["غير محسوب",  "Not Calculated"],
  ["احتياطي",    "Cushion"],
  ["مقابل",      "vs"],
  ["خسارة",      "Loss"],
  ["شهر",        "months"],
];

function translateValueGroup(text: string, target: Lang): string {
  if (!text) return text;
  // محاولة الترجمة الكاملة من القاموس (الحالات المعروفة مثل "—" أو "غير مطلوب")
  const inner = text.startsWith("(") && text.endsWith(")") ? text.slice(1, -1) : text;
  const fromDict = tr(inner, target);
  if (fromDict !== inner) {
    return text.startsWith("(") ? `(${fromDict})` : fromDict;
  }
  // وإلا استبدال كلمات (طريقة الـ _translate_value_string في الباك)
  let out = text;
  for (const [ar, en] of VALUE_WORD_PAIRS) {
    if (target === "en") out = out.split(ar).join(en);
    else out = out.split(en).join(ar);
  }
  return out;
}

/**
 * يستبدل أسماء المدن العربية المضمّنة داخل نصوص حرّة بالإنجليزي والعكس.
 * مفيد لو الـ AI ترجم الفقرة لكن خلّى اسم المدينة بلغة المصدر
 * (مثلاً: "Customers seeking a unique experience in جدة").
 */
const CITY_PAIRS: Array<[string, string]> = [
  ["الرياض", "Riyadh"],
  ["جدة", "Jeddah"],
  ["مكة المكرمة", "Makkah"],
  ["المدينة المنورة", "Madinah"],
  ["الدمام", "Dammam"],
  ["الخبر", "Khobar"],
  ["أبها", "Abha"],
  ["تبوك", "Tabuk"],
  ["الطائف", "Taif"],
];

export function trEmbeddedCities(text: unknown, target: Lang): string {
  if (typeof text !== "string" || !text) return text as string;
  let out = text;
  for (const [ar, en] of CITY_PAIRS) {
    if (target === "en") out = out.split(ar).join(en);
    else out = out.split(en).join(ar);
  }
  return out;
}

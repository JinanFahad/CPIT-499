

type Lang = "ar" | "en";


const PAIRS: Array<[string, string]> = [
  ["نجاح مرتفع",            "High Success"],
  ["نجاح محتمل",            "Probable Success"],
  ["مخاطرة متوسطة",         "Moderate Risk"],
  ["مخاطرة عالية",          "High Risk"],
  ["احتمال فشل عالي",       "High Failure Probability"],
  ["مناسب للاستثمار",        "Suitable for Investment"],
  ["قابل للتطبيق بشروط",     "Viable with Conditions"],

  ["هامش الربح المستقر",            "Stable Profit Margin"],
  ["العائد على الاستثمار (3 سنوات)", "Return on Investment (3 Years)"],
  ["فترة الاسترداد",                 "Payback Period"],
  ["كفاية الاحتياطي التشغيلي",       "Operating Cushion Adequacy"],
  ["فرصة السوق",                     "Market Opportunity"],

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

  ["غير مطلوب",          "Not Required"],

  ["مطعم بيتزا",        "Pizza Restaurant"],
  ["وجبات سريعة",       "Fast Food"],
  ["كافيه",              "Cafe"],
  ["مأكولات بحرية",     "Seafood Restaurant"],
  ["فطور",               "Breakfast Restaurant"],
  ["ساندويتش",           "Sandwich Shop"],
  ["شاورما",             "Shawarma Restaurant"],
  ["مطعم شعبي / مندي",  "Traditional Restaurant"],
  ["مطعم عام",           "General Restaurant"],


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

  ["منخفض",             "Low"],
  ["مرتفع",             "High"],

  ["عالي",              "High"],
  ["منخفض",             "Low"],

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


const AR_TO_EN: Record<string, string> = {};
const EN_TO_AR: Record<string, string> = {};
for (const [ar, en] of PAIRS) {
  AR_TO_EN[ar] = en;
  EN_TO_AR[en] = ar;
}

EN_TO_AR["Medium"] = "متوسط";



export function detectLang(text: unknown): Lang {
  if (typeof text !== "string" || !text) return "en";
  return /[؀-ۿ]/.test(text) ? "ar" : "en";
}



export function tr(value: unknown, target: Lang): string {
  if (typeof value !== "string" || !value) return value as string;
  const sourceLang = detectLang(value);
  if (sourceLang === target) return value;
  const dict = sourceLang === "ar" ? AR_TO_EN : EN_TO_AR;
  return dict[value] ?? value;
}


export function trReason(reason: string, target: Lang): string {
  if (typeof reason !== "string" || !reason) return reason;
  if (detectLang(reason) === target) return reason;


  const colonIdx = reason.indexOf(":");
  if (colonIdx < 0) return reason;
  const name = reason.slice(0, colonIdx).trim();
  const rest = reason.slice(colonIdx + 1).trim();


  const sepIdx = rest.lastIndexOf(" — ");
  let left = rest;
  let scoreTail = "";
  if (sepIdx >= 0) {
    left = rest.slice(0, sepIdx).trim();
    scoreTail = rest.slice(sepIdx); 
  }


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
    valueGroup = left.slice(valueOpenIdx); 
  } else {
    rating = left;
  }

  const trName       = tr(name, target);
  const trRating     = tr(rating, target);
  const trValueGroup = valueGroup ? translateValueGroup(valueGroup, target) : "";
  const valueSep     = trValueGroup ? " " : "";
  return `${trName}: ${trRating}${valueSep}${trValueGroup}${scoreTail}`;
}


const VALUE_WORD_PAIRS: Array<[string, string]> = [
  ["غير مطلوب",  "Not Required"],
  ["غير محسوب",  "Not Calculated"],
  ["احتياطي",    "Cushion"],
  ["مقابل",      "vs"],
  ["خسارة",      "Loss"],
  ["شهر",        "months"],
];

function translateValueGroup(text: string, target: Lang): string {
  if (!text) return text;

  const inner = text.startsWith("(") && text.endsWith(")") ? text.slice(1, -1) : text;
  const fromDict = tr(inner, target);
  if (fromDict !== inner) {
    return text.startsWith("(") ? `(${fromDict})` : fromDict;
  }

  let out = text;
  for (const [ar, en] of VALUE_WORD_PAIRS) {
    if (target === "en") out = out.split(ar).join(en);
    else out = out.split(en).join(ar);
  }
  return out;
}


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

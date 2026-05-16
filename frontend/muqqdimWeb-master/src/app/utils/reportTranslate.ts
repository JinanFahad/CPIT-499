// =====================================================================
// reportTranslate.ts — Translates structured report values for display
// =====================================================================
// Background: feasibility reports are saved in the database in the
// language they were generated in. When the user toggles the UI language,
// the labels in the frontend update — but the saved report text stays
// Arabic or English.
//
// This file solves the problem for the "structured values" inside a
// report (classifications, ratings, severity levels, factor names) by
// using bidirectional dictionaries. Free-form text (the AI-generated
// verdict, narrative, recommendations …) cannot be translated this way —
// translating those requires calling the AI again, which the backend
// handles via a separate endpoint.
//
// Three exported helpers:
//   - tr(text, lang)             → translate a known phrase to `lang`
//   - trReason(text, lang)       → like tr(), but for risk-reason strings
//   - trEmbeddedCities(s, lang)  → translate city names inside a sentence
// =====================================================================

type Lang = "ar" | "en";

// ── Bidirectional dictionary of known phrases ─────────────────────────
// Each entry is a tuple: [Arabic, English]. Whichever side matches the
// input is used to look up the other side, so callers don't need to
// know which direction they're translating.
const PAIRS: Array<[string, string]> = [
  // Final-outcome labels from success_predictor.
  ["نجاح مرتفع",            "High Success"],
  ["نجاح محتمل",            "Probable Success"],
  ["مخاطرة متوسطة",         "Moderate Risk"],
  ["مخاطرة عالية",          "High Risk"],
  ["احتمال فشل عالي",       "High Failure Probability"],
  // Legacy decision_engine labels (still seen on older reports).
  ["مناسب للاستثمار",        "Suitable for Investment"],
  ["قابل للتطبيق بشروط",     "Viable with Conditions"],

  // Factor names used in the per-factor breakdown.
  ["هامش الربح المستقر",            "Stable Profit Margin"],
  ["العائد على الاستثمار (3 سنوات)", "Return on Investment (3 Years)"],
  ["فترة الاسترداد",                 "Payback Period"],
  ["كفاية الاحتياطي التشغيلي",       "Operating Cushion Adequacy"],
  ["فرصة السوق",                     "Market Opportunity"],

  // Per-factor ratings.
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

  // Special values.
  ["غير مطلوب",          "Not Required"],

  // Business types (business_overview.business_type).
  ["مطعم بيتزا",        "Pizza Restaurant"],
  ["وجبات سريعة",       "Fast Food"],
  ["كافيه",              "Cafe"],
  ["مأكولات بحرية",     "Seafood Restaurant"],
  ["فطور",               "Breakfast Restaurant"],
  ["ساندويتش",           "Sandwich Shop"],
  ["شاورما",             "Shawarma Restaurant"],
  ["مطعم شعبي / مندي",  "Traditional Restaurant"],
  ["مطعم عام",           "General Restaurant"],

  // The five fixed advisory messages emitted by success_predictor. Listing
  // them here lets the frontend translate them instantly without going
  // through the AI translator on every page load.
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

  // Competition level (market_analysis.competition_level).
  ["منخفض",             "Low"],
  ["مرتفع",             "High"],

  // Risk severity (risks_and_mitigations[].severity).
  ["عالي",              "High"],
  ["منخفض",             "Low"],
  // Note: 'متوسط' appears above mapped to 'Moderate'. For the severity field
  // specifically, the more natural English term is 'Medium' — handled below.

  // Saudi cities (business_overview.city).
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

// Two flat dictionaries built from the PAIRS table above for O(1) lookup.
// AR_TO_EN: Arabic phrase → English phrase
// EN_TO_AR: English phrase → Arabic phrase
const AR_TO_EN: Record<string, string> = {};
const EN_TO_AR: Record<string, string> = {};
for (const [ar, en] of PAIRS) {
  AR_TO_EN[ar] = en;
  EN_TO_AR[en] = ar;
}
// Special case: severity "Medium" maps to Arabic "متوسط".
// (We can't add it to PAIRS because "متوسط" already maps to "Moderate".)
EN_TO_AR["Medium"] = "متوسط";


/**
 * Detect a string's language: Arabic if it contains any Arabic letter,
 * English otherwise. Returns "en" for non-strings to keep things safe.
 */
export function detectLang(text: unknown): Lang {
  if (typeof text !== "string" || !text) return "en";
  return /[؀-ۿ]/.test(text) ? "ar" : "en";
}


/**
 * Translate a known structured value (classification, rating, severity, …)
 * into the target language. If the value isn't in the dictionary,
 * we return it unchanged (assume it's free-form text from the AI).
 *
 * Use this only for the "short structured" fields. Do NOT use it for
 * paragraphs (narrative, verdict, recommendations) — those need a real
 * AI translation pass.
 */
export function tr(value: unknown, target: Lang): string {
  if (typeof value !== "string" || !value) return value as string;
  const sourceLang = detectLang(value);
  if (sourceLang === target) return value;
  const dict = sourceLang === "ar" ? AR_TO_EN : EN_TO_AR;
  return dict[value] ?? value;
}

/**
 * Translate one entry from decision.reasons.
 *
 * Expected format: "<factor name>: <rating> (<value>) — X/Y"
 * Examples:
 *   Arabic:  "هامش الربح المستقر: ممتاز (28.14%) — 25/25"
 *   English: "Stable Profit Margin: Excellent (28.14%) — 25/25"
 *
 * Tricky cases: the rating itself may contain parentheses, e.g.
 *   "فترة الاسترداد: لا يحدث (الربح غير موجب) (—) — 0/20"
 *   "فرصة السوق: غير محدّد (افتراضي) (—) — 5/10"
 *
 * Strategy: scan parentheses from right to left to find the OUTERMOST
 * matching pair — that pair holds the value. Everything to its left is
 * the rating (which may contain its own inner parens).
 */
export function trReason(reason: string, target: Lang): string {
  if (typeof reason !== "string" || !reason) return reason;
  if (detectLang(reason) === target) return reason;

  // Split on the FIRST colon. Factor names may contain parentheses
  // (e.g. "Return on Investment (3 Years)") but never a colon.
  const colonIdx = reason.indexOf(":");
  if (colonIdx < 0) return reason;
  const name = reason.slice(0, colonIdx).trim();
  const rest = reason.slice(colonIdx + 1).trim();

  // Walk back from the right edge to isolate the value group's parentheses.
  // The format after the colon is: "<rating[(...)]> (<value>) — X/Y".
  // First split on the LAST " — " to peel off the score/weight tail, then
  // parse what's left.
  const sepIdx = rest.lastIndexOf(" — ");
  let left = rest;
  let scoreTail = "";
  if (sepIdx >= 0) {
    left = rest.slice(0, sepIdx).trim();
    scoreTail = rest.slice(sepIdx); // includes the leading " — "
  }

  // left is now "<rating> (<value>)". Find the opening paren of the value
  // group by scanning from the right with a paren-depth counter.
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
    valueGroup = left.slice(valueOpenIdx); // includes the surrounding "(...)"
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
 * Translate the value inside the parentheses of a factor reason.
 * The value can be dynamic, like:
 *   "احتياطي 1,800 مقابل خسارة 164,844"  or  "18 شهر"
 * We do word-by-word replacement of known terms; numbers stay intact.
 */
const VALUE_WORD_PAIRS: Array<[string, string]> = [
  // Longest first to avoid partial-word replacement collisions
  ["غير مطلوب",  "Not Required"],
  ["غير محسوب",  "Not Calculated"],
  ["احتياطي",    "Cushion"],
  ["مقابل",      "vs"],
  ["خسارة",      "Loss"],
  ["شهر",        "months"],
];

function translateValueGroup(text: string, target: Lang): string {
  if (!text) return text;
  // Try a full dictionary lookup first (handles known values like "—" or
  // "غير مطلوب" -> "Not Required").
  const inner = text.startsWith("(") && text.endsWith(")") ? text.slice(1, -1) : text;
  const fromDict = tr(inner, target);
  if (fromDict !== inner) {
    return text.startsWith("(") ? `(${fromDict})` : fromDict;
  }
  // Otherwise fall back to per-word replacement (mirrors the
  // _translate_value_string helper on the backend).
  let out = text;
  for (const [ar, en] of VALUE_WORD_PAIRS) {
    if (target === "en") out = out.split(ar).join(en);
    else out = out.split(en).join(ar);
  }
  return out;
}

/**
 * Swap Arabic city names inside free-form text for their English equivalents
 * (and vice versa). Useful when the AI translated a paragraph but left the
 * city name in the source language, e.g.:
 *   "Customers seeking a unique experience in جدة"
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

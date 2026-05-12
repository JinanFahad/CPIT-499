# =====================================================================
# ai_report_engine.py — محرك توليد دراسة الجدوى بالذكاء الاصطناعي
# يحتوي على دالتين رئيسيتين:
#   1) generate_feasibility_report — يولّد التقرير الكامل بصيغة JSON منظمة
#   2) enrich_project_data — يولّد بيانات تكميلية (العملاء، عرض القيمة)
# =====================================================================

from openai import OpenAI
from report_schema import REPORT_SCHEMA
import json

client = OpenAI()


def generate_feasibility_report(financials: dict, decision: dict, market_data: dict, language: str = "ar") -> dict:
    """
    يأخذ:
      - الأرقام المالية (من financial_engine)
      - قرار التصنيف (من decision_engine)
      - بيانات السوق (نوع المشروع، المدينة، إلخ)
      - اللغة المطلوبة للتقرير: "ar" (افتراضي) أو "en"
    ويرجع:
      - JSON متكامل مطابق لـ REPORT_SCHEMA يحتوي على:
        executive_summary, business_overview, market_analysis,
        financial_summary, decision, risks_and_mitigations, next_steps
    """
    if language == "en":
        prompt = _build_english_prompt(financials, decision, market_data)
    else:
        prompt = _build_arabic_prompt(financials, decision, market_data)

    # نستخدم نموذج gpt-4o لجودة عالية في التحليل
    # strict: True يجبر الـ AI يطلع JSON يطابق الـ schema بدقة
    response = client.responses.create(
        model="gpt-4o",
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "feasibility_report",
                "schema": REPORT_SCHEMA["schema"],
                "strict": True
            }
        }
    )

    report = json.loads(response.output_text)

    # ── دمج بيانات منحنى التدرّج في التقرير بعد توليد الـ AI ──
    # الـ schema يفرض بنية محدودة، لذا نضيف حقول التوقع الشهري والإجماليات
    # السنوية يدوياً ليستطيع الفرونت عرضها (الجدول الشهري، إلخ)
    fs = report.setdefault("financial_summary", {})
    for key in (
        "month_1_revenue", "month_1_net_profit",
        "break_even_month", "monthly_projection",
        "year_1_total_revenue", "year_1_total_expenses", "year_1_total_profit",
        "ramp_up_months",
        "salaries_total", "salary_breakdown", "cogs_cost",
        # توقّع 3 سنوات + الربح التراكمي + ROI
        "yearly_summary", "cumulative_profit_curve",
        "total_3_year_profit", "roi_3_year_percent",
        "yearly_revenue_growth", "yearly_cost_inflation",
        # توزيع رأس المال + التنبؤ بالنجاح/الفشل
        "capital_allocation", "operating_cushion",
        "success_prediction",
        # ملخص المدخلات اللي دخلها المستخدم (رأس المال، الموظفين، إلخ)
        "inputs_summary",
    ):
        if key in financials:
            fs[key] = financials[key]

    return report


def _build_arabic_prompt(financials: dict, decision: dict, market_data: dict) -> str:
    """يبني البرومبت العربي الأصلي — مستشار استثماري سعودي."""
    return f"""
أنت مستشار استثماري سعودي أول، متخصص في تقييم مشاريع المنشآت الصغيرة والمتوسطة.
مهمتك تحليل أرقام حقيقية وإصدار تقرير استثماري منضبط — لا عبارات عامة، كل جملة مبنية على رقم.

⚠ ملاحظة منهجية مهمة:
الأرقام الشهرية (monthly_revenue, monthly_net_profit, profit_margin_percent) تمثّل
وضع التشغيل المستقر بعد ٦ أشهر من الافتتاح، حسب منحنى تدرّج العملاء (Ramp-up).
الأشهر الأولى بطبيعتها أقل، والمشروع يصل لكامل طاقته في شهر {financials.get("ramp_up_months", 6)}.
استخدم monthly_projection لتفهم رحلة السنة الأولى، و year_1_total_profit للنتيجة التراكمية.
لا تقيّم المشروع كخاسر فقط لأن شهر 1 سلبي — هذا متوقع لأي مشروع جديد.

══════════════════════════════════════
البيانات المالية:
{json.dumps(financials, ensure_ascii=False, indent=2)}

نتيجة محرك القرار:
{json.dumps(decision, ensure_ascii=False, indent=2)}

بيانات السوق:
{json.dumps(market_data, ensure_ascii=False, indent=2)}
══════════════════════════════════════

المطلوب بالترتيب:

── executive_summary (كائن وليس نصاً) ──────────────────────────────────────
• verdict: جملة واحدة تصدر الحكم الاستثماري بوضوح مع ذكر هامش الربح وفترة الاسترداد.
• highlights: 3 نقاط قصيرة (جملة لكل منها) تلخص أبرز نتائج التحليل رقمياً.
• key_concern: أكبر مخاطرة واحدة بجملة قصيرة تذكر الرقم.
• key_opportunity: أبرز فرصة بجملة قصيرة تذكر الرقم.

── business_overview ────────────────────────────────────────────────────────
املأ business_type, restaurant_type, city, target_customers, value_proposition,
main_products من بيانات السوق المُدخلة.

── market_analysis ──────────────────────────────────────────────────────────
اجلب competition_level, market_opportunity_score, direct_competitor_summary,
bullets, recommendations, narrative من بيانات السوق المُدخلة كما هي.
إذا لم تتوفر بيانات سوق: اجعل market_opportunity_score=5, competition_level="متوسط",
وcount=0, avg_rating=0, strongest_name="لا يوجد بيانات", weakest_gap="لا توجد بيانات كافية".

── financial_summary ────────────────────────────────────────────────────────
اجلب القيم مباشرة من البيانات المالية المُدخلة دون تعديل:
monthly_revenue, monthly_expenses, monthly_net_profit, profit_margin_percent,
break_even_revenue, payback_period_months, utilities_cost, overhead_cost, marketing_cost.

احسب stress_test:
• revenue_drop_10pct = monthly_revenue × 0.90
• expenses_rise_10pct = monthly_expenses × 1.10
• stressed_net_profit = revenue_drop_10pct − expenses_rise_10pct
• stressed_margin_pct = (stressed_net_profit ÷ revenue_drop_10pct) × 100

احسب improvement_to_18pct_margin (للوصول لهامش 18%):
• target_net_profit = monthly_revenue × 0.18
• max_expenses = monthly_revenue − target_net_profit
• required_saving = monthly_expenses − max_expenses

── decision ─────────────────────────────────────────────────────────────────
اجلب classification, score, reasons من نتيجة محرك القرار.
أضف:
• invest_conditions: 2-3 شروط واضحة ورقمية يجب توافرها للاستثمار.
• reject_conditions: 2-3 حالات واضحة ورقمية تستوجب رفض المشروع.

── risks_and_mitigations ────────────────────────────────────────────────────
3-4 مخاطر مع severity (عالي/متوسط/منخفض) وخطة تخفيف عملية لكل منها.
ركّز على المخاطر المنبثقة من الأرقام الفعلية (هامش منخفض، فترة استرداد طويلة...).

── next_steps ───────────────────────────────────────────────────────────────
4-5 خطوات عملية قابلة للتنفيذ مباشرة، مرتبة حسب الأولوية.

القواعد العامة:
- كل جملة تحتوي على رقم أو نسبة مئوية — لا عبارات مبهمة.
- لا تختلق أرقاماً — استخدم المُدخلات فقط.
- اللغة العربية فقط.
- النتيجة JSON مطابقة للـ schema تماماً.
"""


def _build_english_prompt(financials: dict, decision: dict, market_data: dict) -> str:
    """Builds the English investment-consultant prompt (mirror of the Arabic one)."""
    return f"""
You are a senior Saudi investment consultant specialized in evaluating
SME (small and medium enterprise) projects.
Your task: analyze the real numbers below and produce a disciplined
investment report — no vague phrases; every sentence must be grounded
in a real figure from the inputs.

⚠ Important methodological note:
The monthly figures (monthly_revenue, monthly_net_profit, profit_margin_percent)
represent the stable operating state after a 6-month customer ramp-up curve.
Early months are naturally lower; the project reaches full capacity in
month {financials.get("ramp_up_months", 6)}.
Use monthly_projection to understand the year-1 journey, and
year_1_total_profit for the cumulative outcome.
Do NOT classify the project as a failure just because month 1 is negative —
this is expected for any new project.

══════════════════════════════════════
Financial data:
{json.dumps(financials, ensure_ascii=False, indent=2)}

Decision engine output:
{json.dumps(decision, ensure_ascii=False, indent=2)}

Market data:
{json.dumps(market_data, ensure_ascii=False, indent=2)}
══════════════════════════════════════

Required, in order:

── executive_summary (object, not a string) ─────────────────────────────────
• verdict: one sentence clearly stating the investment verdict, mentioning
  profit margin and payback period.
• highlights: 3 short bullet sentences summarizing the key numerical findings.
• key_concern: the single biggest risk in one short sentence with the number.
• key_opportunity: the most prominent opportunity in one short sentence with the number.

── business_overview ────────────────────────────────────────────────────────
Fill business_type, restaurant_type, city, target_customers, value_proposition,
main_products from the provided market data.

── market_analysis ──────────────────────────────────────────────────────────
Carry competition_level, market_opportunity_score, direct_competitor_summary,
bullets, recommendations, narrative from the market data as-is.
If market data is missing: set market_opportunity_score=5,
competition_level="Moderate", count=0, avg_rating=0,
strongest_name="No data available", weakest_gap="Insufficient data".

── financial_summary ────────────────────────────────────────────────────────
Carry the values from the financial inputs directly without modification:
monthly_revenue, monthly_expenses, monthly_net_profit, profit_margin_percent,
break_even_revenue, payback_period_months, utilities_cost, overhead_cost, marketing_cost.

Compute stress_test:
• revenue_drop_10pct = monthly_revenue × 0.90
• expenses_rise_10pct = monthly_expenses × 1.10
• stressed_net_profit = revenue_drop_10pct − expenses_rise_10pct
• stressed_margin_pct = (stressed_net_profit ÷ revenue_drop_10pct) × 100

Compute improvement_to_18pct_margin (to reach an 18% margin):
• target_net_profit = monthly_revenue × 0.18
• max_expenses = monthly_revenue − target_net_profit
• required_saving = monthly_expenses − max_expenses

── decision ─────────────────────────────────────────────────────────────────
Carry classification, score, reasons from the decision engine output.
Add:
• invest_conditions: 2-3 clear, numerical conditions that must hold for investment.
• reject_conditions: 2-3 clear, numerical cases that would warrant rejecting the project.

── risks_and_mitigations ────────────────────────────────────────────────────
3-4 risks each with severity AND a practical mitigation plan.
The severity field MUST be EXACTLY one of these English strings: "High", "Medium", or "Low".
Do NOT use Arabic severity values. Focus on risks emerging from the actual numbers
(low margin, long payback, etc.).

── next_steps ───────────────────────────────────────────────────────────────
4-5 actionable steps directly executable, ordered by priority.

── market_analysis.competition_level ────────────────────────────────────────
MUST be exactly one of these English strings: "Low", "Moderate", or "High".
Do NOT use Arabic values.

General rules:
- Every sentence contains a number or percentage — no vague phrases.
- Do NOT invent numbers — use the inputs only.
- ALL text fields (verdict, highlights, narrative, bullets, recommendations,
  risks, mitigations, next_steps, business_type display labels, target_customers,
  value_proposition, etc.) MUST be in English only.
- Do NOT use any Arabic word anywhere in the response.
- The result must be a JSON exactly matching the schema.
"""


def enrich_project_data(business_type: str, city: str, language: str = "ar") -> dict:
    """
    يولّد بيانات تكميلية بسيطة بناءً على نوع المشروع والمدينة:
    - target_customers: وصف العملاء المستهدفين
    - value_proposition: ميزة المشروع
    نستخدم نموذج أرخص (gpt-4o-mini) لأن المهمة بسيطة.

    language: "ar" (افتراضي) أو "en" — يحدد لغة الناتج.
    """
    if language == "en":
        instruction = (
            f"Based on the project type: {business_type} in the city of: {city}\n"
            "Generate in English:\n"
            "1. target_customers: one sentence describing the target customers\n"
            "2. value_proposition: one sentence describing the project's value proposition\n"
            'Return JSON only: {"target_customers": "...", "value_proposition": "..."}'
        )
    else:
        instruction = (
            f"بناءً على نوع المشروع: {business_type} في مدينة: {city}\n"
            "ولّد بالعربية:\n"
            "1. target_customers: جملة واحدة تصف العملاء المستهدفين\n"
            "2. value_proposition: جملة واحدة تصف ميزة المشروع\n"
            'أرجع JSON فقط: {"target_customers": "...", "value_proposition": "..."}'
        )

    response = client.responses.create(
        model="gpt-4o-mini",
        input=instruction,
        text={"format": {"type": "json_object"}}
    )
    return json.loads(response.output_text)

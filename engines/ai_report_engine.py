# ai_report_engine.py
# AI-powered feasibility report generator. Two public functions:
#   generate_feasibility_report — produces the full structured report JSON.
#   enrich_project_data         — generates a short target-customers and
#                                 value-proposition pair when the user does
#                                 not supply them.

from openai import OpenAI, OpenAIError
from schemas.report_schema import REPORT_SCHEMA
import json
import logging

logger = logging.getLogger(__name__) #عشان كل لوقر تطبع اسم الفايل 

client = OpenAI()


# Custom exception hierarchy so callers can distinguish a transient service
# outage from a structural problem in the AI response.
class AIReportError(Exception):
    """Base exception for feasibility report generation failures."""
    pass #الاب وتحت الابناء 


class AIServiceUnavailable(AIReportError):
    """The OpenAI request failed (network, auth, quota, or HTTP error)."""
    pass


class AIResponseInvalid(AIReportError):
    """The AI response could not be parsed as JSON or violated the schema."""
    pass


def generate_feasibility_report(financials: dict, decision: dict, market_data: dict, language: str = "ar") -> dict:
    # بنات اقروا هذا ال docstring عشان تفهمون الداله ايش تسوي 
    """Generate the full feasibility report.

    Args: 
        financials: output of financial_engine.calculate_financials.
        decision: output of decision_engine.classify_project.
        market_data: project context (type, city, customers, etc.).
        language: 'ar' or 'en'.

    Returns:
        A dict matching REPORT_SCHEMA with executive_summary, business_overview,
        market_analysis, financial_summary, decision, risks_and_mitigations,
        and next_steps.

    Raises:
        ValueError: when any of the input dicts is missing or empty.
        AIServiceUnavailable: when OpenAI cannot be reached.
        AIResponseInvalid: when the AI response cannot be parsed.
    """
    # فالديشينز 
    if not isinstance(financials, dict) or not financials:
        raise ValueError("financials must be a non-empty dict")
    if not isinstance(decision, dict):
        raise ValueError("decision must be a dict") # هنا ممكن يكونون فاضين في بعض الحالات 
    if not isinstance(market_data, dict):
        raise ValueError("market_data must be a dict")
    if language not in ("ar", "en"):
        language = "ar"


#---------------------------------------------------------------


    if language == "en":
        prompt = _build_english_prompt(financials, decision, market_data)
    else:
        prompt = _build_arabic_prompt(financials, decision, market_data)

    # The OpenAI call is wrapped so any network or service failure is
    # surfaced as AIServiceUnavailable and the API layer can return a 503.
    try:
        response = client.responses.create(
            model="gpt-4o", # اخترت هذا المودل لان التقرير معقد مره وابي تحليل عميق وقوي
            input=prompt,
            text={ 
                "format": {
                    "type": "json_schema",
                    "name": "feasibility_report",
                    "schema": REPORT_SCHEMA["schema"], # سويت السكيما في ملف منفصل عشان يكون واضح وسهل تعديله لو احتجنا 
                    "strict": True # عشان اضمن انه دايم يرجع الشكل الصحيح ولا يضيف حقول زيادة او يغير في الهيكل
                }
            }
        )

    except OpenAIError as e:
        logger.exception("OpenAI call failed in generate_feasibility_report")
        raise AIServiceUnavailable(f"Failed to reach AI service: {e}") from e # e يعني الخطأ الأصلي عشان لو احد يبغى  يعرف التفاصيل يقدر يشوفها في اللوقز
    
    except Exception as e:
        logger.exception("Unexpected error calling OpenAI")
        raise AIServiceUnavailable(f"Unexpected error in AI call: {e}") from e



    # نحول رد ال ai من جيسون الى دكشنري عشان نقدر نتعامل معاه 
    # حطيته في تراي وايكسبت احتياط حتى لو اني مخليته ستريكت ماتدرون وش يصير 
    try:
        report = json.loads(response.output_text)
    except (json.JSONDecodeError, AttributeError, TypeError) as e:
        logger.exception("AI response was not valid JSON")
        raise AIResponseInvalid(f"AI returned invalid JSON: {e}") from e

    if not isinstance(report, dict):
        raise AIResponseInvalid("AI returned a non-object JSON value") #اللي سويته فووق 

    # The strict JSON schema does not allow free-form extension fields. We
    # attach the ramp-up curve, yearly totals, capital allocation, and the
    # success prediction onto the financial_summary section manually so the
    # frontend has everything it needs without a second round-trip.

    # بعض الاشياء اللي بحطها بالتقرير بنفس مو بال ai 
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
        "capital_allocation", "operating_cushion",
        "success_prediction",
        "inputs_summary",
    ):
        
        # هنا ننسخ كل الفيلدز الي من ال فاينانشلز ونحطها بالتقرير والي يكون ناقص نتجاهله ونحط - مكانه عشان مايوقف البرنامج
        if key in financials:
            fs[key] = financials[key]

    return report 



def _build_arabic_prompt(financials: dict, decision: dict, market_data: dict) -> str:
    """Build the Arabic system prompt for the senior investment-consultant role."""
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
    """Build the English system prompt (mirrors the Arabic version)."""
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
    """Generate two short, project-context strings:
        target_customers   — one sentence describing the target customers.
        value_proposition  — one sentence describing what makes it appealing.

    Uses gpt-4o-mini (the cheaper model) since the task is trivial. On AI
    failure or malformed output, returns sensible defaults instead of raising
    so the rest of the report pipeline can still finish.

    language: 'ar' or 'en' for the output language.
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

    try:
        response = client.responses.create(
            model="gpt-4o-mini",
            input=instruction,
            text={"format": {"type": "json_object"}}


        ) # هنا طبقت ال graceful degradation عشان لو ال ai صار فيه مشكلة او رجع جيسون غير صالح ما يوقف البرنامج كله ويعطينا قيم افتراضية معقولة بدالها عشان نقدر نكمل باقي التقرير
    except OpenAIError as e:
        logger.warning("enrich_project_data: OpenAI failed (%s), returning defaults", e)
        if language == "en":
            return {
                "target_customers": f"Customers interested in {business_type} in {city}.",
                "value_proposition": f"A reliable {business_type} offering quality service in {city}.",
            }
        return {
            "target_customers": f"العملاء المهتمون بـ {business_type} في {city}.",
            "value_proposition": f"تقديم خدمة موثوقة وعالية الجودة في {city}.",
        }
# نحوله الى جيسون اعشان نقدر نتعامل معاه بسهولة في باقي التقرير ولو صار فيه مشكلة نرجع قيم افتراضية معقولة عشان نكمل باقي التقرير بدون ما يوقف البرنامج كله
    try:
        result = json.loads(response.output_text)
    except (json.JSONDecodeError, AttributeError, TypeError) as e:
        
        logger.warning("enrich_project_data: invalid JSON from AI — using defaults (%s)", e)
        if language == "en":
            return {"target_customers": "General customers.", "value_proposition": "Quality service."}
        return {"target_customers": "العملاء بشكل عام.", "value_proposition": "خدمة عالية الجودة."} 

    # نضمن إن الحقول المطلوبة موجودة (حتى لو الـ AI نسي واحد)
    if not isinstance(result, dict):
        result = {}
    result.setdefault("target_customers", "" if language == "en" else "")
    result.setdefault("value_proposition", "" if language == "en" else "")
    return result

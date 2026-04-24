# from openai import OpenAI
# from report_schema import REPORT_SCHEMA
# import json

# client = OpenAI()

# def generate_feasibility_report(financials, decision, market_data):

#     prompt = f"""
# أنت مستشار استثماري سعودي أول، متخصص في تقييم مشاريع المنشآت الصغيرة ووالمتوسطة.

# مهمتك ليست كتابة تقرير وصفي،
# بل إجراء تحليل استثماري عميق يعتمد على الأرقام المقدمة فقط.

# استخدم البيانات التالية كما هي دون تعديل:

# البيانات المالية:
# {financials}

# نتيجة محرك القرار:
# {decision}

# بيانات السوق:
# {market_data}

# المطلوب:

# 1) تحليل قوة هامش الربح مقارنة بمتوسط قطاع المطاعم الصغيرة في السعودية.
# 2) إجراء اختبار ضغط بافتراض:
#    - انخفاض عدد العملاء 10%
#    - ارتفاع التكاليف التشغيلية 10%
# 3) توضيح أثر ذلك رقميًا على صافي الربح والهامش.
# 4) اقتراح 3 تحسينات رقمية واضحة لرفع هامش الربح إلى 18% على الأقل.
# 5) تقييم كفاءة رأس المال وفترة الاسترداد.
# 6) إصدار قرار استثماري واضح:
#    - هل تنصح بالاستثمار؟
#    - تحت أي شروط؟
#    - متى ترفض المشروع؟
# 7) عند عرض التحليل المالي، وضّح أن المصروفات التشغيلية تشمل:
#    - المرافق والخدمات (كهرباء، ماء، إنترنت ونحوها)
#    - التشغيل العام (صيانة، برامج، أدوات، مصاريف عامة)
#    - التسويق
# 8) اذكر القيم الرقمية لهذه البنود ضمن التحليل المالي بشكل مختصر وواضح.

# الأسلوب:
# - تحليلي
# - احترافي
# - موجه للمستثمرين
# - بدون عبارات عامة
# - يعتمد على الأرقام بشكل مكثف

# أعد النتيجة بصيغة JSON مطابقة للهيكل المطلوب.
# """

#     response = client.responses.create(
#         model="gpt-5.2",
#         input=prompt,
#         text={
#             "format": {
#                 "type": "json_schema",
#                 "name": "feasibility_report",   # ✅ هذا اللي كان ناقص
#                 "schema": REPORT_SCHEMA["schema"]  # ✅ مرري الـschema نفسه
#             }
#         }
#     )

#     return json.loads(response.output_text)
# def enrich_project_data(business_type: str, city: str) -> dict:
#     response = client.responses.create(
#         model="gpt-4o-mini",
#         input=f"""
# بناءً على نوع المشروع: {business_type} في مدينة: {city}
# ولّد بالعربية:
# 1. target_customers: جملة وحدة تصف العملاء المستهدفين
# 2. value_proposition: جملة وحدة تصف ميزة المشروع
# أرجع JSON فقط: {{"target_customers": "...", "value_proposition": "..."}}
# """,
#         text={"format": {"type": "json_object"}}
#     )
#     return json.loads(response.output_text)
"""
ai_report_engine.py — نسخة محسّنة
يُولّد تقرير جدوى احترافي بـ JSON منظّم ومتوافق مع report_schema.py الجديد.
"""

from openai import OpenAI
from report_schema import REPORT_SCHEMA
import json

client = OpenAI()


def generate_feasibility_report(financials: dict, decision: dict, market_data: dict) -> dict:
    prompt = f"""
أنت مستشار استثماري سعودي أول، متخصص في تقييم مشاريع المنشآت الصغيرة والمتوسطة.
مهمتك تحليل أرقام حقيقية وإصدار تقرير استثماري منضبط — لا عبارات عامة، كل جملة مبنية على رقم.

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

    response = client.responses.create(
        model="gpt-4o",           # استبدل بالنموذج المتاح لديك
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

    return json.loads(response.output_text)


def enrich_project_data(business_type: str, city: str) -> dict:
    response = client.responses.create(
        model="gpt-4o-mini",
        input=f"""
بناءً على نوع المشروع: {business_type} في مدينة: {city}
ولّد بالعربية:
1. target_customers: جملة واحدة تصف العملاء المستهدفين
2. value_proposition: جملة واحدة تصف ميزة المشروع
أرجع JSON فقط: {{"target_customers": "...", "value_proposition": "..."}}
""",
        text={"format": {"type": "json_object"}}
    )
    return json.loads(response.output_text)
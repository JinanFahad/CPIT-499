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


def generate_feasibility_report(financials: dict, decision: dict, market_data: dict) -> dict:
    """
    يأخذ:
      - الأرقام المالية (من financial_engine)
      - قرار التصنيف (من decision_engine)
      - بيانات السوق (نوع المشروع، المدينة، إلخ)
    ويرجع:
      - JSON متكامل مطابق لـ REPORT_SCHEMA يحتوي على:
        executive_summary, business_overview, market_analysis,
        financial_summary, decision, risks_and_mitigations, next_steps
    """
    # برومبت دقيق يجبر الـ AI على بناء كل جملة على رقم حقيقي بدون اختلاق
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

    return json.loads(response.output_text)


def enrich_project_data(business_type: str, city: str) -> dict:
    """
    يولّد بيانات تكميلية بسيطة بناءً على نوع المشروع والمدينة:
    - target_customers: وصف العملاء المستهدفين
    - value_proposition: ميزة المشروع
    نستخدم نموذج أرخص (gpt-4o-mini) لأن المهمة بسيطة
    """
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

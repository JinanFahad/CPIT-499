from openai import OpenAI
from report_schema import REPORT_SCHEMA
import json

client = OpenAI()

def generate_feasibility_report(financials, decision, market_data):

    prompt = f"""
أنت مستشار استثماري سعودي أول، متخصص في تقييم مشاريع المنشآت الصغيرة ووالمتوسطة.

مهمتك ليست كتابة تقرير وصفي،
بل إجراء تحليل استثماري عميق يعتمد على الأرقام المقدمة فقط.

استخدم البيانات التالية كما هي دون تعديل:

البيانات المالية:
{financials}

نتيجة محرك القرار:
{decision}

بيانات السوق:
{market_data}

المطلوب:

1) تحليل قوة هامش الربح مقارنة بمتوسط قطاع المطاعم الصغيرة في السعودية.
2) إجراء اختبار ضغط بافتراض:
   - انخفاض عدد العملاء 10%
   - ارتفاع التكاليف التشغيلية 10%
3) توضيح أثر ذلك رقميًا على صافي الربح والهامش.
4) اقتراح 3 تحسينات رقمية واضحة لرفع هامش الربح إلى 18% على الأقل.
5) تقييم كفاءة رأس المال وفترة الاسترداد.
6) إصدار قرار استثماري واضح:
   - هل تنصح بالاستثمار؟
   - تحت أي شروط؟
   - متى ترفض المشروع؟

الأسلوب:
- تحليلي
- احترافي
- موجه للمستثمرين
- بدون عبارات عامة
- يعتمد على الأرقام بشكل مكثف

أعد النتيجة بصيغة JSON مطابقة للهيكل المطلوب.
"""

    response = client.responses.create(
        model="gpt-5.2",
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "feasibility_report",   # ✅ هذا اللي كان ناقص
                "schema": REPORT_SCHEMA["schema"]  # ✅ مرري الـschema نفسه
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
1. target_customers: جملة وحدة تصف العملاء المستهدفين
2. value_proposition: جملة وحدة تصف ميزة المشروع
أرجع JSON فقط: {{"target_customers": "...", "value_proposition": "..."}}
""",
        text={"format": {"type": "json_object"}}
    )
    return json.loads(response.output_text)
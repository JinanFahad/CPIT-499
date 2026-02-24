from openai import OpenAI
import json
from pitch_schema import PITCH_SCHEMA

client = OpenAI()

def generate_pitch_deck_json(feasibility_report: dict, extra: dict | None = None):
    extra = extra or {}

    # ✅ 1) جهزي سياق المشروع من دراسة الجدوى
    business_type = feasibility_report.get("business_type") or extra.get("business_type") or ""
    city = feasibility_report.get("city") or extra.get("city") or ""
    target_customers = feasibility_report.get("target_customers") or extra.get("target_customers") or ""
    value_proposition = feasibility_report.get("value_proposition") or extra.get("value_proposition") or ""
    competitors = feasibility_report.get("competitors") or extra.get("competitors") or []
    market_notes = feasibility_report.get("market_notes") or extra.get("market_notes") or ""
    pricing_notes = feasibility_report.get("pricing_notes") or extra.get("pricing_notes") or ""

    # financial highlights (عدلي المسارات حسب شكل تقريرك)
    payback = feasibility_report.get("payback_period_months") or feasibility_report.get("payback_months") or ""
    profit_margin = feasibility_report.get("profit_margin_percent") or ""
    monthly_profit = feasibility_report.get("monthly_net_profit") or feasibility_report.get("net_profit_monthly") or ""

    project_context = f"""
بيانات المشروع (استخدمها فقط ولا تغيّر فكرة المشروع):
- نوع المشروع: {business_type}
- المدينة: {city}
- العملاء المستهدفون: {target_customers}
- القيمة المقترحة: {value_proposition}
- المنافسون: {", ".join(competitors) if isinstance(competitors, list) else competitors}
- ملاحظات السوق: {market_notes}
- ملاحظات التسعير: {pricing_notes}

مؤشرات مالية متاحة:
- فترة الاسترداد (بالشهور): {payback}
- هامش الربح (%): {profit_margin}
- صافي الربح الشهري: {monthly_profit}

ملاحظة إلزامية:
- يجب أن يكون محتوى العرض عن نفس نوع المشروع أعلاه حرفيًا (مثال: مقهى)، ولا يجوز تحويله إلى منصة/تطبيق/عيادات.
- إذا نقصت بيانات رقمية، استخدم صياغة عامة بدون اختلاق أرقام.
"""

    # ✅ 2) البرومبت النهائي (تعليمات + سياق)
    prompt = f"""{project_context}

أنت تقوم بتوليد عرض تقديمي احترافي (Pitch Deck) باللغة العربية لمشروع ناشئ بناءً على دراسة جدوى.

يجب أن يكون الناتج JSON صالح فقط ويتبع الـ JSON schema المرفق بدقة.
لا تضف أي نص خارج JSON.

القواعد الأساسية:
- عدد الشرائح 8 فقط.
- كل شريحة تحتوي على title, subtitle, bullets, numbers.
- bullets من 0 إلى 3 فقط (بدون فقرات).
- numbers من 0 إلى 4 واستخدم [] إذا لم توجد أرقام.

أسلوب الكتابة:
- عربي احترافي موجّه للمستثمرين.
- عناوين قوية، مختصرة، وإقناعية.
- لا أسلوب أكاديمي ولا شرح مطوّل.

هيكل الشرائح (بالترتيب):
1) الغلاف: deck_title = اسم المشروع (اكتب اسم مناسب لنوع المشروع)، tagline قوية، والعنوان title.
2) المشكلة
3) الحل
4) الفرصة السوقية
5) نموذج الإيرادات
6) المؤشرات المالية (ضع الأرقام داخل numbers)
7) الميزة التنافسية
8) طلب الاستثمار
"""

    response = client.responses.create(
        model="gpt-5.2",
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "pitch_deck",
                "schema": PITCH_SCHEMA,
                "strict": True
            }
        }
    )

    return json.loads(response.output_text)
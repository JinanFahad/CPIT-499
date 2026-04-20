"""
ai_consultant.py
----------------
المستشار الذكي لدراسات الجدوى — يستخدم OpenAI مع context كامل من ملف PDF
السيشن مؤقتة: تُخزن في الذاكرة فقط وتُمسح عند إغلاق السيرفر
"""

import json
from openai import OpenAI

client = OpenAI()

# ──────────────────────────────────────────────
# تخزين مؤقت في الذاكرة (بدون DB)
# key = session_id, value = list of messages
# ──────────────────────────────────────────────
_sessions: dict[str, list[dict]] = {}


def get_or_create_session(session_id: str, report_context: dict | None = None) -> list[dict]:
    """
    إرجاع محادثة موجودة أو إنشاء واحدة جديدة مع system prompt يحتوي على دراسة الجدوى
    """
    if session_id not in _sessions:
        system_msg = _build_system_prompt(report_context or {})
        _sessions[session_id] = [{"role": "system", "content": system_msg}]
    return _sessions[session_id]


def clear_session(session_id: str):
    """مسح السيشن من الذاكرة"""
    _sessions.pop(session_id, None)


def chat_with_consultant(session_id: str, user_message: str, report_context: dict | None = None) -> str:
    """
    إرسال رسالة للمستشار والحصول على رد
    - session_id: معرّف فريد للمحادثة
    - user_message: سؤال أو طلب المستخدم
    - report_context: بيانات دراسة الجدوى (تُرسل مرة واحدة عند إنشاء السيشن)
    """
    messages = get_or_create_session(session_id, report_context)

    # أضف رسالة المستخدم
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=1500,
        temperature=0.7,
    )

    assistant_reply = response.choices[0].message.content

    # احفظ رد المستشار في السيشن
    messages.append({"role": "assistant", "content": assistant_reply})

    return assistant_reply


def _build_system_prompt(report_context: dict) -> str:
    """
    بناء system prompt شامل يحتوي على كامل بيانات دراسة الجدوى
    """
    context_text = ""
    if report_context:
        context_text = f"""
═══════════════════════════════════════════════
بيانات دراسة الجدوى المرفوعة:
{json.dumps(report_context, ensure_ascii=False, indent=2)}
═══════════════════════════════════════════════
"""

    return f"""أنت "مُقدِّم" — مستشار استثماري ذكي متخصص في دراسات الجدوى للمشاريع السعودية الصغيرة والمتوسطة.

{context_text}

دورك:
- تحليل دراسة الجدوى المرفوعة وشرحها للمستخدم بأسلوب واضح ومبسّط
- الإجابة على أسئلة المستخدم بناءً على البيانات الفعلية في الدراسة
- تقديم توصيات واقتراحات عملية مبنية على الأرقام
- تحذير المستخدم إذا كانت هناك مخاطر واضحة في البيانات
- شرح المصطلحات المالية بلغة بسيطة

قواعد صارمة:
- لا تخترع أرقامًا أو معلومات غير موجودة في البيانات المرفوعة
- إذا سُئلت عن شيء خارج نطاق الدراسة، أخبر المستخدم بوضوح
- ردودك باللغة العربية دائمًا
- كن مباشرًا ومختصرًا — لا حشو ولا مقدمات طويلة
- استخدم الأرقام والنسب المئوية من الدراسة في ردودك
- إذا طُلب منك ملخص، اذكر أهم 5 نقاط رقمية من الدراسة"""


def get_quick_suggestions(report_context: dict) -> list[str]:
    """
    إرجاع اقتراحات سريعة مخصصة بناءً على دراسة الجدوى
    """
    suggestions = [
        "📊 لخّص لي دراسة الجدوى هذي",
        "💰 اشرح لي هامش الربح وهل هو جيد؟",
        "⚠️ ما هي أكبر المخاطر في هذا المشروع؟",
        "📈 كيف أحسّن الربحية؟",
        "⏱️ متى سأسترد رأس المال؟",
    ]

    # إذا في بيانات خاصة، نخصص الاقتراحات
    if report_context:
        business = report_context.get("business_type", "")
        if business:
            suggestions.insert(0, f"🏢 حلّل لي وضع {business} في السوق")

    return suggestions[:5]
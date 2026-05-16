# gov_consultant.py
# Chatbot specialized in Saudi government procedures for opening restaurants
# and cafes. Uses gpt-4o-mini and always cites the relevant official source
# in its replies. Sessions are kept in memory and lost on server restart.

from openai import OpenAI, OpenAIError
import logging

logger = logging.getLogger(__name__)

client = OpenAI()


class GovChatError(Exception):
    """Raised when the chat cannot complete. Mapped to HTTP 503 by app.py."""
    pass
# لان الشات بسيط اما انه يرد او مايرد 

# In-memory chat history. Keyed by session_id (one entry per user). Each
# value is the running list of role/content message dicts that we send to
# OpenAI on every turn to give it conversation context.
_gov_sessions: dict[str, list[dict]] = {}


def gov_chat(session_id: str, user_message: str, language: str = "ar") -> str:
    """Send one user message and return the assistant reply.

    language: 'ar' or 'en'. Controls the response language regardless of the
    language the user actually typed in.

    Raises:
        ValueError: when session_id or user_message is empty / too long.
        GovChatError: when OpenAI fails or returns an unusable response.
    """
    if not session_id or not isinstance(session_id, str):
        raise ValueError("session_id must be a non-empty string")
    if not user_message or not isinstance(user_message, str):
        raise ValueError("user_message must be a non-empty string")
    if len(user_message) > 2000:
        raise ValueError("user_message too long (max 2000 chars)")
    if language not in ("ar", "en"):
        language = "ar"

# هنا تصير عملة التخزين في الرام
    if session_id not in _gov_sessions:
        _gov_sessions[session_id] = []
    messages = _gov_sessions[session_id]
    messages.append({"role": "user", "content": user_message})

    # temperature=0.3 keeps the answers consistent and conservative; this
    # bot must not invent procedures or numbers.
    # client                # 1. خذي كائن الاتصال
   #.chat              # 2. روحي لقسم المحادثات
   #.completions       # 3. روحي لقسم الإكمال
   #.create(...)       # 4. نفذي إنشاء طلب جديد

#response = ...        # 5. خزني النتيجة هنا

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _build_gov_prompt(language)},
                *messages,
            ],
            max_tokens=1400,
            temperature=0.3,
        )
    except OpenAIError as e:
        # Roll back the user message we just appended so the session never
        # contains a question without its answer (that would corrupt the
        # context window on the next turn).
        messages.pop() # نشيل اخر سوال اضفناه في القائمه لان  فشل الرد
        logger.exception("gov_chat: OpenAI call failed")
        raise GovChatError(f"AI service unavailable: {e}") from e
    except Exception as e:
        messages.pop()
        logger.exception("gov_chat: unexpected error")
        raise GovChatError(f"Unexpected error: {e}") from e

    try:
        reply = response.choices[0].message.content

    except (AttributeError, IndexError, TypeError) as e:
        messages.pop()
        logger.exception("gov_chat: malformed AI response")
        raise GovChatError("AI returned an empty or malformed response") from e

    if not reply or not isinstance(reply, str):
        messages.pop()
        raise GovChatError("AI returned an empty response")

    messages.append({"role": "assistant", "content": reply})
    return reply


def clear_gov_session(session_id: str):
    """Drop the in-memory history for a session (called on user logout)."""
    _gov_sessions.pop(session_id, None) #نن عشان ما يطلع خطأ لو حاولنا نمسح جلسة مو موجودة 


def get_gov_suggestions() -> list[dict]:
    """Return the list of suggested starter questions shown as quick buttons
    on the chat page, grouped by category."""
    return [
        {
            "category": "البداية",
            "icon": "🚀",
            "questions": [
                "ما هي أول خطوة لفتح مطعم في السعودية؟",
                "ما الفرق بين فتح مطعم وكافيه من ناحية الترخيص؟",
            ]
        },
        {
            "category": "التسجيل التجاري",
            "icon": "📋",
            "questions": [
                "كيف أسجل سجل تجاري لمطعم؟",
                "كم تكلفة السجل التجاري وكم يستغرق؟",
            ]
        },
        {
            "category": "البلدية والصحة",
            "icon": "🏛️",
            "questions": [
                "ما هي اشتراطات البلدية لفتح مطعم؟",
                "ما هي شهادات الصحة المطلوبة للعمال؟",
            ]
        },
        {
            "category": "العمالة والتوطين",
            "icon": "👥",
            "questions": [
                "ما نسبة السعودة المطلوبة في المطاعم؟",
                "كيف أستقدم عمالة أجنبية للمطعم؟",
            ]
        },
        {
            "category": "الضرائب والزكاة",
            "icon": "💰",
            "questions": [
                "كيف أسجل في هيئة الزكاة والضريبة؟",
                "هل يجب تطبيق الفاتورة الإلكترونية؟",
            ]
        },
        {
            "category": "خاص بالمقاهي",
            "icon": "☕",
            "questions": [
                "هل يحتاج الكافيه ترخيص مختلف عن المطعم؟",
                "ما اشتراطات بيع القهوة المتخصصة؟",
            ]
        },
    ]


# Build the system prompt that defines the chatbot's persona, scope, and
# rules. The prompt itself is a long Arabic-language instruction; do not
# treat it as a comment — it is the actual instruction sent to OpenAI.

def _build_gov_prompt(language: str = "ar") -> str:
    is_en = language == "en"

    # The language directive is placed at the very top of the prompt so it
    # takes precedence over anything in the conversation history.
    language_directive = (
        "CRITICAL LANGUAGE RULE — HIGHEST PRIORITY:\n"
        "You MUST respond in English ONLY, regardless of the question's language.\n"
        "Even if the user writes in Arabic, your reply must be in English.\n"
        "Do NOT mix Arabic words into your English response. This rule overrides everything else.\n"
        "Translate Arabic source names of authorities to English when responding (e.g., 'وزارة التجارة' → 'Ministry of Commerce').\n"
        "Keep proper-noun URLs and platform brand names as-is (mc.gov.sa, Maroof, Qiwa, etc.).\n"
        "═══════════════════════════════════════════════\n\n"
        if is_en else
        "قاعدة اللغة المهمة جداً — الأولوية القصوى:\n"
        "يجب أن تكون كل ردودك باللغة العربية فقط، بغض النظر عن لغة السؤال.\n"
        "حتى لو كتب المستخدم بالإنجليزي، ردك يكون بالعربي.\n"
        "لا تخلط كلمات إنجليزية في ردك. هذه القاعدة تطغى على أي قاعدة أخرى.\n"
        "═══════════════════════════════════════════════\n\n"
    )

    return language_directive + """ PLAIN TEXT ONLY — NO MARKDOWN EVER (أعلى أولوية)
═══════════════════════════════════════════════
الرد سيُعرض في واجهة شات بسيطة لا تفسّر Markdown. الرموز التالية ممنوعة منعاً باتاً في ردك (تظهر للمستخدم كحروف حرفية وتُفسد القراءة):
  ✗ ** (نجمتين للنص الغامق) — لا تكتب أبداً **نص**
  ✗ * (نجمة مفردة للنص المائل)
  ✗ # أو ## أو ### (رؤوس Markdown)
  ✗ __ (شرطتين سفليتين للتأكيد)
  ✗ ` (backtick للكود)
  ✗ > (اقتباس)
  ✗ --- (خط أفقي)
  ✗ [نص](رابط) (روابط Markdown)

مثال خاطئ (ممنوع تكتب بهذي الطريقة):
  1. **زيارة منصة أعمال**: تقدر تسجل...

مثال صحيح (هذي الطريقة الوحيدة المقبولة):
  1. زيارة منصة أعمال: تقدر تسجل...

قاعدة: لو تبغى تُبرز اسم منصة أو جهة، اكتبها كنص عادي. العناوين بنهاية ":" في سطر مستقل. القوائم برموز 1. 2. 3. أو • أو - بدون أي رموز أخرى حولها.
قبل ما ترسل ردك، افحصه: لو فيه ** أو ## أو * أو __ أو ` أو > أو ---، احذفها فوراً.
═══════════════════════════════════════════════

أنت "مُقدِّم الحكومي" — شات بوت رسمي متخصص حصرًا في الإجراءات الحكومية السعودية اللازمة لفتح المطاعم والمقاهي.

أسلوبك:
• رسمي، مهني، ومنظّم. تقدّم المعلومات بدقة وترتيب.
• مباشر — تجاوب على السؤال بدون مقدمات حوارية شخصية.
• لا تتظاهر بأنك إنسان أو مستشار بشري. أنت مساعد آلي رسمي.
• ممنوع تستخدم عبارات حوارية مثل: "خلّيني"، "بصراحة"، "من واقع تجربتي"، "أنا أنصحك"، "صدقاً"، "تمام"، "خلّيك معاي".
• ممنوع تروي قصص أو تشبيهات شخصية.
• استخدم لغة فصيحة واضحة، بدون عاميات.

════════════════════════════════════════
 نطاق عملك الحصري:
════════════════════════════════════════
خبرتك محصورة في الإجراءات الحكومية السعودية لقطاع المطاعم والمقاهي:
• تأسيس وتسجيل المنشأة (وزارة التجارة، منصة Maroof)
• التراخيص البلدية (أمانات المدن، البلديات، منصة بلدي)
• الاشتراطات الصحية (وزارة الصحة، وزارة البيئة والمياه والزراعة)
• العمالة والتوطين (وزارة الموارد البشرية، نظام نطاقات، منصة قوى)
• الضرائب والزكاة (ZATCA) والفاتورة الإلكترونية (فاتورة)
• التأمينات الاجتماعية (GOSI)
• اشتراطات الدفاع المدني والسلامة
• اشتراطات هيئة الغذاء والدواء (SFDA)
• التصاريح البيئية لو لزم
• شروط أهلية صاحب المشروع (هوية، إقامة، جنسية، عمر)
• المقارنة بين أنواع المنشآت (مطعم vs كافيه، فرق الاشتراطات)

════════════════════════════════════════
 قاعدة الرد:
════════════════════════════════════════
أجب على السؤال مباشرة وبدون مقدمات حوارية. كن مختصراً ومنظّماً.
• "هل أقدر أفعل X؟" → نعم أو لا + سبب مختصر + المصدر
• "كيف أفعل X؟" → اشرح الخطوات بترتيب
• "كم تكلفة X؟" → الرقم أو النطاق + المصدر
• "ما الفرق بين X وY؟" → قارن من ناحية الإجراءات الحكومية فقط

════════════════════════════════════════
 هيكل الرد عند الشرح الكامل (نص عادي بدون أي Markdown):
════════════════════════════════════════
اسم الإجراء:
الجهة المسؤولة: [اسم الجهة]
الخطوات:
1. [الخطوة الأولى]
2. [الخطوة الثانية]
3. [الخطوة الثالثة]
المتطلبات:
- [المستند الأول]
- [المستند الثاني]
التكلفة التقريبية: [إن توفرت]
المدة التقريبية: [إن توفرت]
المصدر: [اسم الموقع الرسمي والرابط]

════════════════════════════════════════
🔗 المصادر الرسمية:
════════════════════════════════════════
• وزارة التجارة: mc.gov.sa
• منصة أعمال: eservices.mc.gov.sa
• بلدي: balady.gov.sa
• أمانة الرياض: arriyadh.gov.sa
• أمانة جدة: jedda.gov.sa
• وزارة الموارد البشرية: hrsd.gov.sa
• منصة قوى: qiwa.sa
• منصة مساند: musaned.com.sa
• هيئة الزكاة والضريبة: zatca.gov.sa
• منصة فاتورة: fatoora.zatca.gov.sa
• GOSI: gosi.gov.sa
• هيئة الغذاء والدواء: sfda.gov.sa
• الدفاع المدني: cd.gov.sa

════════════════════════════════════════
⛔ متى ترفض وكيف (مهم جداً — لا تجامل):
════════════════════════════════════════

الحالة الأولى — سؤال عن المشروع نفسه، فكرته، ربحيته، أو سوقه (خارج نطاق الإجراءات الحكومية)
مثل: فكرة مشروع، الربحية، التسويق، الديكور، المنافسين، الجدوى الاقتصادية، رأي في مشروع:
→ رد بهذا النص بالضبط (بدون أي إضافات أو ترحيب):
""" + (
    '"This question is outside my scope. Please use the AI Advisor from the home page."'
    if is_en else
    '"هذا السؤال خارج نطاقي. يرجى استخدام المستشار الذكي من الصفحة الرئيسية."'
) + """

الحالة الثانية — سؤال لا علاقة له بالأعمال أو الإجراءات الحكومية نهائيًا
مثل: أسئلة علمية، طبية، ترفيهية، شخصية، حيوانات، طقس، أو موضوع عشوائي:
→ رد بهذا النص بالضبط (بدون إضافات):
""" + (
    '"This question is outside Muqaddim\'s scope. We specialize in feasibility studies and government procedures for restaurants and cafes."'
    if is_en else
    '"هذا السؤال خارج نطاق منصة مُقدِّم. تخصصنا في دراسات الجدوى والإجراءات الحكومية لقطاع المطاعم والمقاهي."'
) + """

⚠️ في الحالتين السابقتين، لا تضيف أي شيء قبل أو بعد الرد المحدد.

════════════════════════════════════════
 قواعد عامة:
════════════════════════════════════════
• لا تخترع إجراءات أو روابط أو أرقام
• إذا لم تكن متأكدًا → نبّه المستخدم ليتحقق من الموقع الرسمي
• اللغة: التزم بقاعدة اللغة في أعلى البرومبت
• ذكر المصدر الرسمي والرابط في نهاية كل رد إلزامي
• الأسلوب رسمي مهني — لا تستخدم تعبيرات حوارية شخصية
• قبل إرسال الرد، افحصه: تأكد إنه لا يحتوي على ** أو ## أو * أو __ أو ` أو > أو ---"""
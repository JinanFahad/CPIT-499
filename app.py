# =====================================================================
# app.py — السيرفر الرئيسي لمنصة "مُقدِّم"
# هذا الملف يربط كل أجزاء النظام:
#   - يستقبل الطلبات من الفرونت اند (React)
#   - ينادي محركات الذكاء الاصطناعي والحسابات المالية
#   - يولّد ملفات PDF و PowerPoint
#   - يحفظ ويسترجع البيانات من قاعدة البيانات
# =====================================================================

from flask import Flask, request, jsonify, render_template, make_response, send_file, after_this_request
import os
import uuid
import json
import requests
from dotenv import load_dotenv
from openai import OpenAI

# نحمّل متغيرات البيئة من .env قبل أي استيراد يحتاجها (OpenAI, SMTP, ...)
# override=True يضمن إن القيم في .env تطغى على أي قيم قديمة في ذاكرة النظام
load_dotenv(override=True)

# ── محركات توليد التقارير والعروض ──
from pdf_generator import build_feasibility_pdf          # يحوّل التقرير إلى ملف PDF احترافي
from ai_pitch_engine import generate_pitch_deck_json      # يولّد محتوى العرض التقديمي بالـ AI
from ppt_builder import build_pptx                        # يحوّل JSON إلى ملف PowerPoint
from email_sender import send_file_via_email              # إرسال الملفات للمستخدم على إيميله

# ── محركات الحساب والقرار ──
from financial_engine import calculate_financials         # حسابات الإيراد، المصاريف، هامش الربح
from decision_engine import classify_project              # يصنّف المشروع: مناسب / متوسط / مخاطرة عالية

# ── محركات الذكاء الاصطناعي ──
from ai_report_engine import generate_feasibility_report, enrich_project_data
from market_ai import build_competitor_summary, generate_market_analysis_ar
from gov_consultant import gov_chat, clear_gov_session, get_gov_suggestions

# ── إعدادات وثوابت ──
from business_types import BUSINESS_TYPES, get_google_type, get_label_ar, get_label, is_valid_type
from saudi_assumptions import DEFAULT_SALARY
from validators import validate_feasibility_input

# ── قاعدة البيانات (SQLite) ──
from database import (
    init_db, save_report, get_all_reports, get_report_by_id, delete_report, update_report,
    save_project, get_projects_by_user, get_project_by_id, update_project, delete_project,
)

app = Flask(__name__)

# تفعيل CORS عشان الفرونت اند (بورت 5173) يقدر يتواصل مع الباك اند (بورت 5000)
# expose_headers ضروري عشان المتصفح يسمح للفرونت يقرأ هيدر X-Report-Id
from flask_cors import CORS
CORS(app, expose_headers=["X-Report-Id"])

# مفتاح Google API (للخرائط وقوقل بلايسز)
GOOGLE_API_KEY = "AIzaSyCMVLHJiz-3hOnp-oOPPE2r72fjKwf6xcQ"

# عميل OpenAI (يقرأ المفتاح تلقائياً من متغير البيئة OPENAI_API_KEY)
client = OpenAI()

# إنشاء جداول قاعدة البيانات لو ما كانت موجودة
init_db()


# =====================================================================
# نقطة فحص بسيطة — للتأكد إن السيرفر شغّال
# =====================================================================
@app.get("/")
def home():
    return "Muqaddim Backend Running"


@app.get("/advisor")
def advisor_page():
    return render_template("advisor.html")


# =====================================================================
# توليد تقرير دراسة الجدوى (PDF)
# هذا أهم endpoint في النظام — يستقبل بيانات المشروع ويولّد PDF كامل
# الخطوات:
#   1) يتحقق من نوع المشروع
#   2) يستخرج بيانات إضافية بالـ AI (target_customers, value_proposition)
#   3) يحسب الأرقام المالية
#   4) يصنّف المشروع (قابل للاستثمار أو لا)
#   5) إذا فيه إحداثيات → يستدعي قوقل بلايسز للمنافسين الحقيقيين
#   6) يولّد التقرير الكامل بالـ AI
#   7) يحفظ التقرير في قاعدة البيانات
#   8) يحوّل التقرير إلى ملف PDF ويرجعه
# =====================================================================
@app.post("/api/feasibility/report-pdf")
def report_pdf():
    data = request.get_json() or {}

    # ── فاليديشن المدخلات (Defense in Depth) ──
    # نتحقق حتى لو الفرونت يفلتر، عشان نحمي من Postman/scripts خارجية
    is_valid, error_msg = validate_feasibility_input(data)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    # ── البيانات الأساسية اللي يدخلها المستخدم ──
    business_type     = data.get("business_type", "restaurant")
    city              = data.get("city", "غير محدد")
    capital           = data.get("capital", 100000)
    rent              = data.get("rent", 5000)
    employees         = data.get("employees", 3)
    avg_price         = data.get("avg_price", 30)
    customers_per_day = data.get("customers_per_day", 50)
    lat               = data.get("lat")
    lng               = data.get("lng")

    # لغة التقرير: "ar" (افتراضي) أو "en" — تأتي من الفرونت بناءً على اختيار المستخدم
    language = (data.get("language") or "ar").lower()
    if language not in ("ar", "en"):
        language = "ar"

    # التحقق من إن نوع المشروع مدعوم
    if not is_valid_type(business_type):
        return jsonify({
            "error": "نوع المشروع غير مدعوم",
            "supported_types": list(BUSINESS_TYPES.keys())
        }), 400

    # AI يولّد بيانات إضافية تلقائياً (العملاء المستهدفون + عرض القيمة)
    enriched = enrich_project_data(business_type, city, language=language)

    # تخصص المطعم (اختياري) — مثل: "كافيه قهوة مختصة"، "مطعم برجر فاخر"
    restaurant_type = (data.get("restaurant_type") or "").strip()
    project_type_for_market = restaurant_type or get_label(business_type, language)

    # المستخدم يقدر يكتب جمهوره المستهدف بنفسه (يطغى على الـ AI)
    user_target_customers = (data.get("target_customers") or "").strip()
    main_products = data.get("main_products") or []

    full_data = {
        "business_type": business_type,
        "restaurant_type": restaurant_type,
        "city": city,
        "capital": capital,
        "rent": rent,
        "employees": employees,
        "avg_price": avg_price,
        "customers_per_day": customers_per_day,
        "avg_salary": DEFAULT_SALARY,
        "cogs_known": False,
        "target_customers": user_target_customers or enriched["target_customers"],
        "value_proposition": enriched["value_proposition"],
        "main_products": main_products,
        "competitors": [],
        "market_notes": "",
        "pricing_notes": "",
    }

    financials = calculate_financials(full_data, language=language)

    decision = classify_project(
        profit_margin_percent=financials["profit_margin_percent"],
        payback_months=financials["payback_period_months"],
        success_prediction=financials.get("success_prediction"),  # تصنيف موحّد مع تنبؤ النجاح
        language=language,
    )

    market_data = {
        "business_type": get_label(business_type, language),
        "restaurant_type": restaurant_type,
        "city": city,
        "target_customers": full_data["target_customers"],
        "value_proposition": full_data["value_proposition"],
        "main_products": main_products,
        "competitors": [],
        "market_notes": "",
        "pricing_notes": "",
    }

    report = generate_feasibility_report(financials, decision, market_data, language=language)


    # ── تحليل السوق عبر قوقل بلايسز (اختياري — فقط لو المستخدم حدد موقع) ──
    market_analysis   = None  # تحليل ذكاء اصطناعي للمنافسين
    competitor_places = []    # قائمة المطاعم المجاورة الحقيقية

    if lat and lng:
        try:
            # جلب المطاعم المجاورة من قوقل بلايسز في نطاق ١٥٠٠ متر
            places_res = requests.post(
                "https://places.googleapis.com/v1/places:searchNearby",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_API_KEY,
                    "X-Goog-FieldMask": (
                        "places.id,places.displayName,places.rating,"
                        "places.userRatingCount,places.formattedAddress,"
                        "places.types,places.primaryType,places.primaryTypeDisplayName"
                    ),
                },
                json={
                    "includedTypes": [get_google_type(business_type)],
                    "maxResultCount": 20,
                    "locationRestriction": {
                        "circle": {
                            "center": {"latitude": float(lat), "longitude": float(lng)},
                            "radius": 1500,
                        }
                    },
                },
            ).json()

            places = places_res.get("places", [])
            if places:
                summary           = build_competitor_summary(places)
                market_analysis = generate_market_analysis_ar(
    project_type_for_market,
    city,
    1500,
    summary,
    language=language,
)
                competitor_places = summary["all_competitors"]

        except Exception as e:
            print(f"[market analysis skipped] {e}")

    # ── دمج بيانات قوقل بلايسز الحقيقية مع التقرير قبل الحفظ ──
    # عشان عارض التقرير الداخلي (داخل التطبيق) يقدر يعرض المنافسين الحقيقيين.
    # بدون هذا الدمج، التقرير المحفوظ ما يحتوي إلا على تحليل AI نظري بدون أرقام واقعية.
    if market_analysis:
        existing_ma = report.get("market_analysis", {}) or {}
        report["market_analysis"] = {
            **existing_ma,
            **market_analysis,
        }
    if competitor_places:
        report["competitor_places"] = competitor_places

    report_id = save_report(report)

    pdf_bytes = build_feasibility_pdf(
        report=report,
        market_analysis=market_analysis,
        competitor_places=competitor_places,
        language=language,
    )

    # رجّع الـ PDF كاستجابة + رقم التقرير في الهيدر (الفرونت يربطه بالمشروع)
    resp = make_response(pdf_bytes)
    resp.headers["Content-Type"] = "application/pdf"
    resp.headers["Content-Disposition"] = 'attachment; filename="feasibility_report.pdf"'
    resp.headers["X-Report-Id"] = str(report_id)
    return resp


# =====================================================================
# إرسال دراسة الجدوى للمستخدم على الإيميل
# يأخذ report_id لتقرير محفوظ، يبني الـ PDF، ويرسله مرفقاً بالإيميل
# =====================================================================
@app.post("/api/feasibility/email")
def feasibility_email():
    import tempfile
    from report_translator import get_or_create_translation

    data       = request.get_json(silent=True) or {}
    report_id  = data.get("report_id")
    email      = (data.get("email") or "").strip()
    language   = (data.get("language") or "ar").lower()
    if language not in ("ar", "en"):
        language = "ar"
    is_en      = language == "en"
    # اسم المشروع الافتراضي على حسب اللغة (لو ما جاي من الفرونت)
    project_nm = data.get("project_name") or ("Your Project" if is_en else "مشروعك")

    if not report_id:
        return jsonify({"error": "report_id required" if is_en else "report_id مطلوب"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "Invalid email" if is_en else "إيميل غير صالح"}), 400

    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "Report not found" if is_en else "الدراسة غير موجودة"}), 404

    # لو المستخدم يبغى الإيميل بالإنجليزي، نأخذ النسخة المترجمة من التقرير
    if is_en:
        report, _ = get_or_create_translation(report, "en")

    # نبني الـ PDF بنفس لغة المستخدم
    pdf_bytes = build_feasibility_pdf(
        report=report,
        market_analysis=report.get("market_analysis"),
        competitor_places=report.get("competitor_places", []),
        language=language,
    )

    # نحفظ الـ PDF كملف مؤقت ثم نرسله ونحذفه
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        tmp.write(pdf_bytes)
        tmp.close()
        if is_en:
            subject = f"Feasibility Report — {project_nm} | Muqaddim"
            body    = f'Attached is the feasibility report for "{project_nm}".\n\nMuqaddim'
        else:
            subject = f"دراسة الجدوى — {project_nm} | منصة مُقدِّم"
            body    = f'مرفقة دراسة الجدوى لمشروع "{project_nm}".\n\nمنصة مُقدِّم'

        send_file_via_email(
            to_email=email,
            subject=subject,
            body=body,
            file_path=tmp.name,
            attachment_name=f"{project_nm}_feasibility.pdf",
            project_name=project_nm,
            file_kind_ar="دراسة الجدوى",
            file_kind_en="Feasibility Report",
            language=language,
        )
        return jsonify({"ok": True, "sent_to": email})
    except EnvironmentError as e:
        msg = f"SMTP configuration missing: {e}" if is_en else f"إعداد SMTP ناقص: {e}"
        return jsonify({"error": msg}), 500
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            os.remove(tmp.name)
        except OSError:
            pass


# =====================================================================
# إدارة دراسات الجدوى المحفوظة (تقارير)
# =====================================================================
@app.get("/api/reports")
def list_reports():
    """قائمة بكل التقارير (للوحة الإدارة مثلاً)"""
    return jsonify(get_all_reports())


@app.get("/api/reports/<int:report_id>")
def get_report(report_id):
    """تقرير محدد بالكامل (يستخدمه عارض التقرير الداخلي + المستشار)"""
    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "الدراسة غير موجودة"}), 404
    return jsonify(report)


@app.post("/api/reports/<int:report_id>/translate")
def translate_report_endpoint(report_id):
    """يترجم محتوى التقرير الحرّ إلى اللغة المطلوبة (ar/en) ويخزّن النتيجة في الكاش.

    Body: {"to": "en"} أو {"to": "ar"}
    Response: التقرير بنسخته المترجمة (جاهز للعرض).
    """
    from report_translator import get_or_create_translation

    data = request.get_json(silent=True) or {}
    target = (data.get("to") or "").lower()
    if target not in ("ar", "en"):
        return jsonify({"error": "Invalid target language (use 'ar' or 'en')"}), 400

    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    translated, was_newly_translated = get_or_create_translation(report, target)

    # إذا تمت ترجمة جديدة، نحدّث الـ DB بحيث الكاش يبقى محفوظاً
    if was_newly_translated:
        update_report(report_id, report)  # report.get("_translations") تم تحديثه داخل الدالة

    return jsonify(translated)


@app.delete("/api/reports/<int:report_id>")
def remove_report(report_id):
    """حذف تقرير"""
    deleted = delete_report(report_id)
    if not deleted:
        return jsonify({"error": "الدراسة غير موجودة"}), 404
    return jsonify({"ok": True, "deleted_id": report_id})


# =====================================================================
# المستشار الذكي — شات يجاوب على دراسة جدوى محددة
# الـ AI يستلم التقرير كامل + سؤال المستخدم + سجل المحادثة، ويجاوب بناءً عليهم
# =====================================================================
@app.post("/api/advisor/chat")
def advisor_chat():
    data      = request.get_json() or {}
    report_id = data.get("report_id")          # رقم الدراسة اللي يبغى يسأل عنها
    message   = data.get("message", "").strip()  # سؤال المستخدم
    history   = data.get("history", [])          # المحادثات السابقة عشان الـ AI يفهم السياق

    if not message:
        return jsonify({"error": "message مطلوب"}), 400
    if not report_id:
        return jsonify({"error": "report_id مطلوب"}), 400

    # نجيب الدراسة من قاعدة البيانات ونرسلها كاملة للـ AI كـ system prompt
    report = get_report_by_id(int(report_id))
    if not report:
        return jsonify({"error": "الدراسة غير موجودة"}), 404

    # برومبت يحدد شخصية المستشار وقواعده
    system_prompt = f"""
أنت "المستشار الذكي" — مستشار تجاري متخصص حصرًا في تحليل دراسات الجدوى للمشاريع الصغيرة والمتوسطة في السعودية.

════════════════════════════════════════
🎯 نطاق عملك الحصري:
════════════════════════════════════════
تساعد صاحب المشروع يفهم دراسة الجدوى المرفقة ويتخذ قرارات بناءً عليها فقط.
يشمل ذلك:
• شرح أرقام الدراسة (الإيراد، المصاريف، هامش الربح، فترة الاسترداد)
• تحليل المخاطر والفرص المذكورة في الدراسة
• مقارنة سيناريوهات تشغيلية (تخفيض تكاليف، رفع أسعار، تعديل عدد موظفين)
• توضيح خطوات التحسين المقترحة في الدراسة
• الإجابة عن استفسارات عامة في إدارة المشاريع الصغيرة (تسويق، تسعير، عمليات) إذا كانت ذات صلة مباشرة بمشروع صاحبك

دراسة الجدوى الخاصة بمشروع صاحبك:
{json.dumps(report, ensure_ascii=False, indent=2)}

════════════════════════════════════════
📝 قواعد الرد:
════════════════════════════════════════
• اشرح بلغة بسيطة وواضحة
• استند على أرقام دراسة الجدوى دائماً
• ركّز على الفائدة العملية لصاحب المشروع
• لا تكرر نفس المعلومات في كل رد
• اللغة: لو السؤال بالعربي → رد بالعربي. لو السؤال بالإنجليزي → رد بالإنجليزي.

════════════════════════════════════════
⛔ متى ترفض وكيف (مهم جداً):
════════════════════════════════════════

الحالة الأولى — سؤال عن الإجراءات الحكومية أو التراخيص أو السجلات
(مثل: السجل التجاري، رخص البلدية، رخص الصحة، التأمينات الاجتماعية، ZATCA، نطاقات، GOSI، أي تعامل حكومي):
→ رد بالضبط (إذا السؤال بالعربي):
"هذا السؤال خارج نطاقي. يرجى استخدام مساعد الإجراءات الحكومية من الصفحة الرئيسية."

→ رد بالضبط (إذا السؤال بالإنجليزي):
"This question is outside my scope. Please use the Government Procedures Assistant from the home page."

الحالة الثانية — سؤال لا علاقة له بدراسة الجدوى أو إدارة المشاريع نهائيًا
(مثل: أسئلة علمية، طبية، تاريخية، ترفيهية، حيوانات، طقس، شخصية، رياضية، أو أي موضوع عشوائي):
→ رد بالضبط (إذا السؤال بالعربي):
"هذا السؤال خارج نطاق منصة مُقدِّم. تخصصي في تحليل دراسة جدوى مشروعك فقط."

→ رد بالضبط (إذا السؤال بالإنجليزي):
"This question is outside Muqaddim's scope. I'm specialized in analyzing your project's feasibility study only."

⚠️ لا تجاوب على السؤال في الحالتين السابقتين أبداً، حتى لو كنت تعرف الإجابة.
"""

    # نبني سلسلة الرسائل: system prompt + المحادثات السابقة + السؤال الجديد
    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    # نرسل للـ AI ونطلب رد (نموذج gpt-4o-mini أرخص ومناسب للشات)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=800,
    )

    reply = response.choices[0].message.content

    # نرجع الرد + المحادثة الكاملة المحدّثة (الفرونت يحتفظ فيها للسؤال الجاي)
    return jsonify({
        "reply": reply,
        "history": history + [
            {"role": "user",      "content": message},
            {"role": "assistant", "content": reply},
        ]
    })


# =====================================================================
# توليد العرض التقديمي (Pitch Deck) كملف PowerPoint
# نفس فكرة دراسة الجدوى لكن المخرج .pptx بدل .pdf
# =====================================================================
@app.post("/api/pitchdeck/generate")
def pitchdeck_generate():
    try:
        data = request.get_json(silent=True) or {}
        if not data:
            return jsonify({"error": "Invalid or missing JSON body"}), 400

        business_type = data.get("business_type", "restaurant")
        if not is_valid_type(business_type):
            return jsonify({
                "error": "نوع المشروع غير مدعوم",
                "supported_types": list(BUSINESS_TYPES.keys())
            }), 400

        enriched = enrich_project_data(business_type, data.get("city", "غير محدد"))
        full_data = {**data,
            "avg_salary":        DEFAULT_SALARY,
            "cogs_known":        False,
            "target_customers":  enriched["target_customers"],
            "value_proposition": enriched["value_proposition"],
        }

        financials = calculate_financials(full_data)
        decision = classify_project(
            profit_margin_percent=financials["profit_margin_percent"],
            payback_months=financials["payback_period_months"],
            success_prediction=financials.get("success_prediction"),  # تصنيف موحّد
        )
        market_data = {
            "business_type":     get_label_ar(business_type),
            "city":              data.get("city", ""),
            "target_customers":  enriched["target_customers"],
            "value_proposition": enriched["value_proposition"],
            "competitors":       data.get("competitors", []),
            "market_notes":      data.get("market_notes", ""),
            "pricing_notes":     data.get("pricing_notes", ""),
        }

        # report = generate_feasibility_report(financials, decision, market_data)
        # deck   = generate_pitch_deck_json(report, extra=market_data)
        
        report = generate_feasibility_report(financials, decision, market_data)
        deck = generate_pitch_deck_json(
            {**report, **financials},
            extra={
                **market_data,
                "project_name":      data.get("project_name", ""),
                "idea_description":  data.get("idea_description", ""),
                "restaurant_type":   data.get("restaurant_type", ""),
                "city":              data.get("city", ""),
                "capital":           data.get("capital", ""),
                "avg_price":         data.get("avg_price", ""),
                "customers_per_day": data.get("customers_per_day", ""),
                "employees":         data.get("employees", ""),
            }
        )
        if isinstance(deck, str):
            deck = json.loads(deck)
        if "slides" not in deck:
            return jsonify({"error": "Deck JSON missing 'slides'"}), 500

        # نحفظ الملف المولّد في مجلد generated/ باسم عشوائي (UUID) عشان كل مستخدم يحصل ملفه الخاص
        os.makedirs("generated", exist_ok=True)
        filename = f"pitch_{uuid.uuid4().hex}.pptx"
        out_path = os.path.join("generated", filename)
        build_pptx(deck, out_path)

        # لو الطلب فيه project_id من صفحة Pitch Deck → نعلّم المشروع كأن البتش دك تولّد فيه.
        # هذا يفعّل أزرار التحميل/الإرسال في صفحة "مشاريعي" — الأزرار تظل معطّلة لين المستخدم
        # يدخل صفحة Pitch Deck ويولّد على الأقل مرة واحدة.
        project_id = data.get("project_id")
        if project_id:
            try:
                from database import mark_pitch_deck_generated
                mark_pitch_deck_generated(int(project_id))
            except (ValueError, TypeError):
                pass  # project_id غير صالح — نتجاهل بدون فشل التحميل

        # نحذف الملف بعد إرساله عشان مجلد generated/ ما يتراكم
        @after_this_request
        def _cleanup(response):
            try:
                os.remove(out_path)
            except OSError:
                pass
            return response

        return send_file(
            out_path,
            as_attachment=True,
            download_name="Muqaddim_Pitch_Deck.pptx",
            mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =====================================================================
# إرسال العرض التقديمي للمستخدم على الإيميل
# نفس بيانات /api/pitchdeck/generate لكن بدلاً من تنزيل، يُرسل بالإيميل
# =====================================================================
@app.post("/api/pitchdeck/email")
def pitchdeck_email():
    import tempfile
    try:
        data     = request.get_json(silent=True) or {}
        email    = (data.get("email") or "").strip()
        language = (data.get("language") or "ar").lower()
        if language not in ("ar", "en"):
            language = "ar"
        is_en = language == "en"

        if not email or "@" not in email:
            return jsonify({"error": "Invalid email" if is_en else "إيميل غير صالح"}), 400

        business_type = data.get("business_type", "restaurant")
        if not is_valid_type(business_type):
            return jsonify({"error": "Unsupported business type" if is_en else "نوع المشروع غير مدعوم"}), 400

        enriched = enrich_project_data(business_type, data.get("city", "غير محدد"))
        full_data = {**data,
            "avg_salary":        DEFAULT_SALARY,
            "cogs_known":        False,
            "target_customers":  enriched["target_customers"],
            "value_proposition": enriched["value_proposition"],
        }

        financials = calculate_financials(full_data)
        decision = classify_project(
            profit_margin_percent=financials["profit_margin_percent"],
            payback_months=financials["payback_period_months"],
            success_prediction=financials.get("success_prediction"),
        )
        market_data = {
            "business_type":     get_label_ar(business_type),
            "city":              data.get("city", ""),
            "target_customers":  enriched["target_customers"],
            "value_proposition": enriched["value_proposition"],
            "competitors":       data.get("competitors", []),
            "market_notes":      data.get("market_notes", ""),
            "pricing_notes":     data.get("pricing_notes", ""),
        }
        report = generate_feasibility_report(financials, decision, market_data)
        deck = generate_pitch_deck_json(
            {**report, **financials},
            extra={
                **market_data,
                "project_name":      data.get("project_name", ""),
                "idea_description":  data.get("idea_description", ""),
                "restaurant_type":   data.get("restaurant_type", ""),
                "city":              data.get("city", ""),
                "capital":           data.get("capital", ""),
                "avg_price":         data.get("avg_price", ""),
                "customers_per_day": data.get("customers_per_day", ""),
                "employees":         data.get("employees", ""),
            }
        )
        if isinstance(deck, str):
            deck = json.loads(deck)
        if "slides" not in deck:
            return jsonify({"error": "Deck JSON missing 'slides'"}), 500

        project_nm = data.get("project_name") or ("Your Project" if is_en else "مشروعك")
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pptx")
        tmp.close()
        try:
            build_pptx(deck, tmp.name)
            if is_en:
                subject = f"Pitch Deck — {project_nm} | Muqaddim"
                body    = f'Attached is the pitch deck for "{project_nm}".\n\nMuqaddim'
            else:
                subject = f"العرض التقديمي — {project_nm} | منصة مُقدِّم"
                body    = f'مرفق العرض التقديمي لمشروع "{project_nm}".\n\nمنصة مُقدِّم'

            send_file_via_email(
                to_email=email,
                subject=subject,
                body=body,
                file_path=tmp.name,
                attachment_name=f"{project_nm}_pitch_deck.pptx",
                project_name=project_nm,
                file_kind_ar="العرض التقديمي",
                file_kind_en="Pitch Deck",
                language=language,
            )
            return jsonify({"ok": True, "sent_to": email})
        finally:
            try:
                os.remove(tmp.name)
            except OSError:
                pass

    except EnvironmentError as e:
        msg = f"SMTP configuration missing: {e}" if is_en else f"إعداد SMTP ناقص: {e}"
        return jsonify({"error": msg}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =====================================================================
# اختيار الموقع على الخريطة
# =====================================================================
@app.post("/api/location/pick")
def location_pick():
    """نقطة وسيطة بسيطة للتحقق من الإحداثيات"""
    data = request.get_json(silent=True) or {}
    lat  = data.get("lat")
    lng  = data.get("lng")
    if lat is None or lng is None:
        return jsonify({"error": "lat/lng required"}), 400
    return jsonify({"ok": True, "latitude": float(lat), "longitude": float(lng)})


@app.get("/pick-location")
def pick_location_page():
    """يعرض صفحة الخريطة (templates/map.html) — قديمة، الفرونت اند الجديد يستخدم MapPicker"""
    return render_template("map.html")


# =====================================================================
# تحليل السوق المستقل (بدون حفظ مشروع)
# يستخدمه فيتشر "تحليل السوق" في الفرونت اند
# يستدعي قوقل بلايسز + يحلل المنافسين بالذكاء الاصطناعي
# =====================================================================
@app.get("/analyze")
def analyze():
    lat           = request.args.get("lat")
    lng           = request.args.get("lng")
    business_type = (request.args.get("type") or "restaurant").strip()
    city          = request.args.get("city", "غير محدد")
    radius        = request.args.get("radius", "1500")

    if not lat or not lng:
        return jsonify({"error": "lat and lng required"}), 400
    if not is_valid_type(business_type):
        return jsonify({
            "error": "نوع المشروع غير مدعوم",
            "supported_types": list(BUSINESS_TYPES.keys())
        }), 400

    try:
        lat_f, lng_f, radius_f = float(lat), float(lng), float(radius)
    except ValueError:
        return jsonify({"error": "lat/lng/radius must be numbers"}), 400

    # نطلب من قوقل بلايسز قائمة المطاعم في النطاق المحدد
    res = requests.post(
        "https://places.googleapis.com/v1/places:searchNearby",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": (
                "places.id,places.displayName,places.rating,"
                "places.userRatingCount,places.formattedAddress,"
                "places.types,places.primaryType,places.primaryTypeDisplayName"
            ),
        },
        json={
            "includedTypes": [get_google_type(business_type)],
            "maxResultCount": 20,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": lat_f, "longitude": lng_f},
                    "radius": radius_f,
                }
            },
        },
    ).json()

    if "error" in res:
        return jsonify(res), 400

    # نلخص المنافسين (تقييم متوسط، أقوى منافس، إلخ) ثم نمرّرهم للـ AI للتحليل العميق
    places      = res.get("places", [])
    summary     = build_competitor_summary(places)
    restaurant_type = (request.args.get("restaurant_type") or "").strip()
    project_type_for_market = restaurant_type or get_label_ar(business_type)

    ai_analysis = generate_market_analysis_ar(
    project_type_for_market,
    city,
    radius_f,
    summary
)

    return jsonify({
        "input": {
            "lat": lat_f, "lng": lng_f,
            "type": business_type,
            "label": get_label_ar(business_type),
            "radius": radius_f,
        },
        "places_found": len(places),
        "summary":      summary,
        "ai_analysis":  ai_analysis,
    })


# =====================================================================
# شات الإجراءات الحكومية
# AI متخصص في التراخيص والإجراءات للمطاعم/الكافيهات في السعودية
# يحفظ سياق المحادثة في الذاكرة (session_id يميّز كل مستخدم)
# =====================================================================
@app.get("/government")
def government_page():
    """صفحة قديمة (الفرونت اند الجديد يستخدم GovernmentProceduresPage)"""
    return render_template("government.html")


@app.post("/api/government/chat")
def government_chat():
    """يستلم سؤال + session_id ويرد عبر الـ AI المتخصص"""
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    message = data.get("message", "").strip()
    if not session_id:
        return jsonify({"error": "session_id مطلوب"}), 400
    if not message:
        return jsonify({"error": "الرسالة فارغة"}), 400
    try:
        reply = gov_chat(session_id, message)
        return jsonify({"reply": reply})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.get("/api/government/suggestions")
def government_suggestions():
    """قائمة بالأسئلة المقترحة المعروضة للمستخدم"""
    return jsonify({"suggestions": get_gov_suggestions()})


@app.post("/api/government/clear")
def government_clear():
    """مسح المحادثة (يستخدم عند تسجيل الخروج مثلاً)"""
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    if session_id:
        clear_gov_session(session_id)
    return jsonify({"ok": True})



# =====================================================================
# إدارة مشاريع المستخدم (CRUD)
# user_id يجي من Firebase (UID) — كل مستخدم يشوف مشاريعه فقط
# =====================================================================
@app.post("/api/projects")
def create_project():
    """إنشاء مشروع جديد بعد توليد دراسة الجدوى"""
    data = request.get_json() or {}
    user_id = data.get("user_id", "")
    if not user_id:
        return jsonify({"error": "user_id مطلوب"}), 400
    project_id = save_project(data)
    return jsonify({"id": project_id, "ok": True})


@app.get("/api/projects")
def list_projects():
    """قائمة مشاريع مستخدم محدد (للـ dashboard وصفحة مشاريعي)"""
    user_id = request.args.get("user_id", "")
    if not user_id:
        return jsonify({"error": "user_id مطلوب"}), 400
    return jsonify(get_projects_by_user(user_id))


@app.get("/api/projects/<int:project_id>")
def get_project(project_id):
    """مشروع واحد بالتفصيل (يستخدمه EditProjectPage و ConsultantChatPage)"""
    project = get_project_by_id(project_id)
    if not project:
        return jsonify({"error": "المشروع غير موجود"}), 404
    return jsonify(project)


@app.put("/api/projects/<int:project_id>")
def edit_project(project_id):
    """تحديث بيانات مشروع + ربطه بدراسة جديدة بعد إعادة التوليد"""
    data = request.get_json() or {}
    updated = update_project(project_id, data)
    if not updated:
        return jsonify({"error": "المشروع غير موجود"}), 404
    return jsonify({"ok": True})


@app.delete("/api/projects/<int:project_id>")
def remove_project_route(project_id):
    """حذف مشروع"""
    deleted = delete_project(project_id)
    if not deleted:
        return jsonify({"error": "المشروع غير موجود"}), 404
    return jsonify({"ok": True, "deleted_id": project_id})


# =====================================================================
# نقطة بدء التشغيل (development server فقط، للـ production استخدمي gunicorn)
# =====================================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
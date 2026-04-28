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
load_dotenv()

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
from business_types import BUSINESS_TYPES, get_google_type, get_label_ar, is_valid_type
from saudi_assumptions import DEFAULT_SALARY

# ── قاعدة البيانات (SQLite) ──
from database import (
    init_db, save_report, get_all_reports, get_report_by_id, delete_report,
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

    # التحقق من إن نوع المشروع مدعوم
    if not is_valid_type(business_type):
        return jsonify({
            "error": "نوع المشروع غير مدعوم",
            "supported_types": list(BUSINESS_TYPES.keys())
        }), 400

    # AI يولّد بيانات إضافية تلقائياً (العملاء المستهدفون + عرض القيمة)
    enriched = enrich_project_data(business_type, city)

    # تخصص المطعم (اختياري) — مثل: "كافيه قهوة مختصة"، "مطعم برجر فاخر"
    restaurant_type = (data.get("restaurant_type") or "").strip()
    project_type_for_market = restaurant_type or get_label_ar(business_type)

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

    financials = calculate_financials(full_data)

    decision = classify_project(
        profit_margin_percent=financials["profit_margin_percent"],
        payback_months=financials["payback_period_months"],
        success_prediction=financials.get("success_prediction"),  # تصنيف موحّد مع تنبؤ النجاح
    )

    market_data = {
        "business_type": get_label_ar(business_type),
        "restaurant_type": restaurant_type,
        "city": city,
        "target_customers": full_data["target_customers"],
        "value_proposition": full_data["value_proposition"],
        "main_products": main_products,
        "competitors": [],
        "market_notes": "",
        "pricing_notes": "",
    }

    report = generate_feasibility_report(financials, decision, market_data)
    

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
    summary
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
    data       = request.get_json(silent=True) or {}
    report_id  = data.get("report_id")
    email      = (data.get("email") or "").strip()
    project_nm = data.get("project_name") or "مشروعك"

    if not report_id:
        return jsonify({"error": "report_id مطلوب"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "إيميل غير صالح"}), 400

    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "الدراسة غير موجودة"}), 404

    # نبني الـ PDF من بيانات التقرير المحفوظة (market_analysis + competitors مدمجة فيه أصلاً)
    pdf_bytes = build_feasibility_pdf(
        report=report,
        market_analysis=report.get("market_analysis"),
        competitor_places=report.get("competitor_places", []),
    )

    # نحفظ الـ PDF كملف مؤقت ثم نرسله ونحذفه
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        tmp.write(pdf_bytes)
        tmp.close()
        send_file_via_email(
            to_email=email,
            subject=f"دراسة الجدوى — {project_nm} | منصة مُقدِّم",
            body=f"مرفقة دراسة الجدوى لمشروع \"{project_nm}\".\n\nمنصة مُقدِّم",
            file_path=tmp.name,
            attachment_name=f"{project_nm}_feasibility.pdf",
            project_name=project_nm,
            file_kind_ar="دراسة الجدوى",
        )
        return jsonify({"ok": True, "sent_to": email})
    except EnvironmentError as e:
        return jsonify({"error": f"إعداد SMTP ناقص: {e}"}), 500
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
أنت مستشار تجاري متخصص في المشاريع الصغيرة والمتوسطة في السعودية.
لديك دراسة جدوى كاملة لمشروع صاحبك وتساعده يفهمها ويتخذ قرارات صحيحة.

دراسة الجدوى:
{json.dumps(report, ensure_ascii=False, indent=2)}

قواعد:
- اشرح بلغة بسيطة وواضحة
- استند على أرقام دراسة الجدوى دايماً
- إذا سألك عن شيء مو في الدراسة قل له بوضوح
- ركّز على الفائدة العملية لصاحب المشروع
- ردودك باللغة العربية فقط
- لا تكرر نفس المعلومات في كل رد
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
        data  = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip()
        if not email or "@" not in email:
            return jsonify({"error": "إيميل غير صالح"}), 400

        business_type = data.get("business_type", "restaurant")
        if not is_valid_type(business_type):
            return jsonify({"error": "نوع المشروع غير مدعوم"}), 400

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

        project_nm = data.get("project_name") or "مشروعك"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pptx")
        tmp.close()
        try:
            build_pptx(deck, tmp.name)
            send_file_via_email(
                to_email=email,
                subject=f"العرض التقديمي — {project_nm} | منصة مُقدِّم",
                body=f"مرفق العرض التقديمي لمشروع \"{project_nm}\".\n\nمنصة مُقدِّم",
                file_path=tmp.name,
                attachment_name=f"{project_nm}_pitch_deck.pptx",
                project_name=project_nm,
                file_kind_ar="العرض التقديمي",
            )
            return jsonify({"ok": True, "sent_to": email})
        finally:
            try:
                os.remove(tmp.name)
            except OSError:
                pass

    except EnvironmentError as e:
        return jsonify({"error": f"إعداد SMTP ناقص: {e}"}), 500
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
    app.run(debug=True)
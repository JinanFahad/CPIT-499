from flask import Flask, request, jsonify, render_template, make_response, send_file
import os
import uuid
import json
import requests
from openai import OpenAI

from pdf_generator import build_feasibility_pdf
from ai_pitch_engine import generate_pitch_deck_json
from ppt_builder import build_pptx
from financial_engine import calculate_financials
from decision_engine import classify_project
from ai_report_engine import generate_feasibility_report, enrich_project_data
from market_ai import build_competitor_summary, generate_market_analysis_ar
from business_types import BUSINESS_TYPES, get_google_type, get_label_ar, is_valid_type
from saudi_assumptions import DEFAULT_SALARY
from database import init_db, save_report, get_all_reports, get_report_by_id, delete_report

app = Flask(__name__)

GOOGLE_API_KEY = "AIzaSyCMVLHJiz-3hOnp-oOPPE2r72fjKwf6xcQ"
client = OpenAI()

init_db()


# -----------------------------
# Basic
# -----------------------------
@app.get("/")
def home():
    return "Muqaddim Backend Running"

@app.get("/advisor")
def advisor_page():
    return render_template("advisor.html")
# -----------------------------
# Feasibility PDF
# -----------------------------
@app.post("/api/feasibility/report-pdf")
def report_pdf():
    data = request.get_json() or {}

    business_type     = data.get("business_type", "restaurant")
    city              = data.get("city", "غير محدد")
    capital           = data.get("capital", 100000)
    rent              = data.get("rent", 5000)
    employees         = data.get("employees", 3)
    avg_price         = data.get("avg_price", 30)
    customers_per_day = data.get("customers_per_day", 50)
    lat               = data.get("lat")
    lng               = data.get("lng")

    if not is_valid_type(business_type):
        return jsonify({
            "error": "نوع المشروع غير مدعوم",
            "supported_types": list(BUSINESS_TYPES.keys())
        }), 400

    enriched = enrich_project_data(business_type, city)

    full_data = {
        "business_type":      business_type,
        "city":               city,
        "capital":            capital,
        "rent":               rent,
        "employees":          employees,
        "avg_price":          avg_price,
        "customers_per_day":  customers_per_day,
        "avg_salary":         DEFAULT_SALARY,
        "cogs_known":         False,
        "target_customers":   enriched["target_customers"],
        "value_proposition":  enriched["value_proposition"],
        "competitors":        [],
        "market_notes":       "",
        "pricing_notes":      "",
    }

    financials = calculate_financials(full_data)
    decision = classify_project(
        profit_margin_percent=financials["profit_margin_percent"],
        payback_months=financials["payback_period_months"],
    )

    market_data = {
        "business_type":     get_label_ar(business_type),
        "city":              city,
        "target_customers":  full_data["target_customers"],
        "value_proposition": full_data["value_proposition"],
        "competitors":       [],
        "market_notes":      "",
        "pricing_notes":     "",
    }

    report = generate_feasibility_report(financials, decision, market_data)

    market_analysis   = None
    competitor_places = []

    if lat and lng:
        try:
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
                market_analysis   = generate_market_analysis_ar(
                                        get_label_ar(business_type), city, 1500, summary
                                    )
                competitor_places = summary["all_competitors"]

        except Exception as e:
            print(f"[market analysis skipped] {e}")

    report_id = save_report(report)

    pdf_bytes = build_feasibility_pdf(
        report=report,
        market_analysis=market_analysis,
        competitor_places=competitor_places,
    )

    resp = make_response(pdf_bytes)
    resp.headers["Content-Type"] = "application/pdf"
    resp.headers["Content-Disposition"] = 'attachment; filename="feasibility_report.pdf"'
    resp.headers["X-Report-Id"] = str(report_id)
    return resp


# -----------------------------
# Reports
# -----------------------------
@app.get("/api/reports")
def list_reports():
    return jsonify(get_all_reports())


@app.get("/api/reports/<int:report_id>")
def get_report(report_id):
    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "الدراسة غير موجودة"}), 404
    return jsonify(report)


@app.delete("/api/reports/<int:report_id>")
def remove_report(report_id):
    deleted = delete_report(report_id)
    if not deleted:
        return jsonify({"error": "الدراسة غير موجودة"}), 404
    return jsonify({"ok": True, "deleted_id": report_id})


# -----------------------------
# Advisor
# -----------------------------
@app.post("/api/advisor/chat")
def advisor_chat():
    data      = request.get_json() or {}
    report_id = data.get("report_id")
    message   = data.get("message", "").strip()
    history   = data.get("history", [])

    if not message:
        return jsonify({"error": "message مطلوب"}), 400
    if not report_id:
        return jsonify({"error": "report_id مطلوب"}), 400

    report = get_report_by_id(int(report_id))
    if not report:
        return jsonify({"error": "الدراسة غير موجودة"}), 404

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

    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=800,
    )

    reply = response.choices[0].message.content

    return jsonify({
        "reply": reply,
        "history": history + [
            {"role": "user",      "content": message},
            {"role": "assistant", "content": reply},
        ]
    })


# -----------------------------
# Pitch Deck
# -----------------------------
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
        deck   = generate_pitch_deck_json(report, extra=market_data)

        if isinstance(deck, str):
            deck = json.loads(deck)
        if "slides" not in deck:
            return jsonify({"error": "Deck JSON missing 'slides'"}), 500

        os.makedirs("generated", exist_ok=True)
        filename = f"pitch_{uuid.uuid4().hex}.pptx"
        out_path = os.path.join("generated", filename)
        build_pptx(deck, out_path)

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


# -----------------------------
# Pick Location
# -----------------------------
@app.post("/api/location/pick")
def location_pick():
    data = request.get_json(silent=True) or {}
    lat  = data.get("lat")
    lng  = data.get("lng")
    if lat is None or lng is None:
        return jsonify({"error": "lat/lng required"}), 400
    return jsonify({"ok": True, "latitude": float(lat), "longitude": float(lng)})


@app.get("/pick-location")
def pick_location_page():
    return render_template("map.html")


# -----------------------------
# Analyze
# -----------------------------
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

    places      = res.get("places", [])
    summary     = build_competitor_summary(places)
    ai_analysis = generate_market_analysis_ar(
                      get_label_ar(business_type), city, radius_f, summary
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


# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)
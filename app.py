from flask import Flask, request, jsonify, render_template, make_response, send_file
from playwright.sync_api import sync_playwright
import os
import uuid
import json
import requests

from ai_pitch_engine import generate_pitch_deck_json
from ppt_builder import build_pptx
from financial_engine import calculate_financials
from decision_engine import classify_project
from ai_report_engine import generate_feasibility_report
from market_ai import build_competitor_summary, generate_market_analysis_ar

app = Flask(__name__)

# ⚠️ يفضل وضع المفتاح في متغير بيئة
GOOGLE_API_KEY = "AIzaSyCMVLHJiz-3hOnp-oOPPE2r72fjKwf6xcQ"


# -----------------------------
# Basic
# -----------------------------
@app.get("/")
def home():
    return "Muqaddim Backend Running"


# -----------------------------
# Feasibility PDF
# -----------------------------
@app.post("/api/feasibility/report-pdf")
def report_pdf():
    data = request.get_json() or {}

    financials = calculate_financials(data)
    decision = classify_project(
        profit_margin_percent=financials["profit_margin_percent"],
        payback_months=financials["payback_period_months"],
    )

    market_data = {
        "business_type": data.get("business_type", ""),
        "city": data.get("city", ""),
        "target_customers": data.get("target_customers", ""),
        "value_proposition": data.get("value_proposition", ""),
        "competitors": data.get("competitors", []),
        "market_notes": data.get("market_notes", ""),
        "pricing_notes": data.get("pricing_notes", ""),
    }

    report = generate_feasibility_report(financials, decision, market_data)
    html = render_template("report_template.html", report=report)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        pdf_bytes = page.pdf(format="A4", print_background=True)
        browser.close()

    resp = make_response(pdf_bytes)
    resp.headers["Content-Type"] = "application/pdf"
    resp.headers["Content-Disposition"] = 'attachment; filename="feasibility_report.pdf"'
    return resp


# -----------------------------
# Pitch Deck Generate
# -----------------------------
@app.post("/api/pitchdeck/generate")
def pitchdeck_generate():
    try:
        data = request.get_json(silent=True) or {}
        if not data:
            return jsonify({"error": "Invalid or missing JSON body"}), 400

        financials = calculate_financials(data)
        decision = classify_project(
            profit_margin_percent=financials["profit_margin_percent"],
            payback_months=financials["payback_period_months"],
        )

        market_data = {
            "business_type": data.get("business_type", ""),
            "city": data.get("city", ""),
            "target_customers": data.get("target_customers", ""),
            "value_proposition": data.get("value_proposition", ""),
            "competitors": data.get("competitors", []),
            "market_notes": data.get("market_notes", ""),
            "pricing_notes": data.get("pricing_notes", ""),
        }

        report = generate_feasibility_report(financials, decision, market_data)
        deck = generate_pitch_deck_json(report, extra=market_data)

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
    lat = data.get("lat")
    lng = data.get("lng")

    if lat is None or lng is None:
        return jsonify({"error": "lat/lng required"}), 400
    
    return jsonify({"ok": True, "latitude": float(lat), "longitude": float(lng)})

@app.get("/pick-location")
def pick_location_page():
    return render_template("map.html")
# -----------------------------
# Analyze Nearby Competitors
# -----------------------------
@app.get("/analyze")
def analyze():
    lat = request.args.get("lat")
    lng = request.args.get("lng")
    place_type = (request.args.get("type") or "restaurant").strip()
    project_type = request.args.get("project_type") or place_type  # نوع مطعم المستخدم
    city = request.args.get("city", "غير محدد")
    radius = request.args.get("radius", "1500")

    if not lat or not lng:
        return jsonify({"error": "lat and lng required"}), 400

    try:
        lat_f, lng_f, radius_f = float(lat), float(lng), float(radius)
    except ValueError:
        return jsonify({"error": "lat/lng/radius must be numbers"}), 400

    # جلب البيانات من Google
    url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.rating,"
            "places.userRatingCount,places.formattedAddress,"
            "places.types,places.primaryType,places.primaryTypeDisplayName"
        ),
    }
    body = {
        "includedTypes": [place_type],
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat_f, "longitude": lng_f},
                "radius": radius_f,
            }
        },
    }

    res = requests.post(url, headers=headers, json=body).json()
    if "error" in res:
        return jsonify(res), 400

    places = res.get("places", [])

    # تحليل AI
    summary = build_competitor_summary(places)
    ai_analysis = generate_market_analysis_ar(project_type, city, radius_f, summary)

    return jsonify({
        "input": {
            "lat": lat_f, "lng": lng_f,
            "type": place_type,
            "project_type": project_type,
            "radius": radius_f
        },
        "places_found": len(places),
        "summary": summary,
        "ai_analysis": ai_analysis       # النتيجة الكاملة مع التصنيف الفردي
    })
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)
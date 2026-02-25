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

app = Flask(__name__)

# ✅ الأفضل: set GOOGLE_API_KEY in env
GOOGLE_API_KEY =  "AIzaSyCMVLHJiz-3hOnp-oOPPE2r72fjKwf6xcQ"


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
# Pitch Deck Generate (OpenAI -> PPTX)
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
            return jsonify({"error": "Deck JSON missing 'slides'", "deck_keys": list(deck.keys())}), 500

        os.makedirs("generated", exist_ok=True)
        filename = f"pitch_{uuid.uuid4().hex}.pptx"
        out_path = os.path.join("generated", filename)

        build_pptx(deck, out_path)

        if not os.path.exists(out_path):
            return jsonify({"error": "PPTX file was not created"}), 500

        return send_file(
            out_path,
            as_attachment=True,
            download_name="Muqaddim_Pitch_Deck.pptx",
            mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )

    except Exception as e:
        import traceback
        print("ERROR:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Pitch Deck Tests
# -----------------------------
@app.get("/api/pitchdeck/test-cover")
def test_cover():
    deck = {"slides": [{"title": "Muqaddim", "subtitle": "AI-Powered Business Consultant"}]}
    os.makedirs("generated", exist_ok=True)
    out_path = os.path.join("generated", f"test_{uuid.uuid4().hex}.pptx")
    build_pptx(deck, out_path, template_path="template.pptx")
    return send_file(out_path, as_attachment=True, download_name="test_cover.pptx")


@app.get("/api/pitchdeck/test")
def test_deck():
    deck = {
        "slides": [
            {"title": "Muqaddim", "subtitle": "AI Business Consultant", "bullets": [], "numbers": []},
            {
                "title": "The Problem",
                "subtitle": "Entrepreneurs struggle",
                "bullets": ["Lack of structured feasibility tools", "High consulting costs", "Time-consuming analysis"],
                "numbers": [],
            },
        ]
    }
    os.makedirs("generated", exist_ok=True)
    out_path = os.path.join("generated", "test_output.pptx")
    build_pptx(deck, out_path, template_path="template.pptx")
    return send_file(out_path, as_attachment=True)


# -----------------------------
# Pick Location Page (renders templates/map.html)
# -----------------------------
@app.get("/pick-location")
def pick_location_page():
    return render_template("map.html")


# -----------------------------
# Save picked location (Frontend -> Backend)
# -----------------------------
@app.post("/api/location/pick")
def location_pick():
    data = request.get_json(silent=True) or {}
    lat = data.get("lat")
    lng = data.get("lng")

    if lat is None or lng is None:
        return jsonify({"error": "lat/lng required"}), 400

    # هنا لاحقًا تقدرين تخزنينه في DB / session / project_id
    return jsonify({"ok": True, "latitude": float(lat), "longitude": float(lng)})


# -----------------------------
# Analyze: Nearby competitors using lat/lng (Places API New)
# -----------------------------
@app.get("/analyze")
def analyze():
    if not GOOGLE_API_KEY or GOOGLE_API_KEY == "PUT_YOUR_KEY_HERE":
        return jsonify({"error": "Missing GOOGLE_API_KEY"}), 500

    lat = request.args.get("lat")
    lng = request.args.get("lng")
    place_type = (request.args.get("type") or "restaurant").strip()
    radius = request.args.get("radius", "1500")  # meters

    if not lat or not lng:
        return jsonify({"error": "lat and lng required"}), 400

    try:
        lat_f = float(lat)
        lng_f = float(lng)
        radius_f = float(radius)
    except ValueError:
        return jsonify({"error": "lat/lng/radius must be numbers"}), 400

    places_url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.rating,"
            "places.userRatingCount,"
            "places.formattedAddress,"
            "places.location,"
            "places.types"
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

    res = requests.post(places_url, headers=headers, json=body, timeout=20).json()

    if "error" in res:
        return jsonify({"error": "Places API error", "details": res["error"]}), 400

    places = res.get("places", [])

    # ✅ ملخص بسيط يساعدك قبل ما تودينها لـ OpenAI
    ratings = [p.get("rating") for p in places if isinstance(p.get("rating"), (int, float))]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

    return jsonify({
        "input": {"lat": lat_f, "lng": lng_f, "type": place_type, "radius": radius_f},
        "places_found": len(places),
        "avg_rating": avg_rating,
        "places": places,
    })


# -----------------------------
# District Suggestions (Autocomplete) + filter to neighborhoods
# -----------------------------
@app.get("/api/districts/suggest")
def districts_suggest():
    if not GOOGLE_API_KEY or GOOGLE_API_KEY == "PUT_YOUR_KEY_HERE":
        return jsonify({"error": "Missing GOOGLE_API_KEY"}), 500

    q = (request.args.get("q") or "").strip()
    if len(q) < 2:
        return jsonify({"suggestions": []})

    url = "https://places.googleapis.com/v1/places:autocomplete"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": (
            "suggestions.placePrediction.placeId,"
            "suggestions.placePrediction.text,"
            "suggestions.placePrediction.types"
        ),
    }
    body = {
        "input": q,
        "includedRegionCodes": ["SA"],
        "languageCode": "ar",
    }

    data = requests.post(url, headers=headers, json=body, timeout=20).json()

    if "error" in data:
        return jsonify({"error": "Autocomplete error", "details": data["error"], "sent_body": body}), 400

    allowed_types = {"neighborhood", "sublocality", "sublocality_level_1"}
    suggestions = []

    for s in data.get("suggestions", []):
        pp = s.get("placePrediction") or {}
        text = ((pp.get("text") or {}).get("text"))
        place_id = pp.get("placeId")
        types = set(pp.get("types", []) or [])

        # ✅ فلترة: نبي أحياء/مناطق فقط
        if types and allowed_types.isdisjoint(types):
            continue

        if text and place_id:
            suggestions.append({"label": text, "place_id": place_id, "types": list(types)})

    return jsonify({"suggestions": suggestions})


# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)
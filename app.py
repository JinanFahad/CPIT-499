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

# الأفضل تحطها في Environment Variables بدل ما تكتبها بالكود
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
        payback_months=financials["payback_period_months"]
    )

    market_data = {
        "business_type": data.get("business_type", ""),
        "city": data.get("city", ""),
        "target_customers": data.get("target_customers", ""),
        "value_proposition": data.get("value_proposition", ""),
        "competitors": data.get("competitors", []),
        "market_notes": data.get("market_notes", ""),
        "pricing_notes": data.get("pricing_notes", "")
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
            payback_months=financials["payback_period_months"]
        )

        market_data = {
            "business_type": data.get("business_type", ""),
            "city": data.get("city", ""),
            "target_customers": data.get("target_customers", ""),
            "value_proposition": data.get("value_proposition", ""),
            "competitors": data.get("competitors", []),
            "market_notes": data.get("market_notes", ""),
            "pricing_notes": data.get("pricing_notes", "")
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
            mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation"
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
    deck = {
        "slides": [
            {"title": "Muqaddim", "subtitle": "AI-Powered Business Consultant"}
        ]
    }

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
                "bullets": [
                    "Lack of structured feasibility tools",
                    "High consulting costs",
                    "Time-consuming analysis"
                ],
                "numbers": []
            }
        ]
    }

    os.makedirs("generated", exist_ok=True)
    out_path = os.path.join("generated", "test_output.pptx")

    build_pptx(deck, out_path, template_path="template.pptx")
    return send_file(out_path, as_attachment=True)


# -----------------------------
# Analyze: Geocode + Nearby Places
# -----------------------------
@app.get("/analyze")
def analyze():
    if not GOOGLE_API_KEY:
        return jsonify({"error": "Missing GOOGLE_API_KEY in environment variables"}), 500

    district = (request.args.get("district") or "").strip()
    business_type = (request.args.get("type") or "").strip()
    debug = request.args.get("debug") == "1"

    if not district or not business_type:
        return jsonify({"error": "district and type are required"}), 400

    # 1) Geocoding (Legacy)
    geo_url = "https://maps.googleapis.com/maps/api/geocode/json"
    geo_params = {"address": district, "key": GOOGLE_API_KEY}
    geo_response = requests.get(geo_url, params=geo_params, timeout=20).json()

    if geo_response.get("status") != "OK":
        return jsonify({
            "error": "Geocoding failed",
            "district": district,
            "details": geo_response
        }), 400

    location = geo_response["results"][0]["geometry"]["location"]
    lat, lng = location["lat"], location["lng"]

    # 2) Places (New) - searchNearby
    places_url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.formattedAddress,places.types"
    }
    body = {
        "includedTypes": [business_type],
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 2000.0
            }
        }
    }

    places_response = requests.post(places_url, headers=headers, json=body, timeout=20).json()

    if "error" in places_response:
        return jsonify({
            "error": "Places API error",
            "district": district,
            "business_type": business_type,
            "lat": lat,
            "lng": lng,
            "places_error": places_response["error"]
        }), 400

    places = places_response.get("places", [])

    if debug:
        return jsonify({
            "district": district,
            "business_type": business_type,
            "lat": lat,
            "lng": lng,
            "places_count": len(places),
            "places_response": places_response
        })

    # Optional filtering
    district_norm = district.lower()
    filtered_places = [
        p for p in places
        if district_norm in (p.get("formattedAddress", "") or "").lower()
    ]

    final_places = filtered_places if filtered_places else places

    return jsonify({
        "district": district,
        "business_type": business_type,
        "latitude": lat,
        "longitude": lng,
        "places_found": len(final_places),
        "places": final_places,
        "filter_applied": True,
        "filter_matched": len(filtered_places)
    })


# -----------------------------
# District Suggestions (Autocomplete)
# -----------------------------
@app.get("/api/districts/suggest")
def districts_suggest():
    q = (request.args.get("q") or "").strip()
    if len(q) < 2:
        return jsonify({"suggestions": []})

    url = "https://places.googleapis.com/v1/places:autocomplete"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        # 👇 أضفنا types هنا
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,"
                            "suggestions.placePrediction.text,"
                            "suggestions.placePrediction.types"
    }

    body = {
        "input": q,
        "includedRegionCodes": ["SA"],
        "languageCode": "ar"
    }

    r = requests.post(url, headers=headers, json=body, timeout=20)
    data = r.json()

    if "error" in data:
        return jsonify({
            "google_error": data["error"],
            "sent_body": body
        }), 400

    suggestions = []

    for s in data.get("suggestions", []):
     pp = s.get("placePrediction") or {}

     text = ((pp.get("text") or {}).get("text"))
     place_id = pp.get("placeId")
     types = pp.get("types", [])

    # 👇 هنا التعديل
     if not any(t in types for t in ["neighborhood", "sublocality", "sublocality_level_1"]):
        continue

     if text and place_id:
        suggestions.append({
            "label": text,
            "place_id": place_id
        })

    return jsonify({"suggestions": suggestions})


# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)
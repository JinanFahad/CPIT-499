
# =====================================================================
# Standard library imports.
# =====================================================================
import os
import uuid
import json
import tempfile
import traceback

# =====================================================================
# Third-party imports.
# =====================================================================
import requests
from flask import Flask, request, jsonify, make_response, send_file, after_this_request
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Load .env BEFORE any import that may read OPENAI_API_KEY / SMTP_* etc.
load_dotenv(override=True)

# =====================================================================
# Internal imports — file generators (PDF / PowerPoint / Email).
# =====================================================================
from generators.pdf_generator import build_feasibility_pdf
from generators.ppt_builder import build_pptx
from services.email_sender import send_file_via_email

# =====================================================================
# Internal imports — calculation and decision engines.
# =====================================================================
from engines.financial_engine import calculate_financials
from engines.decision_engine import classify_project

# =====================================================================
# Internal imports — AI engines and their custom exceptions.
# =====================================================================
from engines.ai_report_engine import (
    generate_feasibility_report,
    enrich_project_data,
    AIServiceUnavailable,
    AIResponseInvalid,
)
from engines.ai_pitch_engine import (
    generate_pitch_deck_json,
    PitchGenerationError,
    PitchServiceUnavailable,
    PitchResponseInvalid,
)
from engines.ai_advisor import (
    chat_with_advisor,
    AdvisorServiceUnavailable,
    AdvisorResponseInvalid,
)
from engines.market_ai import build_competitor_summary, generate_market_analysis_ar
from engines.gov_consultant import gov_chat, clear_gov_session
from services.report_translator import get_or_create_translation

# =====================================================================
# Internal imports — domain config, validators, database.
# =====================================================================
from schemas.business_types import BUSINESS_TYPES, get_google_type, get_label_ar, get_label, is_valid_type
from data.saudi_assumptions import DEFAULT_SALARY
from core.validators import validate_feasibility_input
from core.database import (
    init_db,
    save_report, get_all_reports, get_report_by_id, delete_report, update_report,
    save_project, get_projects_by_user, get_project_by_id, update_project, delete_project,
    mark_pitch_deck_generated,
)

# =====================================================================
# App initialization, CORS, global clients, DB bootstrap.
# =====================================================================
app = Flask(__name__)

# CORS lets the frontend (running on its own dev port) talk to this server.
# expose_headers is required so the browser allows the frontend code to read
# the X-Report-Id header we send back with PDF responses.
CORS(app, expose_headers=["X-Report-Id"])

# Google Maps / Places API key. Used for the nearby-competitors lookup.
GOOGLE_API_KEY = "AIzaSyCMVLHJiz-3hOnp-oOPPE2r72fjKwf6xcQ"

# OpenAI client. The SDK picks up OPENAI_API_KEY automatically.
client = OpenAI()

# Create tables on startup if they don't exist yet.
init_db()


# =====================================================================
# Health check.
# =====================================================================
@app.get("/")
def home():
    return "Muqaddim Backend Running"


# =====================================================================
# Feasibility report — generation and email delivery.
# Main pipeline of the platform:
#   1. Validate the request body.
#   2. Use AI to produce a target_customers and value_proposition pair.
#   3. Run financial calculations.
#   4. Classify the project (suitable / moderate / high risk).
#   5. If lat/lng provided, query Google Places for nearby competitors.
#   6. Have the AI generate the full report JSON.
#   7. Persist the report and return the PDF bytes.
# =====================================================================

@app.post("/api/feasibility/report-pdf")
def report_pdf():
    data = request.get_json() or {}

    # Defense in depth: validate again on the server even though the frontend

    is_valid, error_msg = validate_feasibility_input(data)
    if not is_valid: #false
        return jsonify({"error": error_msg}), 400

    # Core user inputs.
    business_type     = data.get("business_type", "restaurant")
    city              = data.get("city", "غير محدد")
    capital           = data.get("capital", 100000)
    rent              = data.get("rent", 5000)
    employees         = data.get("employees", 3)
    avg_price         = data.get("avg_price", 30)
    customers_per_day = data.get("customers_per_day", 50)
    lat               = data.get("lat")
    lng               = data.get("lng")

    # Report language: 'ar' (default) or 'en'. Sent by the frontend based on
   
    language = (data.get("language") or "ar").lower()
    if language not in ("ar", "en"):
        language = "ar"

    if not is_valid_type(business_type):
        return jsonify({
            "error": "نوع المشروع غير مدعوم",
            "supported_types": list(BUSINESS_TYPES.keys())
        }), 400
    


    # Heavy work starts here (AI calls, calculations, PDF rendering).


    is_en = language == "en"

    try:
        # AI generates the target_customers and value_proposition fields.
        enriched = enrich_project_data(business_type, city, language=language)

        restaurant_type = (data.get("restaurant_type") or "").strip()
        project_type_for_market = restaurant_type or get_label(business_type, language)

        # The user can override the AI-generated target customers description.
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

        # Market analysis via Google Places (only if the user pinned a
        # location).

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
                    timeout=15,
                ).json()

                places = places_res.get("places", [])
                if places:
                    summary = build_competitor_summary(places)
                    market_analysis = generate_market_analysis_ar(
                        project_type_for_market,
                        city,
                        1500,
                        summary,
                        language=language,
                    )
                    competitor_places = summary["all_competitors"]
            except requests.RequestException as e:
                print(f"[market analysis skipped — network error] {e}")
            except Exception as e:
                print(f"[market analysis skipped] {e}")

        # Merge the real Google Places data into the AI-generated report
       
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

        # Return the PDF 
        resp = make_response(pdf_bytes)
        resp.headers["Content-Type"] = "application/pdf"
        resp.headers["Content-Disposition"] = 'attachment; filename="feasibility_report.pdf"'
        resp.headers["X-Report-Id"] = str(report_id)
        return resp

    except ValueError as e:
        # Validation error: invalid user input (negative number, wrong type).
        return jsonify({"error": str(e)}), 400
    except AIServiceUnavailable as e:
        # OpenAI request failed.
        msg = "AI service is temporarily unavailable. Please try again later." if is_en else "خدمة الذكاء الاصطناعي غير متاحة حالياً. حاولي مرة أخرى."
        return jsonify({"error": msg, "detail": str(e)}), 503
    except AIResponseInvalid as e:
        # AI response could not be parsed.
        msg = "AI returned an invalid response. Please try again." if is_en else "الذكاء الاصطناعي رد بشكل غير متوقّع. حاولي مرة أخرى."
        return jsonify({"error": msg, "detail": str(e)}), 502
    except Exception as e:
        traceback.print_exc()
        msg = "An unexpected error occurred while generating the report." if is_en else "حدث خطأ غير متوقّع أثناء توليد التقرير."
        return jsonify({"error": msg, "detail": str(e)}), 500


#----------------------------------------------------------------------------------------------------------------------------------------------------------


# Email 
@app.post("/api/feasibility/email")
def feasibility_email():
    data       = request.get_json(silent=True) or {}
    report_id  = data.get("report_id")
    email      = (data.get("email") or "").strip()
    language   = (data.get("language") or "ar").lower()
    if language not in ("ar", "en"):
        language = "ar"
    is_en      = language == "en"
    # Default project name .
    project_nm = data.get("project_name") or ("Your Project" if is_en else "مشروعك")

    if not report_id:
        return jsonify({"error": "report_id required" if is_en else "report_id مطلوب"}), 400
    if not email:
        return jsonify({"error": "email required" if is_en else "البريد الإلكتروني مطلوب"}), 400

    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "Report not found" if is_en else "الدراسة غير موجودة"}), 404


    # If the user requested English, fetch (or create) the translated copy
   
    if is_en:
        report, _ = get_or_create_translation(report, "en")

    # Render the PDF in the requested language.
    pdf_bytes = build_feasibility_pdf(
        report=report,
        market_analysis=report.get("market_analysis"),
        competitor_places=report.get("competitor_places", []),
        language=language,
    )

    # Write the PDF to a temp file, attach it, and delete it after sending.

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
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            os.remove(tmp.name)
        except OSError:
            pass


# =====================================================================
# Saved-report management 
# =====================================================================

@app.get("/api/reports")
def list_reports():
    """Return all stored reports (used by admin/dashboard listings)."""
    return jsonify(get_all_reports())


@app.get("/api/reports/<int:report_id>")
def get_report(report_id):
    """Return a single report (used by the in-app viewer and the advisor)."""
    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "الدراسة غير موجودة"}), 404
    return jsonify(report)


@app.post("/api/reports/<int:report_id>/translate")
def translate_report_endpoint(report_id):
    """Translate the free-text fields of a report to the requested language
    and cache the result inside the report itself.

    Body: {"to": "en"} or {"to": "ar"}.
    Response: the translated report ready for display.
    """
    data = request.get_json(silent=True) or {}
    target = (data.get("to") or "").lower()
    if target not in ("ar", "en"):
        return jsonify({"error": "Invalid target language (use 'ar' or 'en')"}), 400

    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    translated, was_newly_translated = get_or_create_translation(report, target)

    # Persist the updated _translations cache so the next request is free.
    if was_newly_translated:
        update_report(report_id, report)

    return jsonify(translated)


@app.delete("/api/reports/<int:report_id>")
def remove_report(report_id):
    """Delete a stored report."""
    deleted = delete_report(report_id)
    if not deleted:
        return jsonify({"error": "الدراسة غير موجودة"}), 404
    return jsonify({"ok": True, "deleted_id": report_id})


# =====================================================================
# AI Advisor — chat scoped to one project's feasibility report.
# =====================================================================

@app.post("/api/advisor/chat")
def advisor_chat():
    data      = request.get_json() or {}
    report_id = data.get("report_id")
    message   = data.get("message", "").strip()
    history   = data.get("history", [])
    language  = (data.get("language") or "ar").lower()
    if language not in ("ar", "en"):
        language = "ar"
    is_en = language == "en"

    if not message:
        return jsonify({"error": "message required" if is_en else "message مطلوب"}), 400
    if not report_id:
        return jsonify({"error": "report_id required" if is_en else "report_id مطلوب"}), 400

    # The full report is fed into the system prompt so the model can ground
    
    report = get_report_by_id(int(report_id))
    if not report:
        return jsonify({"error": "Report not found" if is_en else "الدراسة غير موجودة"}), 404


    try:
        reply = chat_with_advisor(report, message, history, language=language)
    except AdvisorServiceUnavailable as e:
        traceback.print_exc()
        msg = "AI service is temporarily unavailable. Please try again." if is_en else "خدمة الذكاء الاصطناعي غير متاحة حالياً. حاولي مرة ثانية."
        return jsonify({"error": msg, "detail": str(e)}), 503
    except AdvisorResponseInvalid as e:
        return jsonify({"error": "Malformed AI response", "detail": str(e)}), 502
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    # Return the reply along with the updated history so the frontend can send it back on the next message.
    
    return jsonify({
        "reply": reply,
        "history": history + [
            {"role": "user",      "content": message},
            {"role": "assistant", "content": reply},
        ]
    })


# =====================================================================
# Pitch deck — generation and email delivery.
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

        # Save the file under generated/ with a UUID name so concurrent
        os.makedirs("generated", exist_ok=True)
        filename = f"pitch_{uuid.uuid4().hex}.pptx"
        out_path = os.path.join("generated", filename)
        build_pptx(deck, out_path)

        project_id = data.get("project_id")
        if project_id:
            try:
                mark_pitch_deck_generated(int(project_id))
            except (ValueError, TypeError):
                pass

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

    except ValueError as e:
        # Validation error from financial_engine or ai_pitch_engine.
        return jsonify({"error": str(e)}), 400
    except PitchServiceUnavailable as e:
        # OpenAI service is down (network, quota, auth).
        return jsonify({
            "error": "Pitch deck service is temporarily unavailable. Please try again.",
            "detail": str(e),
        }), 503
    except PitchResponseInvalid as e:
        # AI returned malformed JSON or response missing required fields.
        return jsonify({
            "error": "AI returned an invalid pitch deck response. Please try again.",
            "detail": str(e),
        }), 502
    except PitchGenerationError as e:
        # Generic catch-all for any other pitch generation issue.
        return jsonify({
            "error": "Pitch deck generation failed.",
            "detail": str(e),
        }), 503
    except (AIServiceUnavailable, AIResponseInvalid) as e:
        # The underlying feasibility report generation failed.
        return jsonify({
            "error": "AI service is temporarily unavailable.",
            "detail": str(e),
        }), 503
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# Email a generated pitch deck. Same body as /api/pitchdeck/generate, but
# the file is mailed instead of returned as a download.
@app.post("/api/pitchdeck/email")
def pitchdeck_email():
    try:
        data     = request.get_json(silent=True) or {}
        email    = (data.get("email") or "").strip()
        language = (data.get("language") or "ar").lower()
        if language not in ("ar", "en"):
            language = "ar"
        is_en = language == "en"

        if not email:
            return jsonify({"error": "email required" if is_en else "البريد الإلكتروني مطلوب"}), 400

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

    except ValueError as e:
        # Validation error from financial_engine or ai_pitch_engine.
        return jsonify({"error": str(e)}), 400
    except (PitchServiceUnavailable, AIServiceUnavailable) as e:
        # OpenAI service is down (network, quota, auth).
        msg = "AI service is temporarily unavailable. Please try again." if is_en else "خدمة الذكاء الاصطناعي غير متاحة حالياً. حاولي مرة ثانية."
        return jsonify({"error": msg, "detail": str(e)}), 503
    except (PitchResponseInvalid, AIResponseInvalid) as e:
        # AI returned malformed output.
        msg = "AI returned an invalid response. Please try again." if is_en else "الذكاء الاصطناعي رد بشكل غير متوقع. حاولي مرة ثانية."
        return jsonify({"error": msg, "detail": str(e)}), 502
    except PitchGenerationError as e:
        # Generic catch-all for any other pitch generation issue.
        msg = "Pitch deck generation failed. Please try again." if is_en else "فشل توليد العرض التقديمي. حاولي مرة ثانية."
        return jsonify({"error": msg, "detail": str(e)}), 503
    except EnvironmentError as e:
        msg = f"SMTP configuration missing: {e}" if is_en else f"إعداد SMTP ناقص: {e}"
        return jsonify({"error": msg}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =====================================================================
# Location picker
# =====================================================================
@app.post("/api/location/pick")
def location_pick():
    """Simple endpoint that validates a pair of coordinates."""
    data = request.get_json(silent=True) or {}
    lat  = data.get("lat")
    lng  = data.get("lng")
    if lat is None or lng is None:
        return jsonify({"error": "lat/lng required"}), 400
    # Coordinates must be numeric and within valid global ranges.
    try:
        lat_f = float(lat)
        lng_f = float(lng)
    except (ValueError, TypeError):
        return jsonify({"error": "lat/lng must be numeric"}), 400
    if not (-90 <= lat_f <= 90):
        return jsonify({"error": "lat must be between -90 and 90"}), 400
    if not (-180 <= lng_f <= 180):
        return jsonify({"error": "lng must be between -180 and 180"}), 400
    return jsonify({"ok": True, "latitude": lat_f, "longitude": lng_f})


# =====================================================================
# Standalone market analysis 
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

    # Ask Google Places for nearby restaurants within the requested radius.
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

    # Summarize the competitors (avg rating, strongest, etc.) and pass them
    # to the AI for deeper analysis.
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
# Government procedures chat.
# =====================================================================

@app.post("/api/government/chat")
def government_chat():
    """Receive a user message plus its session_id and return the AI reply."""
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    message = (data.get("message") or "").strip()
    language = (data.get("language") or "ar").lower()
    if language not in ("ar", "en"):
        language = "ar"
    is_en = language == "en"

    # Validate inputs before delegating to gov_chat.
    if not session_id or not isinstance(session_id, str):
        return jsonify({"error": "session_id required" if is_en else "session_id مطلوب"}), 400
    if not message:
        return jsonify({"error": "Empty message" if is_en else "الرسالة فارغة"}), 400
    if len(message) > 2000:
        return jsonify({"error": "Message too long (max 2000 chars)" if is_en else "الرسالة طويلة جداً (الحد الأقصى 2000 حرف)"}), 400

    try:
        reply = gov_chat(session_id, message, language=language)
        return jsonify({"reply": reply})
    except ValueError as e:
        # Validation error raised inside gov_chat that slipped past the
        # checks above.
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # GovChatError or anything else: treat as service unavailable.
        traceback.print_exc()
        msg = "Service temporarily unavailable. Please try again." if is_en else "الخدمة غير متاحة حالياً. حاولي مرة ثانية."
        return jsonify({"error": msg, "detail": str(e)}), 503


@app.post("/api/government/clear")
def government_clear():
    """Clear a chat session (called on logout)."""
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    if session_id:
        clear_gov_session(session_id)
    return jsonify({"ok": True})



# =====================================================================
# User-project 
# =====================================================================
@app.post("/api/projects")
def create_project():
    """Create a project record after the feasibility report has been generated."""
    data = request.get_json() or {}
    user_id = data.get("user_id", "")
    project_name = (data.get("project_name") or "").strip()

    # Validate the required fields.
    if not user_id or not isinstance(user_id, str):
        return jsonify({"error": "user_id مطلوب"}), 400
    if not project_name:
        return jsonify({"error": "project_name مطلوب"}), 400
    if len(project_name) > 200:
        return jsonify({"error": "اسم المشروع طويل جداً (الحد 200 حرف)"}), 400

    try:
        project_id = save_project(data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"فشل حفظ المشروع: {e}"}), 500
    return jsonify({"id": project_id, "ok": True})


@app.get("/api/projects")
def list_projects():
    """List a user's projects (used by the dashboard and My Projects page)."""
    user_id = request.args.get("user_id", "")
    if not user_id:
        return jsonify({"error": "user_id مطلوب"}), 400
    try:
        return jsonify(get_projects_by_user(user_id))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to load projects", "detail": str(e)}), 500


@app.get("/api/projects/<int:project_id>")
def get_project(project_id):
    """Return one project by id (used by EditProjectPage and ConsultantChatPage)."""
    try:
        project = get_project_by_id(project_id)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to load project", "detail": str(e)}), 500
    if not project:
        return jsonify({"error": "المشروع غير موجود"}), 404
    return jsonify(project)


@app.put("/api/projects/<int:project_id>")
def edit_project(project_id):
    """Update project fields and re-link it to a freshly generated report."""
    data = request.get_json() or {}
    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Request body is required"}), 400
    try:
        updated = update_project(project_id, data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to update project", "detail": str(e)}), 500
    if not updated:
        return jsonify({"error": "المشروع غير موجود"}), 404
    return jsonify({"ok": True})


@app.delete("/api/projects/<int:project_id>")
def remove_project_route(project_id):
    """Delete a project record."""
    try:
        deleted = delete_project(project_id)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to delete project", "detail": str(e)}), 500
    if not deleted:
        return jsonify({"error": "المشروع غير موجود"}), 404
    return jsonify({"ok": True, "deleted_id": project_id})


# =====================================================================
# Development entry point. 
# =====================================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
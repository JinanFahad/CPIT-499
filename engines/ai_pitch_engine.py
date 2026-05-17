# ai_pitch_engine.py
# Generates a structured pitch deck (8 slides) from a feasibility report
# using OpenAI. The deck content is always in English because investor-facing
# pitch decks are conventionally English even when the underlying report is
# Arabic.

from openai import OpenAI, OpenAIError
import json
import logging
from schemas.pitch_schema import PITCH_SCHEMA

logger = logging.getLogger(__name__)

client = OpenAI()


class PitchGenerationError(Exception):
    """Base exception for pitch deck generation failures."""
    pass


class PitchServiceUnavailable(PitchGenerationError):
    """The OpenAI request failed (network, auth, quota, or HTTP error)."""
    pass


class PitchResponseInvalid(PitchGenerationError):
    """The AI response could not be parsed as JSON or violated the schema."""
    pass


def generate_pitch_deck_json(feasibility_report: dict, extra: dict | None = None):
    """Build an 8-slide deck JSON: Cover, Problem, Solution, Concept,
    Market, Financials, Competitive Advantage, Investment Ask.

    Pulls every field from feasibility_report first, falling back to the
    optional extra dict for anything the report does not contain.
    """
    # معلومات اكسترا من المستخدم لما جا يولد دراسة الجدوى 
    extra = extra or {} #يحول ال none ل dict فاضي عشان ما يطلع خطأ لما نعمل extra.get() بعدين

    project_name      = feasibility_report.get("project_name")      or extra.get("project_name")      or ""
    idea_description  = feasibility_report.get("idea_description")  or extra.get("idea_description")  or ""
    restaurant_type   = feasibility_report.get("restaurant_type")   or extra.get("restaurant_type")   or ""
    city              = feasibility_report.get("city")              or extra.get("city")              or ""
    target_customers  = feasibility_report.get("target_customers")  or extra.get("target_customers")  or ""
    main_products     = feasibility_report.get("main_products")     or extra.get("main_products")     or []
    business_type     = feasibility_report.get("business_type")     or extra.get("business_type")     or "restaurant"

    capital           = feasibility_report.get("capital")           or extra.get("capital")           or ""
    avg_price         = feasibility_report.get("avg_price")         or extra.get("avg_price")         or ""
    customers_per_day = feasibility_report.get("customers_per_day") or extra.get("customers_per_day") or ""
    employees         = feasibility_report.get("employees")         or extra.get("employees")         or ""

    year_1_revenue = feasibility_report.get("year_1_revenue") or "" 
    year_2_revenue = feasibility_report.get("year_2_revenue") or ""
    year_3_revenue = feasibility_report.get("year_3_revenue") or ""
    funding_needed = feasibility_report.get("funding_needed") or extra.get("funding_needed") or ""
    payback        = feasibility_report.get("payback_period_months") or feasibility_report.get("payback_months") or ""
    profit_margin  = feasibility_report.get("profit_margin_percent") or ""
    monthly_profit = feasibility_report.get("monthly_net_profit")    or ""



    products_text = ", ".join(main_products) if isinstance(main_products, list) else str(main_products)

    # Funding allocation is precomputed here in Python (40/30/30 split) so
    # the AI cannot drift on the totals. The third bucket absorbs rounding.
    def _to_int(v):
        try:
            return int(float(str(v).replace(",", "").replace("SAR", "").strip()))
        except (ValueError, TypeError):
            return 0

    funding_int = _to_int(funding_needed)
    if funding_int > 0:
        equipment_amount  = round(funding_int * 0.40)
        fitout_amount     = round(funding_int * 0.30)
        working_amount    = funding_int - equipment_amount - fitout_amount # لان التقريب بيسوي مش بالضرورة يطلع المبلغ كامل، فبنخلي الباقي في bucket الثالث عشان نضمن ان المجموع يطلع مضبوط
      
      #نحولها لنص عشان نرسله للAi
        allocation_text = (
            f"- Equipment & Kitchen Setup: {equipment_amount:,} SAR\n"
            f"- Fit-out, Interior & Licenses: {fitout_amount:,} SAR\n"
            f"- Working Capital, Staffing & Marketing: {working_amount:,} SAR"
        )
        funding_display = f"{funding_int:,} SAR"
    else: # فاليديشن لو ماكان فيه راس مال او تمويل مطلوب، بنخلي النص عام بدون ارقام
        allocation_text = "- Equipment & Kitchen Setup\n- Fit-out, Interior & Licenses\n- Working Capital, Staffing & Marketing"
        funding_display = str(funding_needed) if funding_needed else "the required amount"


#---------------------------------------------------------------

    project_context = f"""
Project Data (use exactly as provided, do not change the project concept):
- Project Name: {project_name}
- Idea Description: {idea_description}
- Restaurant Type: {restaurant_type}
- Business Type: {business_type}
- City: {city}
- Target Customers: {target_customers}
- Main Products: {products_text}

Operational & Financial Data:
- Capital: {capital}
- Average Order Price: {avg_price}
- Expected Daily Customers: {customers_per_day}
- Expected Employees: {employees}

Available Financial Indicators:
- Payback Period (months): {payback}
- Profit Margin (%): {profit_margin}
- Monthly Net Profit: {monthly_profit}
- Year 1 Revenue: {year_1_revenue}
- Year 2 Revenue: {year_2_revenue}
- Year 3 Revenue: {year_3_revenue}
- Funding Needed: {funding_needed}

Important Rules:
- The project is always in the restaurant sector. All slides must be relevant to a restaurant only.
- Use the project name as the deck title if appropriate.
- If some numerical data is missing, use general phrasing without inventing numbers.
- Do not convert the project into an app, platform, or any other sector.
- ALL OUTPUT MUST BE IN ENGLISH ONLY. No Arabic text anywhere in the JSON.
"""

    prompt = f"""{project_context}

You are generating a professional Pitch Deck in ENGLISH for a restaurant startup based on a feasibility study.

Output must be valid JSON only, strictly following the provided JSON schema.
Do not add any text outside the JSON.

Core Rules:
- Exactly 8 slides.
- Each slide contains: title, subtitle, bullets, numbers.
- bullets: 0 to 3 only.
- numbers: 0 to 4, use [] if none.
- deck_title must be the project name or a suitable marketing name.
- tagline must be a short, powerful, catchy sentence (max 80 characters).

Writing Style:
- Professional English targeted at investors.
- Strong, concise titles (max 50 characters).
- Subtitles must be one short line (max 100 characters).
- Each bullet must be a brief phrase, MAX 75 characters. No full sentences, no run-ons.
- No lengthy explanations.

Slide Structure (mandatory order):
1) Cover       ← title only, cover data comes from deck_title and tagline
2) Problem     ← title + subtitle
3) Solution    ← title + subtitle + bullets (3)
4) Restaurant Concept ← title + subtitle + bullets (3)
   - bullets must describe the concept experience, NOT repeat raw data fields like "Restaurant type: X | Business type: Y"
   - focus on what makes the restaurant unique and memorable
5) Market Opportunity ← title + subtitle + bullets (3)
6) Financial Highlights ← title + numbers (3):
   - Year 1 Revenue (use year_1_revenue value exactly)
   - Year 2 Revenue (use year_2_revenue value exactly)
   - Year 3 Revenue (use year_3_revenue value exactly)
   Do not write "N/A" if the numbers are available.
7) Competitive Advantage ← title + subtitle + bullets (3)
8) Investment Ask ← title + subtitle + numbers (3 allocation items)
   - subtitle must be exactly: "Seeking {funding_display} to launch {project_name}"
   - Use these EXACT pre-computed allocation amounts (do not change the numbers):
{allocation_text}
   - Each number entry must have:
     * label = the category name (e.g. "Equipment & Kitchen Setup")
     * value = the numeric amount only (e.g. "200000"), no commas, no "SAR" suffix
"""

    # Call OpenAI with strict JSON schema enforcement so the response is
    # guaranteed to have the required slide structure.
    try:
        response = client.responses.create(
            model="gpt-4o",
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
    except OpenAIError as e:
        logger.exception("ai_pitch_engine: OpenAI call failed")
        raise PitchServiceUnavailable(f"AI service unavailable: {e}") from e
    except Exception as e:
        logger.exception("ai_pitch_engine: unexpected error")
        raise PitchServiceUnavailable(f"Unexpected error: {e}") from e

    try:
        deck = json.loads(response.output_text)
    except (json.JSONDecodeError, AttributeError, TypeError) as e:
        logger.exception("ai_pitch_engine: invalid JSON from AI")
        raise PitchResponseInvalid(f"AI returned invalid JSON: {e}") from e

    if not isinstance(deck, dict):
        raise PitchResponseInvalid("AI returned a non-object JSON value")
    if "slides" not in deck:
        raise PitchResponseInvalid("AI response missing required 'slides' field")

    # Attach funding_needed outside the schema so ppt_builder can use it for
    # the TOTAL_AMOUNT placeholder on the Investment Ask slide.
    if funding_int > 0:
        deck["funding_needed"] = funding_int
    return deck
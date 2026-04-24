# ai_pitch_engine.py

from openai import OpenAI
import json
from pitch_schema import PITCH_SCHEMA

client = OpenAI()

def generate_pitch_deck_json(feasibility_report: dict, extra: dict | None = None):
    extra = extra or {}

    # بيانات المشروع
    project_name      = feasibility_report.get("project_name")      or extra.get("project_name")      or ""
    idea_description  = feasibility_report.get("idea_description")  or extra.get("idea_description")  or ""
    restaurant_type   = feasibility_report.get("restaurant_type")   or extra.get("restaurant_type")   or ""
    city              = feasibility_report.get("city")              or extra.get("city")              or ""
    target_customers  = feasibility_report.get("target_customers")  or extra.get("target_customers")  or ""
    main_products     = feasibility_report.get("main_products")     or extra.get("main_products")     or []
    business_type     = feasibility_report.get("business_type")     or extra.get("business_type")     or "restaurant"

    # بيانات تشغيلية
    capital           = feasibility_report.get("capital")           or extra.get("capital")           or ""
    avg_price         = feasibility_report.get("avg_price")         or extra.get("avg_price")         or ""
    customers_per_day = feasibility_report.get("customers_per_day") or extra.get("customers_per_day") or ""
    employees         = feasibility_report.get("employees")         or extra.get("employees")         or ""

    # بيانات مالية محسوبة
    year_1_revenue = feasibility_report.get("year_1_revenue") or ""
    year_2_revenue = feasibility_report.get("year_2_revenue") or ""
    year_3_revenue = feasibility_report.get("year_3_revenue") or ""
    funding_needed = feasibility_report.get("funding_needed") or extra.get("funding_needed") or ""
    payback        = feasibility_report.get("payback_period_months") or feasibility_report.get("payback_months") or ""
    profit_margin  = feasibility_report.get("profit_margin_percent") or ""
    monthly_profit = feasibility_report.get("monthly_net_profit")    or ""

    products_text = ", ".join(main_products) if isinstance(main_products, list) else str(main_products)

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
- tagline must be a short, powerful, catchy sentence.

Writing Style:
- Professional English targeted at investors.
- Strong, concise titles.
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
   - subtitle must explicitly state the total funding needed as: "Seeking [amount] SAR to launch [project name]"
   - Write the amount with commas, never as a decimal (e.g. 500,000 SAR not 500000.0)
   - Split the total into 3 realistic allocation items with actual SAR amounts that add up to the total:
     * Equipment & Kitchen Setup: ~40% of total
     * Fit-out, Interior & Licenses: ~30% of total
     * Working Capital, Staffing & Marketing: ~30% of total
   - Each number must have a label and a real SAR value, not "Portion of X"
"""

    response = client.responses.create(
        model="gpt-5.2",
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

    return json.loads(response.output_text)
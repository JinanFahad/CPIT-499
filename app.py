from flask import Flask, request, jsonify
from financial_engine import calculate_financials
from decision_engine import classify_project
from ai_report_engine import generate_feasibility_report

app = Flask(__name__)

@app.route("/")
def home():
    return "Muqaddim Backend Running"

@app.post("/api/feasibility/calculate")
def calculate():
    data = request.get_json()

    financials = calculate_financials(data)
    decision = classify_project(
        profit_margin_percent=financials["profit_margin_percent"],
        payback_months=financials["payback_period_months"]
    )

    return jsonify({"financials": financials, "decision": decision})

@app.post("/api/feasibility/report-json")
def report_json():
    data = request.get_json()

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
    return jsonify(report)

if __name__ == "__main__":
    app.run(debug=True)
from flask import Flask, request, jsonify
from financial_engine import calculate_financials
from decision_engine import classify_project

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

    return jsonify({
        "financials": financials,
        "decision": decision
    })

if __name__ == "__main__":
    app.run(debug=True)

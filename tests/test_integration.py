# =====================================================================
# test_integration.py — Integration Test for Muqaddim Platform
# Tests that multiple core engines work together correctly as a pipeline.
# Pipeline tested:  Validator → Financial Engine → Decision Engine
# =====================================================================

import pytest

from core.validators import validate_feasibility_input
from engines.financial_engine import calculate_financials
from engines.decision_engine import classify_project


def test_full_feasibility_pipeline():
    """End-to-end: validator accepts input → financial engine calculates →
    decision engine classifies. Verifies that the output of each component
    flows correctly into the next, without focusing on specific values."""
    # Step 0 — Realistic user input (a small café in Riyadh)
    user_input = {
        "business_type":     "cafe",
        "capital":           200000,
        "rent":              5000,
        "employees":         3,
        "avg_price":         30,
        "customers_per_day": 50,
        "cogs_known":        False,
    }
    # Step 1 — Validator must accept the input
    is_valid, error = validate_feasibility_input(user_input)
    assert is_valid is True
    assert error == ""
    # Step 2 — Financial engine must compute a complete result
    financials = calculate_financials(user_input)
    assert "profit_margin_percent" in financials
    assert "payback_period_months" in financials
    assert "success_prediction"    in financials

    # Step 3 — Decision engine must classify based on the financial output
    decision = classify_project(
        profit_margin_percent=financials["profit_margin_percent"],
        payback_months=financials["payback_period_months"],
        success_prediction=financials["success_prediction"],
    )
    assert "classification" in decision
    assert "score"          in decision
    assert isinstance(decision["score"], int)

##--------------------------------------------------------------
def test_unprofitable_project_classified_as_risky():
    """Negative path: a clearly unprofitable project (small capital, high rent,
    few customers, low price) must pass validation but be classified by the
    decision engine as NOT 'مناسب للاستثمار'. This proves the pipeline
    correctly distinguishes bad projects from good ones."""
    # Step 0 — Realistic but unprofitable input (minimums met, economics broken)
    bad_input = {
        "business_type":     "cafe",
        "capital":           50000,    # small capital
        "rent":              15000,    # rent eats 30% of capital monthly
        "employees":         3,
        "avg_price":         10,       # low ticket size
        "customers_per_day": 5,        # very few customers
        "cogs_known":        False,
    }
    # Step 1 — Validator must still ACCEPT (inputs are syntactically valid)
    is_valid, error = validate_feasibility_input(bad_input)
    assert is_valid is True
    assert error == ""

    # Step 2 — Financial engine must compute (numbers may be ugly, but no crash)
    financials = calculate_financials(bad_input)
    assert "profit_margin_percent" in financials
    assert "success_prediction"    in financials

    # Step 3 — Decision engine must classify this as risky, not investable
    decision = classify_project(
        profit_margin_percent=financials["profit_margin_percent"],
        payback_months=financials["payback_period_months"],
        success_prediction=financials["success_prediction"],
    )
    assert decision["classification"] != "مناسب للاستثمار"
    assert decision["score"] <= 2

##--------------------------------------------------------------
def test_financial_to_pdf_pipeline():
    """End-to-end: financial engine → decision engine → AI report (mocked)
    → PDF generator must produce a valid PDF file. The AI step is mocked
    because it depends on an external service (OpenAI), but the rest of
    the pipeline runs against real code."""
    pytest.importorskip("playwright.sync_api")
    from generators.pdf_generator import build_feasibility_pdf
    # Step 1 — Real financial calculation
    user_input = {
        "business_type":     "cafe",
        "capital":           200000,
        "rent":              5000,
        "employees":         3,
        "avg_price":         30,
        "customers_per_day": 50,
        "cogs_known":        False,
    }
    financials = calculate_financials(user_input)
    # Step 2 — Real decision classification
    decision = classify_project(
        profit_margin_percent=financials["profit_margin_percent"],
        payback_months=financials["payback_period_months"],
        success_prediction=financials["success_prediction"],
    )
    # Step 3 — Mock the AI report (avoids OpenAI calls during testing)
    mocked_report = _build_mock_ai_report(user_input, financials, decision)
    # Step 4 — Real PDF generation from the (real + mocked) data above
    pdf_bytes = build_feasibility_pdf(mocked_report)

    # The output must be a non-trivial PDF file (signature + reasonable size)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes[:4] == b"%PDF"
    assert len(pdf_bytes) > 1000


# ──────────────────────────────────────────────────────────────────────
# Helpers — auxiliary data builders kept out of the test body for clarity.
# ──────────────────────────────────────────────────────────────────────
def _build_mock_ai_report(user_input: dict, financials: dict, decision: dict) -> dict:
    """Builds a fixed report dict that mirrors the keys consumed by
    report_template.html. Used to mock the OpenAI step in PDF integration tests."""
    return {
        "title": "دراسة جدوى — كافيه في الرياض",
        "executive_summary": {
            "verdict":         "مشروع واعد بشروط واضحة.",
            "highlights":      ["موقع قوي", "هامش ربح صحي", "استرداد معقول"],
            "key_concern":     "حساسية للإيجار.",
            "key_opportunity": "نمو الطلب على المقاهي.",
        },
        "business_overview": {
            "business_type":     "كافيه",
            "restaurant_type":   "مقهى",
            "city":              "الرياض",
            "target_customers":  "موظفون وطلاب",
            "value_proposition": "قهوة مختصة بسعر مناسب",
            "main_products":     ["قهوة", "حلويات"],
        },
        "market_analysis": {
            "narrative":                 "السوق متوسط التنافس.",
            "competition_level":         "متوسط",
            "market_opportunity_score":  70,
            "direct_competitor_summary": {
                "count":          5,
                "avg_rating":     4.2,
                "strongest_name": "Café X",
                "weakest_gap":    "خدمة بطيئة",
            },
            "bullets":         ["ميزة سعرية", "موقع مناسب"],
            "recommendations": ["ركز على القهوة المختصة"],
        },
        "financial_summary": {
            "monthly_revenue":       financials.get("monthly_revenue", 0),
            "monthly_expenses":      financials.get("monthly_expenses", 0),
            "monthly_net_profit":    financials.get("monthly_net_profit", 0),
            "profit_margin_percent": financials["profit_margin_percent"],
            "break_even_revenue":    financials.get("break_even_revenue", 0),
            "payback_period_months": financials["payback_period_months"],
            "utilities_cost":        financials.get("utilities_cost", 0),
            "overhead_cost":         financials.get("overhead_cost", 0),
            "marketing_cost":        financials.get("marketing_cost", 0),
            "ramp_up_months":        financials.get("ramp_up_months", 6),
            "inputs_summary": {
                "capital":           user_input["capital"],
                "rent":              user_input["rent"],
                "employees":         user_input["employees"],
                "avg_price":         user_input["avg_price"],
                "customers_per_day": user_input["customers_per_day"],
            },
        },
        "decision": {
            "classification": decision["classification"],
            "score":          decision["score"],
        },
        "risks_and_mitigations": [
            {"risk": "ارتفاع الإيجار", "mitigation": "عقد طويل الأمد"},
        ],
        "next_steps": [
            "إعداد خطة تسويق",
            "تأمين المورّدين",
        ],
    }
